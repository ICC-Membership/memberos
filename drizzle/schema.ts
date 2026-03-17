import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar, float } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Members ────────────────────────────────────────────────────────────────
export const members = mysqlTable("members", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 128 }), // Appstle/Shopify order ID
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  tier: mysqlEnum("tier", ["Visionary", "Atabey", "APEX"]).default("Visionary").notNull(),
  status: mysqlEnum("status", ["Active", "Paused", "Cancelled"]).default("Active").notNull(),
  lockerNumber: varchar("lockerNumber", { length: 16 }),
  lockerSection: varchar("lockerSection", { length: 32 }),
  joinedAt: timestamp("joinedAt"),
  renewalDate: timestamp("renewalDate"),
  monthlyRate: float("monthlyRate"),
  notes: text("notes"),
  // Power ranking scores
  visitScore: int("visitScore").default(0),
  spendScore: int("spendScore").default(0),
  referralScore: int("referralScore").default(0),
  tenureScore: int("tenureScore").default(0),
  eventScore: int("eventScore").default(0),
  totalScore: int("totalScore").default(0),
  apexEligible: boolean("apexEligible").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Member = typeof members.$inferSelect;
export type InsertMember = typeof members.$inferInsert;

// ─── Rocks (EOS Quarterly Goals) ────────────────────────────────────────────
export const rocks = mysqlTable("rocks", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  owner: varchar("owner", { length: 255 }),
  quarter: varchar("quarter", { length: 16 }), // e.g. "Q1 2026"
  dueDate: timestamp("dueDate"),
  status: mysqlEnum("status", ["On Track", "Off Track", "Done", "Not Started"]).default("Not Started").notNull(),
  progressPct: int("progressPct").default(0),
  ninetyUrl: varchar("ninetyUrl", { length: 1024 }), // link to Ninety.io
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Rock = typeof rocks.$inferSelect;
export type InsertRock = typeof rocks.$inferInsert;

// ─── L10 Meeting Notes (Otter.ai uploads) ───────────────────────────────────
export const meetingNotes = mysqlTable("meetingNotes", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  meetingDate: timestamp("meetingDate"),
  rawTranscript: text("rawTranscript"),
  aiSummary: text("aiSummary"),
  membershipMentions: text("membershipMentions"), // JSON array of extracted mentions
  actionItems: text("actionItems"),               // JSON array of action items
  fileUrl: varchar("fileUrl", { length: 1024 }),  // S3 URL of uploaded file
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MeetingNote = typeof meetingNotes.$inferSelect;
export type InsertMeetingNote = typeof meetingNotes.$inferInsert;

// ─── Email Inbox Cache ───────────────────────────────────────────────────────
export const emailCache = mysqlTable("emailCache", {
  id: int("id").autoincrement().primaryKey(),
  gmailId: varchar("gmailId", { length: 255 }).unique(),
  from: varchar("from", { length: 512 }),
  subject: varchar("subject", { length: 1024 }),
  snippet: text("snippet"),
  body: text("body"),
  receivedAt: timestamp("receivedAt"),
  category: mysqlEnum("category", ["inquiry", "renewal", "issue", "event", "general"]).default("general"),
  isRead: boolean("isRead").default(false),
  aiReplyDraft: text("aiReplyDraft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailCache = typeof emailCache.$inferSelect;
export type InsertEmailCache = typeof emailCache.$inferInsert;

// ─── Prospects ───────────────────────────────────────────────────────────────
export const prospects = mysqlTable("prospects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  source: varchar("source", { length: 128 }), // typeform, referral, walk-in, event
  interestedTier: mysqlEnum("interestedTier", ["Visionary", "Atabey", "APEX"]),
  status: mysqlEnum("status", ["New", "Contacted", "Tour Scheduled", "Proposal Sent", "Closed Won", "Closed Lost"]).default("New").notNull(),
  referredBy: varchar("referredBy", { length: 255 }),
  notes: text("notes"),
  lastContactedAt: timestamp("lastContactedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Prospect = typeof prospects.$inferSelect;
export type InsertProspect = typeof prospects.$inferInsert;
