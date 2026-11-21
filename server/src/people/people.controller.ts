import { Controller, Get } from "@nestjs/common";
import { StoreService } from "../core/store.service";

@Controller("people")
export class PeopleController {
  constructor(private readonly store: StoreService) {}

  @Get()
  list() {
    return this.store.latest("D");
  }
}
