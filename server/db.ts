import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

// ─── Members ─────────────────────────────────────────────────────────────────
import { desc } from "drizzle-orm";
import { members, rocks, meetingNotes, emailCache, prospects } from "../drizzle/schema";
import type { InsertMember, InsertRock, InsertMeetingNote, InsertEmailCache, InsertProspect } from "../drizzle/schema";

export async function getAllMembers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(members).orderBy(desc(members.totalScore));
}

export async function getMemberById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(members).where(eq(members.id, id)).limit(1);
  return result[0];
}

export async function upsertMember(member: InsertMember) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // If we have an id, update directly
  if (member.id) {
    await db.update(members).set({ ...member, updatedAt: new Date() }).where(eq(members.id, member.id));
    return member.id;
  }

  // If we have an externalId, try to find existing record first
  if (member.externalId) {
    const existing = await db.select({ id: members.id })
      .from(members)
      .where(eq(members.externalId, member.externalId))
      .limit(1);
    if (existing.length > 0) {
      const existingId = existing[0].id;
      const { id: _id, externalId: _eid, createdAt: _ca, ...updateFields } = member as any;
      await db.update(members)
        .set({ ...updateFields, updatedAt: new Date() })
        .where(eq(members.id, existingId));
      return existingId;
    }
  }

  // Otherwise insert new
  const result = await db.insert(members).values(member);
  return (result[0] as any).insertId as number;
}

export async function deleteMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(members).where(eq(members.id, id));
}

export async function getMemberStats() {
  const db = await getDb();
  if (!db) return { total: 0, apex: 0, atabey: 0, visionary: 0, active: 0, renewalsSoon: 0 };
  const all = await db.select().from(members);
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    total: all.length,
    apex: all.filter(m => m.tier === "APEX" && m.status === "Active").length,
    atabey: all.filter(m => m.tier === "Atabey" && m.status === "Active").length,
    visionary: all.filter(m => m.tier === "Visionary" && m.status === "Active").length,
    active: all.filter(m => m.status === "Active").length,
    renewalsSoon: all.filter(m => m.renewalDate && m.renewalDate <= in7Days && m.renewalDate >= now).length,
  };
}

// ─── Rocks ───────────────────────────────────────────────────────────────────
export async function getAllRocks(quarter?: string) {
  const db = await getDb();
  if (!db) return [];
  if (quarter) {
    return db.select().from(rocks).where(eq(rocks.quarter, quarter)).orderBy(desc(rocks.createdAt));
  }
  return db.select().from(rocks).orderBy(desc(rocks.createdAt));
}

export async function upsertRock(rock: InsertRock) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (rock.id) {
    await db.update(rocks).set({ ...rock, updatedAt: new Date() }).where(eq(rocks.id, rock.id));
    return rock.id;
  }
  const result = await db.insert(rocks).values(rock);
  return (result[0] as any).insertId as number;
}

export async function deleteRock(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(rocks).where(eq(rocks.id, id));
}

// ─── Meeting Notes ────────────────────────────────────────────────────────────
export async function getAllMeetingNotes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(meetingNotes).orderBy(desc(meetingNotes.meetingDate));
}

export async function getMeetingNoteById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(meetingNotes).where(eq(meetingNotes.id, id)).limit(1);
  return result[0];
}

export async function insertMeetingNote(note: InsertMeetingNote) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(meetingNotes).values(note);
  return (result[0] as any).insertId as number;
}

export async function updateMeetingNote(id: number, updates: Partial<InsertMeetingNote>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(meetingNotes).set(updates).where(eq(meetingNotes.id, id));
}

// ─── Email Cache ──────────────────────────────────────────────────────────────
export async function getAllEmails(category?: string) {
  const db = await getDb();
  if (!db) return [];
  if (category && category !== "all") {
    return db.select().from(emailCache).where(eq(emailCache.category, category as any)).orderBy(desc(emailCache.receivedAt));
  }
  return db.select().from(emailCache).orderBy(desc(emailCache.receivedAt));
}

export async function upsertEmail(email: InsertEmailCache) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(emailCache).values(email).onDuplicateKeyUpdate({
    set: { subject: email.subject, snippet: email.snippet, body: email.body, category: email.category, isRead: email.isRead }
  });
}

export async function markEmailRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(emailCache).set({ isRead: true }).where(eq(emailCache.id, id));
}

export async function saveAiReply(id: number, draft: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(emailCache).set({ aiReplyDraft: draft }).where(eq(emailCache.id, id));
}

// ─── Prospects ────────────────────────────────────────────────────────────────
export async function getAllProspects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(prospects).orderBy(desc(prospects.createdAt));
}

export async function upsertProspect(prospect: InsertProspect) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (prospect.id) {
    await db.update(prospects).set({ ...prospect, updatedAt: new Date() }).where(eq(prospects.id, prospect.id));
    return prospect.id;
  }
  const result = await db.insert(prospects).values(prospect);
  return (result[0] as any).insertId as number;
}
