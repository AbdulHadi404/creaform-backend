import {
  Injectable, NotFoundException, ConflictException, Inject,
} from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { DB, type DrizzleDB } from "@/database/database.module";
import * as schema from "@/database/schema";
import { SEQUENCE_TEMPLATE } from "./sequence-template";
import type { EnrollSequenceDto, UpdateStepDto } from "./sequences.dto";

@Injectable()
export class SequencesService {
  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async findSequence(
    prospectId: number,
    contactId: number,
  ): Promise<schema.SequenceRow | undefined> {
    const [row] = await this.db
      .select()
      .from(schema.sequences)
      .where(
        and(
          eq(schema.sequences.prospectId, prospectId),
          eq(schema.sequences.contactId,  contactId),
        ),
      )
      .limit(1);
    return row;
  }

  private buildInitialSteps(): schema.SequenceStepRow[] {
    return SEQUENCE_TEMPLATE.map((t) => ({
      stepNumber: t.step,
      status:     "pending" as const,
      outcome:    "",
      logNote:    "",
      loggedAt:   null,
    }));
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  async findAll(prospectId: number): Promise<schema.SequenceRow[]> {
    return this.db
      .select()
      .from(schema.sequences)
      .where(eq(schema.sequences.prospectId, prospectId));
  }

  async findOne(prospectId: number, contactId: number): Promise<schema.SequenceRow> {
    const row = await this.findSequence(prospectId, contactId);
    if (!row) {
      throw new NotFoundException(
        `No sequence found for prospect #${prospectId} / contact #${contactId}`,
      );
    }
    return row;
  }

  async enroll(
    prospectId: number,
    contactId: number,
    dto: EnrollSequenceDto,
  ): Promise<schema.SequenceRow> {
    const existing = await this.findSequence(prospectId, contactId);
    if (existing) {
      throw new ConflictException(
        `Sequence already exists for prospect #${prospectId} / contact #${contactId}`,
      );
    }

    const [row] = await this.db
      .insert(schema.sequences)
      .values({
        prospectId,
        contactId,
        enrolledBy: dto.enrolledBy ?? "SDR",
        steps:      this.buildInitialSteps(),
      })
      .returning();

    return row;
  }

  async updateStep(
    prospectId: number,
    contactId: number,
    dto: UpdateStepDto,
  ): Promise<schema.SequenceRow> {
    const seq = await this.findOne(prospectId, contactId);

    const steps = (seq.steps as schema.SequenceStepRow[]).map((s, i) => {
      if (i !== dto.stepIndex) return s;
      return {
        ...s,
        status:   dto.status,
        outcome:  dto.outcome  ?? s.outcome,
        logNote:  dto.logNote  ?? s.logNote,
        loggedAt: new Date().toLocaleString("en-US", {
          month: "short", day: "numeric", year: "numeric",
          hour: "numeric", minute: "2-digit",
        }),
      };
    });

    const [updated] = await this.db
      .update(schema.sequences)
      .set({ steps })
      .where(
        and(
          eq(schema.sequences.prospectId, prospectId),
          eq(schema.sequences.contactId,  contactId),
        ),
      )
      .returning();

    return updated;
  }

  async remove(prospectId: number, contactId: number): Promise<void> {
    await this.findOne(prospectId, contactId);
    await this.db
      .delete(schema.sequences)
      .where(
        and(
          eq(schema.sequences.prospectId, prospectId),
          eq(schema.sequences.contactId,  contactId),
        ),
      );
  }
}
