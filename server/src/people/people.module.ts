import { Module } from "@nestjs/common";
import { PeopleController } from "./people.controller";
import { SemConnector } from "./sem.connector";

@Module({
  controllers: [PeopleController],
  providers: [SemConnector],
})
export class PeopleModule {
  constructor(private readonly sem: SemConnector) {}
}
