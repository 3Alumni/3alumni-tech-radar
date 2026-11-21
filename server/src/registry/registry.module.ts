import { Module } from "@nestjs/common";
import { RegistryService } from "./registry.service";
import { SourcesController } from "./sources.controller";

@Module({
  controllers: [SourcesController],
  providers: [RegistryService],
  exports: [RegistryService],
})
export class RegistryModule {}
