import { Controller, Get, Query } from "@nestjs/common";
import { EmployersService } from "./employers.service";

@Controller("employers")
export class EmployersController {
  constructor(private readonly employers: EmployersService) {}

  @Get()
  list(@Query("role") role?: string) {
    return this.employers.list(role);
  }
}
