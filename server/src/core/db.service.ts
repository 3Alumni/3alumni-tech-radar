import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Pool } from "pg";

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  readonly pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ?? "postgres://radar:radar@localhost:5433/radar",
  });

  async onModuleInit() {
    await this.pool.query("select 1");
  }

  onModuleDestroy() {
    return this.pool.end();
  }
}
