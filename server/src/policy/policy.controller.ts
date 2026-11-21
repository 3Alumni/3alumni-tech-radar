import { Controller, Get } from "@nestjs/common";
import { MetricsService } from "../core/metrics.service";

@Controller("policy")
export class PolicyController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  list() {
    return this.metrics.latest("E");
  }
}
