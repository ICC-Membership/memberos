/**
 * ICC Payment Failure Automation
 *
 * Architecture:
 * - Server detects dunning members during Appstle sync
 * - Server writes draft requests to the emailDraftQueue DB table
 * - Agent (Manus) reads the queue on a schedule and creates Gmail drafts via MCP
 * - Andrew reviews and sends from Gmail — no manual work required
 *
 * Automation levels:
 * - dunning=true, emailBouncedOrFailed=false → Queue payment recovery draft
 * - dunning=true, emailBouncedOrFailed=true  → Push notification to call member
 * - New member (activated within 48h)        → Queue welcome email draft
 */

import { notifyOwner } from "./_core/notification";
import { getDb } from "./db";
import { emailDraftQueue } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export interface PaymentIssueContract {
  id: number;
  customerName: string;
  customerEmail: string;
  phone?: string;
  tier: string;
  monthlyRate: number;
  dunning: boolean;
  emailBouncedOrFailed: boolean;
  status: string;
}

export interface NewMemberContract {
  customerName: string;
  customerEmail: string;
  tier: string;
  monthlyRate: number;
  activatedOn?: string;
}

// ─── Queue Payment Recovery Draft ─────────────────────────────────────────────
export async function queuePaymentRecoveryDraft(contract: PaymentIssueContract): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Check if already queued for this contract
  const existing = await db
    .select()
    .from(emailDraftQueue)
    .where(
      and(
        eq(emailDraftQueue.contractId, contract.id),
        eq(emailDraftQueue.type, "payment_recovery_draft"),
        eq(emailDraftQueue.status, "pending")
      )
    )
    .limit(1);
  
  if (existing.length > 0) return; // Already queued

  const firstName = contract.customerName.split(" ")[0];
  const tierLabel = contract.tier === "APEX" ? "APEX Private" : `${contract.tier} Membership`;

  const emailBody = `Hi ${firstName},

I wanted to reach out personally because it looks like there may be an issue with the payment method on file for your ${tierLabel} at Industrial Cigar Company.

Your membership means a lot to us, and I want to make sure there's no interruption to your access or locker privileges.

Could you take a moment to update your payment information? You can do so directly through the link below, or feel free to call or text me and I'll take care of it.

Update payment: https://industrialcigars.com/account

If there's anything going on or you have questions, I'm always reachable. We'll hold your spot.

Talk soon,
Andrew Frakes
Industrial Cigar Company`;

  const db2 = await getDb();
  if (!db2) return;
  await db2.insert(emailDraftQueue).values({
    toEmail: contract.customerEmail,
    subject: `Quick note about your ${tierLabel} — ${firstName}`,

    body: emailBody,
    type: "payment_recovery_draft",
    memberName: contract.customerName,
    tier: contract.tier,
    contractId: contract.id,
    phone: contract.phone,
    monthlyRate: contract.monthlyRate,
    status: "pending",
  });

  console.log(`[Payment Automation] Queued payment recovery draft for ${contract.customerName}`);
}

// ─── Phone Escalation Notification ────────────────────────────────────────────
export async function notifyPhoneEscalation(contract: PaymentIssueContract): Promise<void> {
  const phoneDisplay = contract.phone || "No phone on file";
  await notifyOwner({
    title: `📞 Call ${contract.customerName} — Payment Not Recoverable by Email`,
    content: `${contract.customerName}'s ${contract.tier} membership payment has failed and their email is bouncing or undeliverable.\n\nAction needed: Call or text them directly.\n\nPhone: ${phoneDisplay}\nEmail: ${contract.customerEmail}\nTier: ${contract.tier} — $${contract.monthlyRate}/mo\n\nThis member's access may be at risk. Personal outreach is the only path forward.`,
  });
  console.log(`[Payment Automation] Phone escalation notification sent for ${contract.customerName}`);
}

// ─── Queue Welcome Email ────────────────────────────────────────────────────────
export async function queueWelcomeEmail(contract: NewMemberContract): Promise<void> {
  if (!contract.customerEmail) return;
  
  const db = await getDb();
  if (!db) return;
  
  // Check if already queued
  const existing = await db
    .select()
    .from(emailDraftQueue)
    .where(
      and(
        eq(emailDraftQueue.toEmail, contract.customerEmail),
        eq(emailDraftQueue.type, "welcome_email")
      )
    )
    .limit(1);
  
  if (existing.length > 0) return;

  const firstName = contract.customerName.split(" ")[0];
  const tierLabel = contract.tier === "APEX" ? "APEX Private" : `${contract.tier} Membership`;
  const isApex = contract.tier === "APEX";

  const emailBody = isApex
    ? `${firstName},

Welcome to APEX.

You've joined an exclusive group of members who have access to the most private space at Industrial Cigar Company. Your locker, your access, your experience — we take that seriously.

Here's what to expect next:
• We'll be in touch shortly to coordinate your locker assignment and first visit
• Your APEX card will be ready at the front desk on your first visit
• Private events and tastings will be communicated directly to you

If you have any questions before your first visit, reply here or call me directly.

Welcome to the family.

Andrew Frakes
Industrial Cigar Company`
    : `Hi ${firstName},

Welcome to Industrial Cigar Company — we're glad you're here.

Your ${tierLabel} is now active. Here's everything you need to know to get started:

• Stop by anytime during business hours — your membership is on file
• ${contract.tier === "Atabey" ? "Your locker access will be set up on your first visit" : "Ask about upgrading to Atabey for locker access"}
• Member events and private tastings are announced via email — you're on the list

We look forward to seeing you in the lounge.

Andrew Frakes
Industrial Cigar Company`;

  const db3 = await getDb();
  if (!db3) return;
  await db3.insert(emailDraftQueue).values({
    toEmail: contract.customerEmail,
    subject: isApex ? `Welcome to APEX, ${firstName}` : `Welcome to Industrial Cigar Company, ${firstName}`,

    body: emailBody,
    type: "welcome_email",
    memberName: contract.customerName,
    tier: contract.tier,
    monthlyRate: contract.monthlyRate,
    status: "pending",
  });

  console.log(`[Payment Automation] Queued welcome email for ${contract.customerName}`);
}

// ─── Main Automation Runner ────────────────────────────────────────────────────
export async function runPaymentAutomation(contracts: PaymentIssueContract[]): Promise<void> {
  let draftCount = 0;
  let escalationCount = 0;

  for (const contract of contracts) {
    if (contract.status !== "active") continue;
    if (!contract.dunning) continue;

    if (contract.emailBouncedOrFailed) {
      await notifyPhoneEscalation(contract);
      escalationCount++;
    } else {
      await queuePaymentRecoveryDraft(contract);
      draftCount++;
    }
  }

  if (draftCount > 0 || escalationCount > 0) {
    console.log(`[Payment Automation] ${draftCount} drafts queued, ${escalationCount} phone escalations sent`);
  }
}
