import { Module } from "@nestjs/common";
import { RegistryModule } from "../registry/registry.module";
import { SkillsService } from "./skills.service";

@Module({
  imports: [RegistryModule],
  providers: [SkillsService],
  exports: [SkillsService],
})
export class SkillsModule {}
