import { Module } from "@nestjs/common";
import { AdzunaConnector } from "./adzuna.connector";
import { BfsConnector } from "./bfs.connector";
import { DemandController } from "./demand.controller";
import { DemandService } from "./demand.service";

@Module({
  controllers: [DemandController],
  providers: [DemandService, AdzunaConnector, BfsConnector],
})
export class DemandModule {
  constructor(
    private readonly adzuna: AdzunaConnector,
    private readonly bfs: BfsConnector,
  ) {}
}
