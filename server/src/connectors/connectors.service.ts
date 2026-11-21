import { Inject, Injectable } from "@nestjs/common";
import { Metric } from "../metrics/metric";
import { RegistryService } from "../registry/registry.service";
import { StoreService } from "../store/store.service";
import { Connector } from "./connector";
import { CONNECTORS } from "./connectors.token";

@Injectable()
export class ConnectorsService {
  constructor(
    @Inject(CONNECTORS) private readonly connectors: Connector[],
    private readonly registry: RegistryService,
    private readonly store: StoreService,
  ) {}

  async refresh(): Promise<Metric[]> {
    const enabled = new Set(
      this.registry
        .sources()
        .filter((source) => source.enabled)
        .map((source) => source.id),
    );
    const metrics: Metric[] = [];
    for (const connector of this.connectors) {
      if (!enabled.has(connector.id)) {
        continue;
      }
      metrics.push(...(await connector.fetch()));
    }
    this.store.replace(metrics);
    return metrics;
  }
}
