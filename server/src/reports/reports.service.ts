import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "../core/config.service";
import { TopicConfig } from "../core/config.types";
import { MetricsService } from "../core/metrics.service";
import { Briefing, SummariesService } from "../summaries/summaries.service";

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
}
