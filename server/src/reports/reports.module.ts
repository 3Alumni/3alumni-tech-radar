import { Module } from "@nestjs/common";
import { SummariesModule } from "../summaries/summaries.module";
import { ReportsService } from "./reports.service";
import { QuestionsController, TopicsController } from "./topics.controller";

@Module({
  imports: [SummariesModule],
  controllers: [TopicsController, QuestionsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
