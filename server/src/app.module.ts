import { Module } from "@nestjs/common";
import { CoreModule } from "./core/core.module";
import { DemandModule } from "./demand/demand.module";
import { EmployersModule } from "./employers/employers.module";
import { PeopleModule } from "./people/people.module";
import { PolicyModule } from "./policy/policy.module";
import { ReportsModule } from "./reports/reports.module";
import { SkillsModule } from "./skills/skills.module";
import { SourcesModule } from "./sources/sources.module";
import { SummariesModule } from "./summaries/summaries.module";

@Module({
  imports: [
    CoreModule,
    DemandModule,
    SkillsModule,
    EmployersModule,
    PeopleModule,
    PolicyModule,
    SourcesModule,
    SummariesModule,
    ReportsModule,
  ],
})
export class AppModule {}
