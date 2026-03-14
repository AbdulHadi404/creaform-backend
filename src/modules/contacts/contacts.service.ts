import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { DB, type DrizzleDB } from "@/database/database.module";
import * as schema from "@/database/schema";
import type { CreateContactDto, UpdateContactDto } from "./contacts.dto";

@Injectable()
export class ContactsService {
  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  async findByProspect(prospectId: number): Promise<schema.ContactRow[]> {
    return this.db
      .select()
      .from(schema.contacts)
      .where(eq(schema.contacts.prospectId, prospectId))
      .orderBy(schema.contacts.addedAt);
  }

  async findOne(prospectId: number, contactId: number): Promise<schema.ContactRow> {
    const [row] = await this.db
      .select()
      .from(schema.contacts)
      .where(
        and(
          eq(schema.contacts.id,         contactId),
          eq(schema.contacts.prospectId, prospectId),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(
        `Contact #${contactId} on prospect #${prospectId} not found`,
      );
    }
    return row;
  }

  async create(prospectId: number, dto: CreateContactDto): Promise<schema.ContactRow> {
    const [row] = await this.db
      .insert(schema.contacts)
      .values({
        prospectId,
        name:     dto.name,
        title:    dto.title,
        dept:     dto.dept    ?? "Engineering",
        linkedin: dto.linkedin,
        email:    dto.email,
        phone:    dto.phone,
        notes:    dto.notes,
      })
      .returning();
    return row;
  }

  async update(
    prospectId: number,
    contactId: number,
    dto: UpdateContactDto,
  ): Promise<schema.ContactRow> {
    await this.findOne(prospectId, contactId);

    const [row] = await this.db
      .update(schema.contacts)
      .set(dto)
      .where(
        and(
          eq(schema.contacts.id,         contactId),
          eq(schema.contacts.prospectId, prospectId),
        ),
      )
      .returning();
    return row;
  }

  async remove(prospectId: number, contactId: number): Promise<void> {
    await this.findOne(prospectId, contactId);
    // Sequence for this contact cascades via FK
    await this.db
      .delete(schema.contacts)
      .where(
        and(
          eq(schema.contacts.id,         contactId),
          eq(schema.contacts.prospectId, prospectId),
        ),
      );
  }
}
