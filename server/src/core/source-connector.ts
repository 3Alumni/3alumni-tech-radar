import { Injectable } from "@nestjs/common";
import { Connector } from "./connector";
import { ConnectorRegistry } from "./connector-registry.service";
import { Metric } from "./metric";

@Injectable()
export abstract class SourceConnector implements Connector {
  abstract readonly id: string;

  constructor(registry: ConnectorRegistry) {
    registry.add(this);
  }

  abstract fetch(): Promise<Metric[]>;
}
