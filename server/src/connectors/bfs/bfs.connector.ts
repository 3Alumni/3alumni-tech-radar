import { Injectable } from "@nestjs/common";
import { Metric } from "../../metrics/metric";
import { Connector } from "../connector";

@Injectable()
export class BfsConnector implements Connector {
  readonly id = "bfs";

  fetch(): Promise<Metric[]> {
    return Promise.resolve([]);
  }
}
