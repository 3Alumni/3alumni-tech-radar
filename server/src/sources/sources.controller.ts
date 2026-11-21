import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "../core/config.service";
import { MetricsService } from "../core/metrics.service";

@Controller("sources")
export class SourcesController {
  constructor(
    private readonly config: ConfigService,
    private readonly metrics: MetricsService,
  ) {}

  @Get()
  async list() {
    const sources = this.config.sources();
    return Promise.all(
      sources.map(async (source) => {
        const latest = await this.metrics.latestForSource(source.id);
        return {
          ...source,
          metricCount: latest.metricCount,
          fetchedAt: latest.fetchedAt,
        };
      }),
    );
  }
}
