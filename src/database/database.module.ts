import { Global, Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export const DB = Symbol('DRIZZLE_DB');
export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

@Global()
@Module({
  providers: [
    {
      provide: DB,
      inject: [ConfigService],
      useFactory: (config: ConfigService): DrizzleDB => {
        const url = config.getOrThrow<string>('DATABASE_URL');
        const logger = new Logger('Database');
        logger.log('Connecting to Postgres…');
        const pool = new Pool({ connectionString: url });
        return drizzle(pool, { schema, logger: false });
      },
    },
  ],
  exports: [DB],
})
export class DatabaseModule {}
