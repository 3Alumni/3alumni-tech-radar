import { Global, Module } from "@nestjs/common";
import { ConfigService } from "./config.service";
import { ConnectorRegistry } from "./connector-registry.service";
import { DbService } from "./db.service";
import { RefreshController } from "./refresh.controller";
import { RefreshService } from "./refresh.service";
import { StoreService } from "./store.service";

@Global()
@Module({
  controllers: [RefreshController],
  providers: [DbService, ConfigService, StoreService, ConnectorRegistry, RefreshService],
  exports: [DbService, ConfigService, StoreService, ConnectorRegistry],
})
export class CoreModule {}
