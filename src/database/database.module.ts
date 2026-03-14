import { Global, Module, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

export const DB = Symbol("DRIZZLE_DB");
export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

@Global()
@Module({
  providers: [
    {
      provide: DB,
      inject: [ConfigService],
      useFactory: (config: ConfigService): DrizzleDB => {
        const url = config.getOrThrow<string>("DATABASE_URL");
        const logger = new Logger("Database");
        logger.log("Connecting to Neon Postgres…");
        const sql = neon(url);
        return drizzle(sql, { schema, logger: false });
      },
    },
  ],
  exports: [DB],
})
export class DatabaseModule {}
