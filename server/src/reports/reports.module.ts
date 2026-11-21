import { Module } from "@nestjs/common";
import { EmployersModule } from "../employers/employers.module";
import { SkillsModule } from "../skills/skills.module";
import { SummariesModule } from "../summaries/summaries.module";
import { ReportsService } from "./reports.service";
import { QuestionsController, TopicsController } from "./topics.controller";

@Module({
  imports: [SummariesModule, SkillsModule, EmployersModule],
  controllers: [TopicsController, QuestionsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
