import { Injectable } from "@nestjs/common";
import { ConfigService } from "./config.service";
import { ConnectorRegistry } from "./connector-registry.service";
import { Metric } from "./metric";
import { MetricsService } from "./metrics.service";

@Injectable()
export class RefreshService {
  private running = false;

  constructor(
    private readonly registry: ConnectorRegistry,
    private readonly config: ConfigService,
    private readonly metricsStore: MetricsService,
  ) {}

  async run(): Promise<Metric[]> {
    if (this.running) {
      throw new Error("A refresh is already running");
    }
    this.running = true;
    try {
      return await this.collect();
    } finally {
      this.running = false;
    }
  }

  private async collect(): Promise<Metric[]> {
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
    const files = this.registry.all().flatMap((connector) => connector.takenFiles ?? []);
    await this.metricsStore.save(metrics, files);
    for (const connector of this.registry.all()) {
      if (connector.takenFiles) {
        connector.takenFiles = [];
      }
    }
    return metrics;
  }
}
