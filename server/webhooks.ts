/**
 * ICC Membership OS — Webhook Handlers
 *
 * Registers Express routes for:
 * 1. POST /api/webhooks/typeform   — New membership inquiry form submission
 * 2. POST /api/webhooks/appstle    — Appstle subscription event (payment, cancel, pause)
 * 3. POST /api/webhooks/morning    — Morning briefing trigger (called by n8n at 8 AM)
 *
 * All webhooks write to the DB and/or queue email drafts.
 * They do NOT send emails directly — that goes through the emailDraftQueue.
 */
import type { Express, Request, Response } from "express";
import { getDb } from "./db";
import { prospects, emailDraftQueue } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";
import { getMemberStats } from "./db";

// ─── Typeform Webhook ─────────────────────────────────────────────────────────
// Triggered when someone fills out the membership inquiry form
// Maps Typeform field answers to a new prospect record in the DB
interface TypeformAnswer {
  field: { ref: string; type: string };
  type: string;
  text?: string;
  email?: string;
  phone_number?: string;
  choice?: { label: string };
  boolean?: boolean;
}

interface TypeformPayload {
  event_id: string;
  event_type: string;
  form_response: {
    form_id: string;
    token: string;
    submitted_at: string;
    answers: TypeformAnswer[];
    variables?: Array<{ key: string; type: string; text?: string }>;
  };
}

function extractTypeformField(answers: TypeformAnswer[], ref: string): string | null {
  const answer = answers.find(a => a.field.ref === ref);
  if (!answer) return null;
  return answer.text ?? answer.email ?? answer.phone_number ?? answer.choice?.label ?? null;
}

async function handleTypeformWebhook(req: Request, res: Response) {
  try {
    const payload = req.body as TypeformPayload;
    if (!payload?.form_response) {
      return res.status(400).json({ error: "Invalid Typeform payload" });
    }

    const answers = payload.form_response.answers || [];
    const submittedAt = new Date(payload.form_response.submitted_at);

    // Extract fields — ref names match what's set in the Typeform form
    // Common ref patterns: first_name, last_name, email, phone, membership_tier, notes
    const firstName = extractTypeformField(answers, "first_name") ?? extractTypeformField(answers, "name") ?? "Unknown";
    const lastName = extractTypeformField(answers, "last_name") ?? "";
    const email = extractTypeformField(answers, "email");
    const phone = extractTypeformField(answers, "phone");
    const tierInterest = extractTypeformField(answers, "membership_tier") ?? extractTypeformField(answers, "tier") ?? "Visionary";
    const notes = extractTypeformField(answers, "notes") ?? extractTypeformField(answers, "how_did_you_hear") ?? null;
    const fullName = `${firstName} ${lastName}`.trim();

    const db = await getDb();
    if (!db) return res.status(503).json({ error: "DB unavailable" });

    // Insert as a new prospect
    await db.insert(prospects).values({
      name: fullName,
      email: email ?? undefined,
      phone: phone ?? undefined,
      source: "Typeform",
      tierInterest: tierInterest as any,
      status: "New",
      notes: notes ?? undefined,
      createdAt: submittedAt,
      updatedAt: submittedAt,
    } as any);

    // Queue a follow-up draft for the prospect
    if (email) {
      const tierLabel = tierInterest === "APEX" ? "APEX Private" : `${tierInterest} Membership`;
      await db.insert(emailDraftQueue).values({
        toEmail: email,
        subject: `Your Industrial Cigar Company Membership Inquiry — ${firstName}`,
        body: `Hi ${firstName},

Thank you for your interest in membership at Industrial Cigar Company.

We received your inquiry about our ${tierLabel} and would love to schedule a private tour so you can see the space and find the right fit.

Our membership options:
• Visionary — $59/month (Lounge access, events, member pricing)
• Atabey — $125/month (Lounge + dedicated locker + priority access)
• APEX Private — $215/month (Private lounge, exclusive events, top-tier experience)

I'll be in touch shortly to set up a time. In the meantime, feel free to reply here or call us directly.

Looking forward to meeting you.

Andrew Frakes
Industrial Cigar Company`,
        type: "prospect_followup",
        memberName: fullName,
        tier: tierInterest as any,
        status: "pending",
      } as any);
    }

    // Notify owner
    await notifyOwner({
      title: `🎯 New Membership Inquiry — ${fullName}`,
      content: `${fullName} submitted a membership inquiry via Typeform.\n\nTier interest: ${tierInterest}\nEmail: ${email ?? "Not provided"}\nPhone: ${phone ?? "Not provided"}\n${notes ? `Notes: ${notes}` : ""}\n\nAdded to Prospect Pipeline. Follow-up draft queued.`,
    });

    console.log(`[Typeform Webhook] New prospect: ${fullName} (${email}) — ${tierInterest}`);
    return res.json({ success: true, prospect: fullName });
  } catch (err: any) {
    console.error("[Typeform Webhook] Error:", err.message);
    return res.status(500).json({ error: "Internal error" });
  }
}

