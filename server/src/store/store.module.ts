import { Module } from "@nestjs/common";
import { MetricsController } from "./metrics.controller";
import { StoreService } from "./store.service";

@Module({
  controllers: [MetricsController],
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule {}
