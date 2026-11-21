import { Controller, Get } from "@nestjs/common";
import { DemandService } from "./demand.service";

@Controller("demand")
export class DemandController {
  constructor(private readonly demand: DemandService) {}

  @Get()
  list() {
    return this.demand.list();
  }
}
