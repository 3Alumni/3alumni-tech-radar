import { Global, Module } from "@nestjs/common";
import { ConfigService } from "./config.service";
import { ConnectorRegistry } from "./connector-registry.service";
import { RefreshController } from "./refresh.controller";
import { RefreshService } from "./refresh.service";
import { StoreService } from "./store.service";

@Global()
@Module({
  controllers: [RefreshController],
  providers: [ConfigService, StoreService, ConnectorRegistry, RefreshService],
  exports: [ConfigService, StoreService, ConnectorRegistry],
})
export class CoreModule {}
