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
  // Auto-population fields from Lightspeed + scoring
  lightspeedCustomerId: varchar("lightspeedCustomerId", { length: 64 }),
  visitCount: int("visitCount").default(0),
  totalSpend: int("totalSpend").default(0), // in cents
  prospectScore: int("prospectScore").default(0), // 0-100
  assignedStaffId: int("assignedStaffId"), // FK to staff.id
  assignedStaffName: varchar("assignedStaffName", { length: 255 }),
  priority: mysqlEnum("priority", ["High", "Medium", "Low"]).default("Medium"),
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
  keyCode: varchar("keyCode", { length: 64 }),           // physical key number/code
  nameplateLabel: varchar("nameplateLabel", { length: 255 }), // nameplate display name
  lockerType: mysqlEnum("lockerType", ["individual", "corporate", "enterprise", "oversized"]).default("individual"),
  paymentOverdue: boolean("paymentOverdue").default(false), // red highlight flag
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Locker = typeof lockers.$inferSelect;
export type InsertLocker = typeof lockers.$inferInsert;

// ─── Member Notes (CRM notes per member) ─────────────────────────────────────
export const memberNotes = mysqlTable("memberNotes", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  memberName: varchar("memberName", { length: 255 }),
  authorName: varchar("authorName", { length: 255 }).default("Andrew Frakes"),
  note: text("note").notNull(),
  type: mysqlEnum("type", ["general", "payment", "complaint", "compliment", "winback", "apex"]).default("general"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MemberNote = typeof memberNotes.$inferSelect;
export type InsertMemberNote = typeof memberNotes.$inferInsert;

// ─── Lit-Ventures Deals ───────────────────────────────────────────────────────
export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  dealType: mysqlEnum("dealType", ["Equity", "Consulting", "Partnership", "Acquisition", "Advisory"]).default("Equity").notNull(),
  industry: varchar("industry", { length: 128 }),
  stage: mysqlEnum("stage", ["Intake", "Diligence", "Term Sheet", "Closed", "Passed"]).default("Intake").notNull(),
  askAmount: varchar("askAmount", { length: 64 }),
  equityOffered: varchar("equityOffered", { length: 32 }),
  revenue: varchar("revenue", { length: 64 }),
  ebitda: varchar("ebitda", { length: 64 }),
  useOfFunds: text("useOfFunds"),
  founderBackground: text("founderBackground"),
  competitiveAdvantage: text("competitiveAdvantage"),
  keyRisks: text("keyRisks"),
  exitStrategy: text("exitStrategy"),
  aiMemo: text("aiMemo"),
  score: int("score").default(0),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

// ─── Locker History (audit log for locker reassignments) ─────────────────────
export const lockerHistory = mysqlTable("lockerHistory", {
  id: int("id").autoincrement().primaryKey(),
  lockerNumber: varchar("lockerNumber", { length: 16 }).notNull(),
  bank: varchar("bank", { length: 32 }), // APEX, Atabey, Visionary
  fromMemberName: varchar("fromMemberName", { length: 255 }),
  toMemberName: varchar("toMemberName", { length: 255 }),
  action: mysqlEnum("action", ["assigned", "unassigned", "moved"]).default("assigned"),
  performedBy: varchar("performedBy", { length: 255 }).default("Andrew Frakes"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LockerHistory = typeof lockerHistory.$inferSelect;
export type InsertLockerHistory = typeof lockerHistory.$inferInsert;

// ─── System Error Log ─────────────────────────────────────────────────────────
export const systemErrors = mysqlTable("systemErrors", {
  id: int("id").autoincrement().primaryKey(),
  service: varchar("service", { length: 64 }).notNull(), // appstle, lightspeed, email_queue, webhook
  errorType: varchar("errorType", { length: 128 }),
  message: text("message"),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SystemError = typeof systemErrors.$inferSelect;
export type InsertSystemError = typeof systemErrors.$inferInsert;
