import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { DB, type DrizzleDB } from "@/database/database.module";
import * as schema from "@/database/schema";
import type { CreateNoteDto } from "./notes.dto";

@Injectable()
export class NotesService {
  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  async findByProspect(prospectId: number): Promise<schema.NoteRow[]> {
    return this.db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.prospectId, prospectId))
      .orderBy(schema.notes.createdAt);
  }

  async create(prospectId: number, dto: CreateNoteDto): Promise<schema.NoteRow> {
    const [row] = await this.db
      .insert(schema.notes)
      .values({
        prospectId,
        text:   dto.text.trim(),
        author: dto.author?.trim() || "AE",
      })
      .returning();
    return row;
  }

  async remove(prospectId: number, noteId: number): Promise<void> {
    const [existing] = await this.db
      .select()
      .from(schema.notes)
      .where(
        and(
          eq(schema.notes.id,         noteId),
          eq(schema.notes.prospectId, prospectId),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Note #${noteId} on prospect #${prospectId} not found`);
    }

    await this.db
      .delete(schema.notes)
      .where(
        and(
          eq(schema.notes.id,         noteId),
          eq(schema.notes.prospectId, prospectId),
        ),
      );
  }
}
