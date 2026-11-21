import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "../core/config.service";
import { StoreService } from "../core/store.service";

@Controller("sources")
export class SourcesController {
  constructor(
    private readonly config: ConfigService,
    private readonly store: StoreService,
  ) {}

  @Get()
  list() {
    const snapshot = this.store.snapshot();
    return this.config.sources().map((source) => {
      const metrics = snapshot.filter((metric) => metric.sourceId === source.id);
      const fetchedAt = metrics.reduce<string | null>((latest, metric) => {
        if (!latest || metric.fetchedAt > latest) {
          return metric.fetchedAt;
        }
        return latest;
      }, null);
      return {
        ...source,
        metricCount: metrics.length,
        fetchedAt,
      };
    });
  }
}
