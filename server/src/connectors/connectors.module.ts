import { Module } from "@nestjs/common";
import { RegistryModule } from "../registry/registry.module";
import { StoreModule } from "../store/store.module";
import { AdzunaConnector } from "./adzuna/adzuna.connector";
import { BfsConnector } from "./bfs/bfs.connector";
import { Connector } from "./connector";
import { ConnectorsService } from "./connectors.service";
import { CONNECTORS } from "./connectors.token";
import { RefreshController } from "./refresh.controller";

export { CONNECTORS };

@Module({
  imports: [RegistryModule, StoreModule],
  controllers: [RefreshController],
  providers: [
    AdzunaConnector,
    BfsConnector,
    {
      provide: CONNECTORS,
      useFactory: (...connectors: Connector[]) => connectors,
      inject: [AdzunaConnector, BfsConnector],
    },
    ConnectorsService,
  ],
  exports: [ConnectorsService],
})
export class ConnectorsModule {}
