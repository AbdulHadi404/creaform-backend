import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DB, type DrizzleDB } from "@/database/database.module";
import * as schema from "@/database/schema";
import type { CreateSdrDto, UpdateSdrDto } from "./sdrs.dto";

@Injectable()
export class SdrsService {
  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  async findAll(): Promise<schema.SdrRow[]> {
    return this.db.select().from(schema.sdrs).orderBy(schema.sdrs.id);
  }

  async findOne(id: number): Promise<schema.SdrRow> {
    const [row] = await this.db
      .select()
      .from(schema.sdrs)
      .where(eq(schema.sdrs.id, id))
      .limit(1);
    if (!row) throw new NotFoundException(`SDR #${id} not found`);
    return row;
  }

  async create(dto: CreateSdrDto): Promise<schema.SdrRow> {
    const [row] = await this.db
      .insert(schema.sdrs)
      .values({ name: dto.name, color: dto.color })
      .returning();
    return row;
  }

  async update(id: number, dto: UpdateSdrDto): Promise<schema.SdrRow> {
    await this.findOne(id);
    const [row] = await this.db
      .update(schema.sdrs)
      .set(dto)
      .where(eq(schema.sdrs.id, id))
      .returning();
    return row;
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    // assignments cascade-delete via FK
    await this.db.delete(schema.sdrs).where(eq(schema.sdrs.id, id));
  }

  /** Returns every assignment keyed by prospectId → sdrId */
  async getAllAssignments(): Promise<Record<number, number>> {
    const rows = await this.db
      .select({
        prospectId: schema.assignments.prospectId,
        sdrId:      schema.assignments.sdrId,
      })
      .from(schema.assignments);

    return Object.fromEntries(rows.map((r) => [r.prospectId, r.sdrId]));
  }

  /** Assign or unassign a single prospect */
  async setAssignment(prospectId: number, sdrId: number | null): Promise<void> {
    if (sdrId === null) {
      await this.db
        .delete(schema.assignments)
        .where(eq(schema.assignments.prospectId, prospectId));
    } else {
      await this.db
        .insert(schema.assignments)
        .values({ prospectId, sdrId })
        .onConflictDoUpdate({
          target: schema.assignments.prospectId,
          set:    { sdrId, assignedAt: new Date() },
        });
    }
  }
}
