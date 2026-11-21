import { Controller, Get } from "@nestjs/common";
import { RegistryService } from "./registry.service";

@Controller("sources")
export class SourcesController {
  constructor(private readonly registry: RegistryService) {}

  @Get()
  list() {
    return this.registry.sources();
  }
}
