import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { and, eq, ilike, or, inArray, sql, asc } from 'drizzle-orm';
import type { DrizzleDB } from '../../database/database.module';
import { DB } from '../../database/database.module';
import * as schema from '../../database/schema';
import type {
  CreateProspectDto,
  UpdateProspectDto,
  ProspectQueryDto,
  BulkAssignDto,
} from './prospects.dto';

function empToNumber(emp: string): number {
  return parseInt(String(emp || '').replace(/[^0-9]/g, ''), 10) || 0;
}

function matchesEmpRange(emp: string, range: string): boolean {
  const n = empToNumber(emp);
  if (isNaN(n)) return false;
  if (range === '1-50') return n >= 1 && n <= 50;
  if (range === '51-200') return n >= 51 && n <= 200;
  if (range === '201-500') return n >= 201 && n <= 500;
  if (range === '501-1000') return n >= 501 && n <= 1000;
  if (range === '1001-5000') return n >= 1001 && n <= 5000;
  if (range === '5001+') return n >= 5001;
  return true;
}

@Injectable()
export class ProspectsService {
  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  async findAll(query: ProspectQueryDto): Promise<{
    data: schema.ProspectRow[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      search,
      heat,
      sector,
      country,
      sdrId,
      empRange,
      page = 1,
      perPage = 20,
    } = query;

    // Build where conditions
    const conditions: any[] = [];

    if (search) {
      conditions.push(
        or(
          ilike(schema.prospects.co, `%${search}%`),
          ilike(schema.prospects.signal, `%${search}%`),
          ilike(schema.prospects.hq, `%${search}%`),
        )!,
      );
    }
    if (heat && heat !== 'All') {
      conditions.push(
        eq(schema.prospects.heat, heat as schema.ProspectRow['heat']),
      );
    }
    if (sector && sector !== 'All Sectors') {
      conditions.push(eq(schema.prospects.sector, sector));
    }
    if (country && country !== 'All') {
      conditions.push(eq(schema.prospects.country, country));
    }

    // Fetch all matching rows (emp range filtering is in-memory due to string format)
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    let rows = await this.db
      .select()
      .from(schema.prospects)
      .where(where)
      .orderBy(asc(schema.prospects.id));

    // SDR filter — requires join on assignments
    if (sdrId && sdrId !== 'All') {
      const assignmentRows = await this.db
        .select({ prospectId: schema.assignments.prospectId })
        .from(schema.assignments);

      const assignedIds = new Set(assignmentRows.map((a) => a.prospectId));

      if (sdrId === 'Unassigned') {
        rows = rows.filter((p) => !assignedIds.has(p.id));
      } else {
        const sdrNum = parseInt(sdrId, 10);
        const sdrAssigned = await this.db
          .select({ prospectId: schema.assignments.prospectId })
          .from(schema.assignments)
          .where(eq(schema.assignments.sdrId, sdrNum));
        const sdrSet = new Set(sdrAssigned.map((a) => a.prospectId));
        rows = rows.filter((p) => sdrSet.has(p.id));
      }
    }

    // Emp range filter (in-memory — emp is stored as a formatted string)
    if (empRange && empRange !== 'All') {
      rows = rows.filter((p) => matchesEmpRange(p.emp ?? '', empRange));
    }

    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const offset = (page - 1) * perPage;
    const data = rows.slice(offset, offset + perPage);

    return { data, total, page, totalPages };
  }

  async findOne(id: number): Promise<schema.ProspectRow> {
    const [row] = await this.db
      .select()
      .from(schema.prospects)
      .where(eq(schema.prospects.id, id))
      .limit(1);

    if (!row) throw new NotFoundException(`Prospect #${id} not found`);
    return row;
  }

  async create(dto: CreateProspectDto): Promise<schema.ProspectRow> {
    const [row] = await this.db
      .insert(schema.prospects)
      .values({
        co: dto.co,
        country: dto.country ?? 'US',
        sector: dto.sector ?? 'Industrial',
        heat: dto.heat ?? 'Warm',
        date: dto.date,
        emp: dto.emp,
        hq: dto.hq,
        signal: dto.signal,
        contact: dto.contact,
        title: dto.title,
        email: dto.email,
      })
      .returning();

    return row;
  }

  async update(
    id: number,
    dto: UpdateProspectDto,
  ): Promise<schema.ProspectRow> {
    await this.findOne(id); // ensure exists

    const [row] = await this.db
      .update(schema.prospects)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.prospects.id, id))
      .returning();

    return row;
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.db.delete(schema.prospects).where(eq(schema.prospects.id, id));
  }

  async bulkImport(rows: CreateProspectDto[]): Promise<{ imported: number }> {
    if (!rows.length) return { imported: 0 };

    const values: schema.NewProspect[] = rows.map((r) => ({
      co: r.co || 'Unnamed Company',
      country: r.country ?? 'US',
      sector: r.sector ?? 'Industrial',
      heat: (['Hot', 'Warm', 'Cool'].includes(r.heat ?? '')
        ? r.heat
        : 'Warm') as schema.ProspectRow['heat'],
      date: r.date,
      emp: r.emp,
      hq: r.hq,
      signal: r.signal,
      contact: r.contact,
      title: r.title,
      email: r.email,
    }));

    const inserted = await this.db
      .insert(schema.prospects)
      .values(values)
      .returning({ id: schema.prospects.id });

    return { imported: inserted.length };
  }

  async bulkAssign(dto: BulkAssignDto): Promise<{ updated: number }> {
    if (!dto.prospectIds.length) return { updated: 0 };

    if (dto.sdrId == null) {
      // Unassign
      await this.db
        .delete(schema.assignments)
        .where(inArray(schema.assignments.prospectId, dto.prospectIds));
      return { updated: dto.prospectIds.length };
    }

    // Upsert assignments for each prospect
    const values = dto.prospectIds.map((pid) => ({
      prospectId: pid,
      sdrId: dto.sdrId as number,
    }));

    await this.db
      .insert(schema.assignments)
      .values(values)
      .onConflictDoUpdate({
        target: schema.assignments.prospectId,
        set: { sdrId: dto.sdrId as number, assignedAt: new Date() },
      });

    return { updated: dto.prospectIds.length };
  }

  async getStats(): Promise<{
    total: number;
    hot: number;
    assigned: number;
    bySector: Record<string, number>;
    byHeat: Record<string, number>;
  }> {
    const allProspects = await this.db.select().from(schema.prospects);
    const allAssigned = await this.db
      .select({ pid: schema.assignments.prospectId })
      .from(schema.assignments);
    const assignedSet = new Set(allAssigned.map((a) => a.pid));

    const bySector: Record<string, number> = {};
    const byHeat: Record<string, number> = {};
    let hot = 0;

    for (const p of allProspects) {
      bySector[p.sector] = (bySector[p.sector] ?? 0) + 1;
      byHeat[p.heat] = (byHeat[p.heat] ?? 0) + 1;
      if (p.heat === 'Hot') hot++;
    }

    return {
      total: allProspects.length,
      hot,
      assigned: assignedSet.size,
      bySector,
      byHeat,
    };
  }
}
