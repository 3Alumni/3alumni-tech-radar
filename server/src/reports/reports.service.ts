import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "../core/config.service";
import { TopicConfig } from "../core/config.types";
import { DbService } from "../core/db.service";
import { MetricsService } from "../core/metrics.service";
import { Metric, Question } from "../core/metric";
import { EmployersService } from "../employers/employers.service";
import { SkillsService } from "../skills/skills.service";
import { Briefing, SummariesService } from "../summaries/summaries.service";

const SECTION_TITLES: Partial<Record<Question, string>> = {
  A: "Demand",
  B: "Skills",
  C: "Employers",
  E: "Policy",
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly config: ConfigService,
    private readonly metrics: MetricsService,
    private readonly summaries: SummariesService,
    private readonly skills: SkillsService,
    private readonly employers: EmployersService,
    private readonly db: DbService,
  ) {}

  topics(): TopicConfig[] {
    return this.config.topics();
  }

  async preview(topicId: string): Promise<Briefing> {
    const topic = this.topics().find((item) => item.id === topicId);
    if (!topic) {
      throw new NotFoundException(`Unknown topic ${topicId}`);
    }
    const records = (await this.metrics.latest(topic.question)).filter(
      (metric) => !topic.role || metric.role === topic.role,
    );
    return this.summaries.draft(records, topic.title);
  }

  /** A letter section for one dashboard question, phrased from the latest stored rows. */
  async previewQuestion(question: string): Promise<Briefing> {
    const title = SECTION_TITLES[question as Question];
    if (!title) {
      throw new BadRequestException("Question must be A, B, C, or E");
    }
    const records = await this.recordsFor(question as Question);
    const focus = question === "E" ? "policy" : "market";
    return this.summaries.draft(records, title, focus);
  }

  /** Skills and employers are stored as postings, not as question B or C metrics. */
  private async recordsFor(question: Question): Promise<Metric[]> {
    if (question === "B") {
      return this.skillRecords();
    }
    if (question === "C") {
      return this.employerRecords();
    }
    return this.metrics.latest(question);
  }

  private async skillRecords(): Promise<Metric[]> {
    const listed = await this.skills.list();
    if (listed.basis.postings === 0) {
      return [];
    }
    const fetchedAt = await this.adzunaFetchedAt();
    const sourceUrl = listed.basis.sourceUrl;
    const records: Metric[] = [
      this.adzuna("B", "Job ads read for skills", listed.basis.postings, "ads", fetchedAt, sourceUrl),
    ];
    for (const skill of listed.esco.slice(0, 8)) {
      records.push(
        this.adzuna("B", skill.label, skill.count, "ads naming this skill", fetchedAt, skill.esco ?? listed.basis.dictionaryUrl),
      );
    }
    return records;
  }

  private async employerRecords(): Promise<Metric[]> {
    const listed = await this.employers.list();
    if (listed.basis.postings === 0) {
      return [];
    }
    const fetchedAt = await this.adzunaFetchedAt();
    const sourceUrl = listed.basis.sourceUrl;
    const records: Metric[] = [
      this.adzuna("C", "Saved job ads", listed.basis.postings, "ads", fetchedAt, sourceUrl),
      this.adzuna("C", "Companies to approach", listed.outreach.length, "companies", fetchedAt, sourceUrl),
      this.adzuna("C", "Recruitment agencies, excluded from outreach", listed.agencies.length, "companies", fetchedAt, sourceUrl),
    ];
    for (const company of listed.outreach.slice(0, 8)) {
      records.push(this.adzuna("C", company.company, company.postings, "ads", fetchedAt, company.urls[0] ?? sourceUrl));
    }
    return records;
  }

  private adzuna(
    question: Question,
    label: string,
    value: number,
    unit: string,
    fetchedAt: string,
    sourceUrl: string,
  ): Metric {
    return {
      label,
      value,
      unit,
      question,
      sourceId: "adzuna",
      sourceUrl,
      fetchedAt,
    };
  }

  private async adzunaFetchedAt(): Promise<string> {
    const result = await this.db.pool.query<{ fetched_at: Date | null }>(
      `SELECT max(fetched_at) AS fetched_at FROM postings`,
    );
    const value = result.rows[0]?.fetched_at;
    return value ? new Date(value).toISOString() : new Date().toISOString();
  }
}
