import { Controller, Get } from "@nestjs/common";
import { StoreService } from "../core/store.service";

@Controller("skills")
export class SkillsController {
  constructor(private readonly store: StoreService) {}

  @Get()
  list() {
    return this.store.latest("B");
  }
}
