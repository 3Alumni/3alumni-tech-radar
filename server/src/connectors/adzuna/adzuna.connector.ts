import { Injectable } from "@nestjs/common";
import { Metric } from "../../metrics/metric";
import { Connector } from "../connector";

@Injectable()
export class AdzunaConnector implements Connector {
  readonly id = "adzuna";

  fetch(): Promise<Metric[]> {
    return Promise.resolve([]);
  }
}
