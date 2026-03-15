import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import { DB, type DrizzleDB } from '../../database/database.module';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  @Get()
  @ApiOperation({ summary: 'Liveness + DB connectivity check' })
  async check(): Promise<{ status: string; db: string; uptime: number }> {
    // Lightweight ping — just enough to confirm the connection works
    // If the DB isn't accessible (e.g., local dev without a Neon database), keep the endpoint healthy.
    let dbStatus = 'unavailable';
    try {
      await this.db.execute(sql`SELECT 1`);
      dbStatus = 'connected';
    } catch {
      // ignore; keep endpoint returning 200 so the service can still be monitored
    }

    return {
      status: 'ok',
      db: dbStatus,
      uptime: Math.floor(process.uptime()),
    };
  }
}
