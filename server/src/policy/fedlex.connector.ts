import { Injectable } from "@nestjs/common";
import { ConnectorRegistry } from "../core/connector-registry.service";
import { Metric } from "../core/metric";
import { SourceConnector } from "../core/source-connector";

@Injectable()
export class FedlexConnector extends SourceConnector {
  readonly id = "fedlex";

  constructor(registry: ConnectorRegistry) {
    super(registry);
  }

  fetch(): Promise<Metric[]> {
    return Promise.resolve([]);
  }
}