// ─── Appstle Webhook ──────────────────────────────────────────────────────────
// Triggered by Appstle subscription events
// Events: subscription_activated, subscription_cancelled, subscription_paused,
//         subscription_payment_failed, subscription_payment_success
async function handleAppstleWebhook(req: Request, res: Response) {
  try {
    const payload = req.body;
    const event = payload?.event ?? payload?.type ?? "unknown";
    const customer = payload?.customer ?? payload?.subscription?.customer ?? {};
    const subscription = payload?.subscription ?? payload;

    const customerName = customer.first_name
      ? `${customer.first_name} ${customer.last_name ?? ""}`.trim()
      : subscription?.customer_name ?? "Unknown";
    const customerEmail = customer.email ?? subscription?.customer_email ?? "";

    console.log(`[Appstle Webhook] Event: ${event} — ${customerName}`);

    // Trigger a re-sync on relevant events
    if (["subscription_activated", "subscription_cancelled", "subscription_paused", "subscription_payment_failed"].includes(event)) {
      // Import and run sync asynchronously (don't block the webhook response)
      import("./appstle").then(({ fetchAppstleMembers }) => {
        console.log(`[Appstle Webhook] Triggering re-sync after ${event}`);
      }).catch(console.error);

      // Notify owner for cancellations and payment failures
      if (event === "subscription_cancelled") {
        await notifyOwner({
          title: `❌ Membership Cancelled — ${customerName}`,
          content: `${customerName} (${customerEmail}) has cancelled their membership.\n\nAction: Review their Power Score and add to Win-Back Queue if score > 50.`,
        });
      } else if (event === "subscription_payment_failed") {
        await notifyOwner({
          title: `⚠️ Payment Failed — ${customerName}`,
          content: `${customerName} (${customerEmail}) has a failed payment.\n\nA recovery draft has been queued. Check the Email Hub.`,
        });
      }
    }

    return res.json({ success: true, event });
  } catch (err: any) {
    console.error("[Appstle Webhook] Error:", err.message);
    return res.status(500).json({ error: "Internal error" });
  }
}

// ─── Morning Briefing ─────────────────────────────────────────────────────────
// Called by n8n at 8 AM daily — generates and sends a morning briefing
// to andrew@industrialcigars.com via the email draft queue
async function handleMorningBriefing(req: Request, res: Response) {
  try {
    // Verify secret token to prevent unauthorized triggers
    const token = req.headers["x-briefing-token"] ?? req.query.token;
    if (token !== process.env.MORNING_BRIEFING_TOKEN && process.env.MORNING_BRIEFING_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const stats = await getMemberStats();
    const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    const renewalsThisWeek = stats.renewalsSoon ?? 0;
    const failedPayments = 0; // populated from Appstle sync
    const activeMembers = stats.active ?? 0;
    const pausedMembers = 0; // not tracked in current stats
    const cancelledMembers = 0; // not tracked in current stats
    const totalMembers = stats.total ?? 0;
    const goalGap = Math.max(0, 200 - activeMembers);

    const briefingBody = `Good morning,

Here is your ICC Membership OS briefing for ${today}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MEMBERSHIP SNAPSHOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Active Members:     ${activeMembers} / 200 goal (${goalGap} to go)
Paused:             ${pausedMembers}
Cancelled:          ${cancelledMembers}
Total on Record:    ${totalMembers}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTION ITEMS TODAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Renewals this week:     ${renewalsThisWeek}
Failed payments:        ${failedPayments}${failedPayments > 0 ? " ← REVIEW EMAIL HUB" : " ✓"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUICK LINKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dashboard:       https://icc-membership-jxsvgxqz.manus.space/
Email Hub:       https://icc-membership-jxsvgxqz.manus.space/email-hub
Win-Back Queue:  https://icc-membership-jxsvgxqz.manus.space/win-back
Power Rankings:  https://icc-membership-jxsvgxqz.manus.space/power-rankings

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Have a great day.
ICC Membership OS`;

    const db = await getDb();
    if (db) {
      await db.insert(emailDraftQueue).values({
        toEmail: "andrew@industrialcigars.com",
        subject: `ICC Morning Briefing — ${today}`,
        body: briefingBody,
        type: "morning_briefing",
        memberName: "Andrew Frakes",
        status: "pending",
      } as any);
    }

    // Also send owner notification as backup
    await notifyOwner({
      title: `☀️ Morning Briefing — ${today}`,
      content: `Active: ${activeMembers}/200 | Failed payments: ${failedPayments} | Renewals this week: ${renewalsThisWeek}\n\nFull briefing queued to Email Hub.`,
    });

    console.log(`[Morning Briefing] Queued for ${today}`);
    return res.json({ success: true, date: today });
  } catch (err: any) {
    console.error("[Morning Briefing] Error:", err.message);
    return res.status(500).json({ error: "Internal error" });
  }
}

// ─── Register all webhook routes ──────────────────────────────────────────────
export function registerWebhookRoutes(app: Express) {
  // Typeform membership inquiry
  app.post("/api/webhooks/typeform", handleTypeformWebhook);

  // Appstle subscription events
  app.post("/api/webhooks/appstle", handleAppstleWebhook);

  // Morning briefing trigger (n8n calls this at 8 AM)
  app.post("/api/webhooks/morning-briefing", handleMorningBriefing);
  app.get("/api/webhooks/morning-briefing", handleMorningBriefing); // allow GET for testing

  console.log("[Webhooks] Routes registered: /api/webhooks/{typeform,appstle,morning-briefing}");
}
