import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "../core/config.service";

@Controller("sources")
export class SourcesController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  list() {
    return this.config.sources();
  }
}
