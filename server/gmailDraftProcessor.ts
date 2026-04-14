/**
 * gmailDraftProcessor.ts — ICC Email Hub Gmail Integration
 *
 * Reads pending items from emailDraftQueue and creates Gmail drafts
 * using the `gws` CLI (which is authenticated to andrew@industrialcigars.com).
 *
 * Architecture:
 *   1. Server writes draft requests to emailDraftQueue DB table
 *   2. This processor reads pending items and creates Gmail drafts via gws CLI
 *   3. Andrew reviews and sends drafts from Gmail — he stays in control
 *
 * Called from:
 *   - tRPC emailAutomation.processQueue mutation (manual trigger from UI)
 *   - Startup sync in _core/index.ts (runs after Appstle sync)
 */

import { exec } from "child_process";
import { promisify } from "util";
import { getPendingQueueItems, markQueueItemDrafted, markQueueItemFailed } from "./emailQueue";

const execAsync = promisify(exec);

interface ProcessResult {
  processed: number;
  drafted: number;
  failed: number;
  errors: string[];
}

/**
 * Create a single Gmail draft via gws CLI
 * Uses RFC 2822 message format encoded as base64url
 */
async function createGmailDraft(to: string, subject: string, body: string): Promise<string> {
  // Build RFC 2822 message
  const from = process.env.GMAIL_FROM ?? "andrew@industrialcigars.com";
  const message = [
    `From: Andrew Frakes <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset=utf-8`,
    `MIME-Version: 1.0`,
    ``,
    body,
  ].join("\r\n");

  // Base64url encode (Gmail API requirement)
  const encoded = Buffer.from(message).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const payload = JSON.stringify({ message: { raw: encoded } });
  const tmpFile = `/tmp/gmail_draft_${Date.now()}.json`;

  const { writeFileSync, unlinkSync } = await import("fs");
  writeFileSync(tmpFile, payload);

  try {
    const { stdout } = await execAsync(
      `gws gmail users drafts create --userId me --body "$(cat ${tmpFile})"`
    );
    const result = JSON.parse(stdout.trim());
    return result.id ?? "unknown";
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}

/**
 * Process all pending email drafts from the queue
 */
export async function processEmailDraftQueue(): Promise<ProcessResult> {
  const pending = await getPendingQueueItems();

  const result: ProcessResult = {
    processed: pending.length,
    drafted: 0,
    failed: 0,
    errors: [],
  };

  if (pending.length === 0) {
    return result;
  }

  console.log(`[Gmail Draft Processor] Processing ${pending.length} pending draft(s)...`);

  for (const item of pending) {
    try {
      if (!item.toEmail) {
        await markQueueItemFailed(item.id, "No recipient email address");
        result.failed++;
        result.errors.push(`Item ${item.id}: No recipient email`);
        continue;
      }

      const draftId = await createGmailDraft(item.toEmail, item.subject, item.body);
      await markQueueItemDrafted(item.id);
      result.drafted++;
      console.log(`[Gmail Draft Processor] Created draft ${draftId} for ${item.toEmail} (${item.type})`);
    } catch (err: any) {
      const errMsg = err.message ?? String(err);
      await markQueueItemFailed(item.id, errMsg);
      result.failed++;
      result.errors.push(`Item ${item.id} (${item.toEmail}): ${errMsg}`);
      console.error(`[Gmail Draft Processor] Failed to create draft for item ${item.id}:`, errMsg);
    }
  }

  console.log(`[Gmail Draft Processor] Done — ${result.drafted} drafted, ${result.failed} failed`);
  return result;
}

/**
 * Get Gmail inbox summary for Email Hub display
 * Returns recent membership-relevant threads
 */
export async function getGmailInboxSummary(): Promise<any[]> {
  try {
    // Search for membership-related emails in the last 30 days
    const query = encodeURIComponent("subject:(membership OR inquiry OR locker OR renewal OR cigar) newer_than:30d");
    const { stdout } = await execAsync(
      `gws gmail users messages list --userId me --q "${query}" --maxResults 20`
    );
    const listResult = JSON.parse(stdout.trim());
    const messages = listResult.messages ?? [];

    const summaries = [];
    for (const msg of messages.slice(0, 10)) {
      try {
        const { stdout: msgOut } = await execAsync(
          `gws gmail users messages get --userId me --id ${msg.id} --format metadata --metadataHeaders From,Subject,Date`
        );
        const msgData = JSON.parse(msgOut.trim());
        const headers = msgData.payload?.headers ?? [];
        const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value ?? "";

        summaries.push({
          id: msg.id,
          threadId: msg.threadId,
          from: getHeader("From"),
          subject: getHeader("Subject"),
          date: getHeader("Date"),
          snippet: msgData.snippet ?? "",
          labelIds: msgData.labelIds ?? [],
        });
      } catch {}
    }

    return summaries;
  } catch (err: any) {
    console.error("[Gmail Inbox] Error fetching inbox:", err.message);
    return [];
  }
}
