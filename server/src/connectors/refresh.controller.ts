import { Controller, Post } from "@nestjs/common";
import { ConnectorsService } from "./connectors.service";

@Controller("refresh")
export class RefreshController {
  constructor(private readonly connectors: ConnectorsService) {}

  @Post()
  async run() {
    const metrics = await this.connectors.refresh();
    return { count: metrics.length, metrics };
  }
}
