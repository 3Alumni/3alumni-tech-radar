import { Module } from "@nestjs/common";
import { FedlexConnector } from "./fedlex.connector";
import { PolicyController } from "./policy.controller";

@Module({
  controllers: [PolicyController],
  providers: [FedlexConnector],
})
export class PolicyModule {
  constructor(private readonly fedlex: FedlexConnector) {}
}
