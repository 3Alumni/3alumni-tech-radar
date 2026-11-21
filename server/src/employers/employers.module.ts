import { Module } from "@nestjs/common";
import { RegistryModule } from "../registry/registry.module";
import { EmployersService } from "./employers.service";

@Module({
  imports: [RegistryModule],
  providers: [EmployersService],
  exports: [EmployersService],
})
export class EmployersModule {}
