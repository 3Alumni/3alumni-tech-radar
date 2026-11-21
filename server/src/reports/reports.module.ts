import { Module } from "@nestjs/common";
import { SummariesModule } from "../summaries/summaries.module";
import { ReportsService } from "./reports.service";
import { TopicsController } from "./topics.controller";

@Module({
  imports: [SummariesModule],
  controllers: [TopicsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
