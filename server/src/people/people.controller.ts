import { Controller, Get } from "@nestjs/common";
import { MetricsService } from "../core/metrics.service";

@Controller("people")
export class PeopleController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  list() {
    return this.metrics.latest("D");
  }
}
