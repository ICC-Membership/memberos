import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, float } from "drizzle-orm/mysql-core";

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

// ─── Integration Tokens (OAuth tokens for external services) ─────────────────
export const integrationTokens = mysqlTable("integrationTokens", {
  id: int("id").autoincrement().primaryKey(),
  service: varchar("service", { length: 64 }).notNull().unique(), // e.g. "lightspeed", "salto"
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  accountId: varchar("accountId", { length: 128 }),
  expiresAt: int("expiresAt"), // unix ms timestamp
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type IntegrationToken = typeof integrationTokens.$inferSelect;

// ─── Email Draft Queue (payment automation, win-back, welcome) ───────────────
export const emailDraftQueue = mysqlTable("emailDraftQueue", {
  id: int("id").autoincrement().primaryKey(),
  toEmail: varchar("toEmail", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  type: varchar("type", { length: 100 }).notNull(), // payment_recovery_draft | welcome_email | winback_draft
  memberName: varchar("memberName", { length: 255 }),
  tier: varchar("tier", { length: 50 }),
  contractId: int("contractId"),
  phone: varchar("phone", { length: 50 }),
  monthlyRate: float("monthlyRate"),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending | drafted | sent | failed
  processedAt: timestamp("processedAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow(),
});
export type EmailDraftQueueItem = typeof emailDraftQueue.$inferSelect;
export type InsertEmailDraftQueueItem = typeof emailDraftQueue.$inferInsert;

// ─── Staff Members ────────────────────────────────────────────────────────────
export const staff = mysqlTable("staff", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  referralCode: varchar("referralCode", { length: 64 }).unique(),
  shopifyUrl: varchar("shopifyUrl", { length: 1024 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  role: varchar("role", { length: 128 }), // bartender, floor, manager, etc.
  isActive: boolean("isActive").default(true).notNull(),
  // Commission tracking
  toursGivenAllTime: int("toursGivenAllTime").default(0),
  toursGivenQtr: int("toursGivenQtr").default(0),
  closedAllTime: int("closedAllTime").default(0),
  closedQtr: int("closedQtr").default(0),
  closedYTD: int("closedYTD").default(0),
  currentRank: int("currentRank"),
  bonusEligibleQtr: boolean("bonusEligibleQtr").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Staff = typeof staff.$inferSelect;
export type InsertStaff = typeof staff.$inferInsert;

// ─── Tour Logs ────────────────────────────────────────────────────────────────
export const tourLogs = mysqlTable("tourLogs", {
  id: int("id").autoincrement().primaryKey(),
  staffId: int("staffId"), // FK to staff.id
  staffName: varchar("staffName", { length: 255 }),
  prospectFirstName: varchar("prospectFirstName", { length: 128 }),
  prospectLastName: varchar("prospectLastName", { length: 128 }),
  prospectEmail: varchar("prospectEmail", { length: 320 }),
  prospectPhone: varchar("prospectPhone", { length: 32 }),
  cameWithGroup: boolean("cameWithGroup").default(false),
  interestedTier: mysqlEnum("interestedTier", ["Visionary", "Atabey", "APEX"]),
  converted: boolean("converted").default(false), // did they become a member?
  memberId: int("memberId"), // FK to members.id if converted
  notes: text("notes"),
  tourDate: timestamp("tourDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TourLog = typeof tourLogs.$inferSelect;
export type InsertTourLog = typeof tourLogs.$inferInsert;

// ─── Locker Assignments ───────────────────────────────────────────────────────
export const lockers = mysqlTable("lockers", {
  id: int("id").autoincrement().primaryKey(),
  lockerNumber: varchar("lockerNumber", { length: 16 }).notNull().unique(),
  section: varchar("section", { length: 32 }), // e.g. "A", "B", "VIP"
  row: int("row"),
  col: int("col"),
  memberId: int("memberId"), // FK to members.id — null if unassigned
  memberName: varchar("memberName", { length: 255 }),
  tier: mysqlEnum("tier", ["Visionary", "Atabey", "APEX"]),
  assignedAt: timestamp("assignedAt"),
  notes: text("notes"),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Locker = typeof lockers.$inferSelect;
export type InsertLocker = typeof lockers.$inferInsert;
