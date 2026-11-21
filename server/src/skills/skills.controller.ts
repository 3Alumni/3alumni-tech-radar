import { Controller, Get, Query } from "@nestjs/common";
import { SkillsService } from "./skills.service";

@Controller("skills")
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get()
  list(@Query("role") role?: string) {
    return this.skills.list(role);
  }
}
