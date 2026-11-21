import { Injectable, NotFoundException } from "@nestjs/common";
import { RegistryService } from "../registry/registry.service";
import { TopicConfig } from "../registry/registry.types";
import { StoreService } from "../store/store.service";
import { SummariesService } from "../summaries/summaries.service";

@Injectable()
export class ReportsService {
  constructor(
    private readonly registry: RegistryService,
    private readonly store: StoreService,
    private readonly summaries: SummariesService,
  ) {}

  topics(): TopicConfig[] {
    return this.registry.topics();
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
