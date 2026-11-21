import { Injectable } from "@nestjs/common";
import { ConfigService } from "./config.service";
import { ConnectorRegistry } from "./connector-registry.service";
import { Metric } from "./metric";
import { MetricsService } from "./metrics.service";
import { StoreService } from "./store.service";

@Injectable()
export class RefreshService {
  constructor(
    private readonly registry: ConnectorRegistry,
    private readonly config: ConfigService,
    private readonly store: StoreService,
    private readonly metricsStore: MetricsService,
  ) {}

  async run(): Promise<Metric[]> {
    const enabled = new Set(
      this.config
        .sources()
        .filter((source) => source.enabled)
        .map((source) => source.id),
    );
    const metrics: Metric[] = [];
    for (const connector of this.registry.all()) {
      if (!enabled.has(connector.id)) {
        continue;
      }
      metrics.push(...(await connector.fetch()));
    }
    await this.metricsStore.save(metrics);
    this.store.replace(metrics);
    return metrics;
  }
}
