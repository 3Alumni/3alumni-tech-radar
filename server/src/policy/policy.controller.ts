import { Controller, Get } from "@nestjs/common";
import { StoreService } from "../core/store.service";

@Controller("policy")
export class PolicyController {
  constructor(private readonly store: StoreService) {}

  @Get()
  list() {
    return this.store.latest("E");
  }
}
