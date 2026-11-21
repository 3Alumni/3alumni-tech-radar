import { Controller, Post } from "@nestjs/common";
import { RefreshService } from "./refresh.service";

@Controller("refresh")
export class RefreshController {
  constructor(private readonly refresh: RefreshService) {}

  @Post()
  async run() {
    const metrics = await this.refresh.run();
    return { count: metrics.length, metrics };
  }
}
