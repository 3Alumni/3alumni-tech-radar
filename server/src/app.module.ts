import { Module } from "@nestjs/common";
import { ConnectorsModule } from "./connectors/connectors.module";
import { EmployersModule } from "./employers/employers.module";
import { RegistryModule } from "./registry/registry.module";
import { ReportsModule } from "./reports/reports.module";
import { SkillsModule } from "./skills/skills.module";
import { StoreModule } from "./store/store.module";
import { SummariesModule } from "./summaries/summaries.module";

@Module({
  imports: [
    RegistryModule,
    StoreModule,
    ConnectorsModule,
    SkillsModule,
    EmployersModule,
    SummariesModule,
    ReportsModule,
  ],
})
export class AppModule {}
