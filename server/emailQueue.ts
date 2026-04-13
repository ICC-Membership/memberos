/**
 * ICC Email Draft Queue — DB-backed
 *
 * The server writes draft requests to the emailDraftQueue DB table.
 * The Manus agent reads pending items and creates Gmail drafts via MCP.
 * This file provides DB helpers for reading queue status.
 * Actual Gmail draft creation happens from the agent context, not the server.
 */

import { getDb } from "./db";
import { emailDraftQueue } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface QueueStats {
  total: number;
  pending: number;
  drafted: number;
  failed: number;
  byType: Record<string, number>;
}

/**
 * Get current queue stats
 */
export async function getQueueStats(): Promise<QueueStats> {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, drafted: 0, failed: 0, byType: {} };

  const all = await db.select().from(emailDraftQueue);
  const pending = all.filter(item => item.status === "pending");
  const drafted = all.filter(item => item.status === "drafted");
  const failed = all.filter(item => item.status === "failed");

  const byType: Record<string, number> = {};
  pending.forEach(item => {
    byType[item.type] = (byType[item.type] || 0) + 1;
  });

  return {
    total: all.length,
    pending: pending.length,
    drafted: drafted.length,
    failed: failed.length,
    byType,
  };
}

/**
 * Get all pending items in the queue (for agent to process)
 */
export async function getPendingQueueItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailDraftQueue).where(eq(emailDraftQueue.status, "pending"));
}

/**
 * Mark a queue item as drafted
 */
export async function markQueueItemDrafted(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(emailDraftQueue)
    .set({ status: "drafted", processedAt: new Date() })
    .where(eq(emailDraftQueue.id, id));
}

/**
 * Mark a queue item as failed
 */
export async function markQueueItemFailed(id: number, errorMessage: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(emailDraftQueue)
    .set({ status: "failed", errorMessage, processedAt: new Date() })
    .where(eq(emailDraftQueue.id, id));
}
