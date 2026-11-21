import { Module } from "@nestjs/common";
import { RegistryModule } from "../registry/registry.module";
import { StoreModule } from "../store/store.module";
import { SummariesModule } from "../summaries/summaries.module";
import { ReportsService } from "./reports.service";
import { TopicsController } from "./topics.controller";

@Module({
  imports: [RegistryModule, StoreModule, SummariesModule],
  controllers: [TopicsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
