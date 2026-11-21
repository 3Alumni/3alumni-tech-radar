import { Module } from "@nestjs/common";
import { AdzunaConnector } from "./adzuna.connector";
import { BfsConnector } from "./bfs.connector";
import { DemandController } from "./demand.controller";

@Module({
  controllers: [DemandController],
  providers: [AdzunaConnector, BfsConnector],
})
export class DemandModule {
  constructor(
    private readonly adzuna: AdzunaConnector,
    private readonly bfs: BfsConnector,
  ) {}
}
