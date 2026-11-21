import { Injectable } from "@nestjs/common";
import { Connector } from "./connector";

@Injectable()
export class ConnectorRegistry {
  private readonly items: Connector[] = [];

  add(connector: Connector) {
    this.items.push(connector);
  }

  all(): Connector[] {
    return this.items;
  }
}
