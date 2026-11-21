import { Controller, Get, Param } from "@nestjs/common";
import { ReportsService } from "./reports.service";

@Controller("topics")
export class TopicsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  list() {
    return this.reports.topics();
  }

  @Get(":id/preview")
  preview(@Param("id") id: string) {
    return { id, text: this.reports.preview(id) };
  }
}
