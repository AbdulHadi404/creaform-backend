import {
  pgTable,
  serial,
  text,
  integer,
  varchar,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ─────────────────────────────────────────────────────────────────────
export const heatEnum         = pgEnum("heat", ["Hot", "Warm", "Cool"]);
export const stepStatusEnum   = pgEnum("step_status", ["pending", "skipped", "done", "scheduled"]);
export const touchpointEnum   = pgEnum("touchpoint_type", ["email", "call", "linkedin"]);

// ── Prospects ─────────────────────────────────────────────────────────────────
export const prospects = pgTable("prospects", {
  id:      serial("id").primaryKey(),
  co:      varchar("co", { length: 255 }).notNull(),
  country: varchar("country", { length: 50 }).notNull().default("US"),
  sector:  varchar("sector", { length: 100 }).notNull().default("Industrial"),
  heat:    heatEnum("heat").notNull().default("Warm"),
  date:    varchar("date", { length: 50 }),
  emp:     varchar("emp", { length: 50 }),
  hq:      varchar("hq", { length: 255 }),
  signal:  text("signal"),
  contact: varchar("contact", { length: 255 }),
  title:   varchar("title", { length: 255 }),
  email:   varchar("email", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  coIdx:     index("prospects_co_idx").on(t.co),
  sectorIdx: index("prospects_sector_idx").on(t.sector),
  heatIdx:   index("prospects_heat_idx").on(t.heat),
}));

// ── SDRs ──────────────────────────────────────────────────────────────────────
export const sdrs = pgTable("sdrs", {
  id:    serial("id").primaryKey(),
  name:  varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Assignments (prospect ↔ SDR, many-to-one) ─────────────────────────────────
export const assignments = pgTable("assignments", {
  id:         serial("id").primaryKey(),
  prospectId: integer("prospect_id").notNull().references(() => prospects.id, { onDelete: "cascade" }),
  sdrId:      integer("sdr_id").notNull().references(() => sdrs.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
}, (t) => ({
  uniqueProspect: uniqueIndex("assignments_prospect_unique").on(t.prospectId),
}));

// ── Contacts ──────────────────────────────────────────────────────────────────
export const contacts = pgTable("contacts", {
  id:         serial("id").primaryKey(),
  prospectId: integer("prospect_id").notNull().references(() => prospects.id, { onDelete: "cascade" }),
  name:       varchar("name", { length: 255 }).notNull(),
  title:      varchar("title", { length: 255 }),
  dept:       varchar("dept", { length: 100 }).default("Engineering"),
  linkedin:   varchar("linkedin", { length: 500 }),
  email:      varchar("email", { length: 255 }),
  phone:      varchar("phone", { length: 50 }),
  notes:      text("notes"),
  addedAt:    timestamp("added_at").defaultNow().notNull(),
}, (t) => ({
  prospectIdx: index("contacts_prospect_idx").on(t.prospectId),
}));

// ── Notes ─────────────────────────────────────────────────────────────────────
export const notes = pgTable("notes", {
  id:         serial("id").primaryKey(),
  prospectId: integer("prospect_id").notNull().references(() => prospects.id, { onDelete: "cascade" }),
  text:       text("text").notNull(),
  author:     varchar("author", { length: 255 }).notNull().default("AE"),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  prospectIdx: index("notes_prospect_idx").on(t.prospectId),
}));

// ── Sequences ─────────────────────────────────────────────────────────────────
// One sequence per (prospect, contact) pair.
// Steps are stored as JSONB for flexibility — they follow the fixed 14-step template.
export const sequences = pgTable("sequences", {
  id:         serial("id").primaryKey(),
  prospectId: integer("prospect_id").notNull().references(() => prospects.id, { onDelete: "cascade" }),
  contactId:  integer("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  enrolledBy: varchar("enrolled_by", { length: 255 }).notNull().default("SDR"),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  // Array of 14 step objects: { stepNumber, status, outcome, logNote, loggedAt }
  steps:      jsonb("steps").notNull().$type<SequenceStepRow[]>(),
}, (t) => ({
  prospectIdx:      index("sequences_prospect_idx").on(t.prospectId),
  uniqueSeq:        uniqueIndex("sequences_prospect_contact_unique").on(t.prospectId, t.contactId),
}));

// ── Type for the JSONB steps column ──────────────────────────────────────────
export interface SequenceStepRow {
  stepNumber: number;
  status: "pending" | "skipped" | "done" | "scheduled";
  outcome: string;
  logNote: string;
  loggedAt: string | null;
}

// ── Relations ─────────────────────────────────────────────────────────────────
export const prospectsRelations = relations(prospects, ({ many, one }) => ({
  assignment: one(assignments, { fields: [prospects.id], references: [assignments.prospectId] }),
  contacts:   many(contacts),
  notes:      many(notes),
  sequences:  many(sequences),
}));

export const sdrsRelations = relations(sdrs, ({ many }) => ({
  assignments: many(assignments),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  prospect: one(prospects, { fields: [assignments.prospectId], references: [prospects.id] }),
  sdr:      one(sdrs,      { fields: [assignments.sdrId],      references: [sdrs.id] }),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  prospect:  one(prospects, { fields: [contacts.prospectId], references: [prospects.id] }),
  sequences: many(sequences),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  prospect: one(prospects, { fields: [notes.prospectId], references: [prospects.id] }),
}));

export const sequencesRelations = relations(sequences, ({ one }) => ({
  prospect: one(prospects, { fields: [sequences.prospectId], references: [prospects.id] }),
  contact:  one(contacts,  { fields: [sequences.contactId],  references: [contacts.id] }),
}));

// ── Type inference helpers ────────────────────────────────────────────────────
export type ProspectRow    = typeof prospects.$inferSelect;
export type NewProspect    = typeof prospects.$inferInsert;
export type SdrRow         = typeof sdrs.$inferSelect;
export type NewSdr         = typeof sdrs.$inferInsert;
export type AssignmentRow  = typeof assignments.$inferSelect;
export type ContactRow     = typeof contacts.$inferSelect;
export type NewContact     = typeof contacts.$inferInsert;
export type NoteRow        = typeof notes.$inferSelect;
export type NewNote        = typeof notes.$inferInsert;
export type SequenceRow    = typeof sequences.$inferSelect;
export type NewSequence    = typeof sequences.$inferInsert;
