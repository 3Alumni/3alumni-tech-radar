import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "../core/config.service";
import { TopicConfig } from "../core/config.types";
import { StoreService } from "../core/store.service";
import { SummariesService } from "../summaries/summaries.service";

@Injectable()
export class ReportsService {
  constructor(
    private readonly config: ConfigService,
    private readonly store: StoreService,
    private readonly summaries: SummariesService,
  ) {}

  topics(): TopicConfig[] {
    return this.config.topics();
  }

  preview(topicId: string): string {
    const topic = this.topics().find((item) => item.id === topicId);
    if (!topic) {
      throw new NotFoundException(`Unknown topic ${topicId}`);
    }
    const records = this.store
      .latest(topic.question)
      .filter((metric) => !topic.role || metric.role === topic.role);
    return this.summaries.draft(records);
  }
}
