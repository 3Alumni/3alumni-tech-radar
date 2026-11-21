import { Controller, Get } from "@nestjs/common";
import { StoreService } from "../core/store.service";

@Controller("employers")
export class EmployersController {
  constructor(private readonly store: StoreService) {}

  @Get()
  list() {
    return this.store.latest("C");
  }
}
