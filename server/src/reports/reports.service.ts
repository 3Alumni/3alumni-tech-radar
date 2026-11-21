import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "../core/config.service";
import { TopicConfig } from "../core/config.types";
import { MetricsService } from "../core/metrics.service";
import { Question } from "../core/metric";
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
    const records = await this.metrics.latest(question as Question);
    return this.summaries.draft(records, title);
  }
}
