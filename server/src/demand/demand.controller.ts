import { Controller, Get } from "@nestjs/common";
import { StoreService } from "../core/store.service";

@Controller("demand")
export class DemandController {
  constructor(private readonly store: StoreService) {}

  @Get()
  list() {
    return this.store.latest("A");
  }
}
