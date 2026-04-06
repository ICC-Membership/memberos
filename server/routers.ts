import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  getAllMembers, getMemberById, upsertMember, deleteMember, getMemberStats,
  getAllRocks, upsertRock, deleteRock,
  getAllMeetingNotes, getMeetingNoteById, insertMeetingNote,
  getAllEmails, upsertEmail, markEmailRead, saveAiReply,
  getAllProspects, upsertProspect,
} from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  members: router({
    list: publicProcedure.query(() => getAllMembers()),
    stats: publicProcedure.query(() => getMemberStats()),
    get: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => getMemberById(input.id)),
    upsert: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        externalId: z.string().optional(),
        name: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        tier: z.enum(["Visionary", "Atabey", "APEX"]).optional(),
        status: z.enum(["Active", "Paused", "Cancelled"]).optional(),
        lockerNumber: z.string().optional(),
        lockerSection: z.string().optional(),
        joinedAt: z.date().optional(),
        renewalDate: z.date().optional(),
        monthlyRate: z.number().optional(),
        notes: z.string().optional(),
        visitScore: z.number().optional(),
        spendScore: z.number().optional(),
        referralScore: z.number().optional(),
        tenureScore: z.number().optional(),
        eventScore: z.number().optional(),
        totalScore: z.number().optional(),
        apexEligible: z.boolean().optional(),
      }))
      .mutation(({ input }) => upsertMember(input as any)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteMember(input.id)),
  }),

  rocks: router({
    list: publicProcedure
      .input(z.object({ quarter: z.string().optional() }))
      .query(({ input }) => getAllRocks(input.quarter)),
    upsert: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        title: z.string(),
        description: z.string().optional(),
        owner: z.string().optional(),
        quarter: z.string().optional(),
        dueDate: z.date().optional(),
        status: z.enum(["On Track", "Off Track", "Done", "Not Started"]).optional(),
        progressPct: z.number().min(0).max(100).optional(),
        ninetyUrl: z.string().optional(),
      }))
      .mutation(({ input }) => upsertRock(input as any)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteRock(input.id)),
  }),

  meetingNotes: router({
    list: publicProcedure.query(() => getAllMeetingNotes()),
    get: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => getMeetingNoteById(input.id)),
    upload: protectedProcedure
      .input(z.object({
        title: z.string(),
        meetingDate: z.date().optional(),
        rawTranscript: z.string(),
        fileUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const aiResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an executive assistant for Andrew Frakes, Head of Membership at Industrial Cigar Company in Frisco, Texas.
Analyze this L10 meeting transcript and extract:
1. All mentions of "membership", "member", "members", or Andrew's name
2. Any action items assigned to Andrew or related to membership
3. A brief summary (3-5 sentences) focused on membership-relevant content
Return JSON with keys: membershipMentions (array of strings), actionItems (array of strings), summary (string)`
            },
            { role: "user", content: input.rawTranscript }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "meeting_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  membershipMentions: { type: "array", items: { type: "string" } },
                  actionItems: { type: "array", items: { type: "string" } },
                  summary: { type: "string" }
                },
                required: ["membershipMentions", "actionItems", "summary"],
                additionalProperties: false
              }
            }
          }
        });
        let parsed = { membershipMentions: [] as string[], actionItems: [] as string[], summary: "" };
        try {
          const content = aiResponse.choices?.[0]?.message?.content as string | undefined;
          if (content) parsed = JSON.parse(content);
        } catch (e) { console.error("Failed to parse AI response", e); }

        const id = await insertMeetingNote({
          title: input.title,
          meetingDate: input.meetingDate,
          rawTranscript: input.rawTranscript,
          aiSummary: parsed.summary,
          membershipMentions: JSON.stringify(parsed.membershipMentions),
          actionItems: JSON.stringify(parsed.actionItems),
          fileUrl: input.fileUrl,
        });
        return { id, ...parsed };
      }),
  }),

  emails: router({
    list: publicProcedure
      .input(z.object({ category: z.string().optional() }))
      .query(({ input }) => getAllEmails(input.category)),
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => markEmailRead(input.id)),
    generateReply: protectedProcedure
      .input(z.object({
        emailId: z.number(),
        from: z.string(),
        subject: z.string(),
        body: z.string(),
        category: z.string(),
      }))
      .mutation(async ({ input }) => {
        const systemPrompts: Record<string, string> = {
          inquiry: `You are Andrew Frakes, Head of Membership at Industrial Cigar Company in Frisco, Texas — one of the world's premier cigar lounges.
Write a warm, professional reply to a membership inquiry. Highlight the exclusive experience, the three membership tiers (Visionary at $199/mo, Atabey at $299/mo, APEX at $499/mo),
and invite them for a personal tour. Keep it concise, premium in tone, and end with a clear call to action.`,
          renewal: `You are Andrew Frakes, Head of Membership at Industrial Cigar Company.
Write a warm, professional reply about a membership renewal. Thank them for their loyalty,
confirm their renewal details, and express excitement about the upcoming quarter's events and experiences.`,
          issue: `You are Andrew Frakes, Head of Membership at Industrial Cigar Company.
Write an empathetic, professional reply addressing a member concern. Acknowledge the issue,
apologize for any inconvenience, and outline the steps being taken to resolve it.`,
          event: `You are Andrew Frakes, Head of Membership at Industrial Cigar Company.
Write an enthusiastic, professional reply about an event inquiry or RSVP.
Provide relevant details, express excitement, and make them feel like a valued part of the ICC community.`,
          general: `You are Andrew Frakes, Head of Membership at Industrial Cigar Company.
Write a warm, professional reply. Keep it concise and helpful.`,
        };
        const prompt = systemPrompts[input.category] || systemPrompts.general;
        const aiResponse = await invokeLLM({
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: `Reply to this email:\n\nFrom: ${input.from}\nSubject: ${input.subject}\n\n${input.body}` }
          ]
        });
        const draft = (aiResponse.choices?.[0]?.message?.content as string) || "";
        await saveAiReply(input.emailId, draft);
        return { draft };
      }),
    syncFromGmail: protectedProcedure
      .input(z.object({
        emails: z.array(z.object({
          gmailId: z.string(),
          from: z.string(),
          subject: z.string(),
          snippet: z.string().optional(),
          body: z.string().optional(),
          receivedAt: z.date().optional(),
        }))
      }))
      .mutation(async ({ input }) => {
        for (const email of input.emails) {
          const catResponse = await invokeLLM({
            messages: [
              { role: "system", content: `Categorize this email for a cigar lounge membership manager. Return only one word: inquiry, renewal, issue, event, or general.` },
              { role: "user", content: `Subject: ${email.subject}\n${email.snippet || ""}` }
            ]
          });
          const raw = ((catResponse.choices?.[0]?.message?.content as string) || "general").toLowerCase().trim();
          const category = ["inquiry", "renewal", "issue", "event", "general"].includes(raw) ? raw : "general";
          await upsertEmail({
            gmailId: email.gmailId,
            from: email.from,
            subject: email.subject,
            snippet: email.snippet,
            body: email.body,
            receivedAt: email.receivedAt,
            category: category as any,
            isRead: false,
          });
        }
        return { synced: input.emails.length };
      }),
  }),

  prospects: router({
    list: publicProcedure.query(() => getAllProspects()),
    upsert: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        name: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        source: z.string().optional(),
        interestedTier: z.enum(["Visionary", "Atabey", "APEX"]).optional(),
        status: z.enum(["New", "Contacted", "Tour Scheduled", "Proposal Sent", "Closed Won", "Closed Lost"]).optional(),
        referredBy: z.string().optional(),
        notes: z.string().optional(),
        lastContactedAt: z.date().optional(),
      }))
      .mutation(({ input }) => upsertProspect(input as any)),
  }),

  shopify: router({
    // Fetch live member/subscription data from Shopify using client credentials
    syncMembers: protectedProcedure.mutation(async () => {
      const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
      const clientId = process.env.SHOPIFY_CLIENT_ID;
      const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

      if (!storeDomain || !clientId || !clientSecret) {
        throw new Error("Shopify credentials not configured");
      }

      // Get a fresh access token using client credentials
      const tokenRes = await fetch(`https://${storeDomain}/admin/oauth/access_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
      });
      const tokenData = await tokenRes.json() as { access_token?: string };
      const accessToken = tokenData.access_token;
      if (!accessToken) throw new Error("Failed to get Shopify access token");

      // Fetch customers with membership tags
      const customersRes = await fetch(
        `https://${storeDomain}/admin/api/2026-04/customers.json?limit=250&fields=id,first_name,last_name,email,phone,tags,created_at,note`,
        { headers: { "X-Shopify-Access-Token": accessToken } }
      );
      const customersData = await customersRes.json() as { customers?: any[] };
      const customers = customersData.customers || [];

      // Filter to only customers with membership-related tags
      const memberTierMap: Record<string, string> = {
        "apex": "APEX",
        "atabey": "Atabey",
        "visionary": "Visionary",
        "member": "Visionary",
      };

      let synced = 0;
      for (const c of customers) {
        const tags: string[] = (c.tags || "").toLowerCase().split(",").map((t: string) => t.trim());
        let tier: string | undefined;
        for (const tag of tags) {
          for (const [key, val] of Object.entries(memberTierMap)) {
            if (tag.includes(key)) { tier = val; break; }
          }
          if (tier) break;
        }
        if (!tier) continue; // skip non-members

        await upsertMember({
          externalId: String(c.id),
          name: `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Unknown",
          email: c.email || undefined,
          phone: c.phone || undefined,
          tier: tier as any,
          status: "Active",
          notes: c.note || undefined,
          joinedAt: c.created_at ? new Date(c.created_at) : undefined,
        });
        synced++;
      }
      return { synced, total: customers.length };
    }),

    liveStats: publicProcedure.query(async () => {
      const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
      const clientId = process.env.SHOPIFY_CLIENT_ID;
      const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
      if (!storeDomain || !clientId || !clientSecret) return null;

      try {
        const tokenRes = await fetch(`https://${storeDomain}/admin/oauth/access_token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
        });
        const tokenData = await tokenRes.json() as { access_token?: string };
        const accessToken = tokenData.access_token;
        if (!accessToken) return null;

        // Get customer count
        const countRes = await fetch(
          `https://${storeDomain}/admin/api/2026-04/customers/count.json`,
          { headers: { "X-Shopify-Access-Token": accessToken } }
        );
        const countData = await countRes.json() as { count?: number };

        return {
          totalCustomers: countData.count || 0,
          storeDomain,
          lastSynced: new Date(),
        };
      } catch (e) {
        console.error("Shopify liveStats error:", e);
        return null;
      }
    }),
  }),

  dashboard: router({
    summary: publicProcedure.query(async () => {
      const [stats, allRocks, recentEmails, recentNotes] = await Promise.all([
        getMemberStats(),
        getAllRocks("Q1 2026"),
        getAllEmails(),
        getAllMeetingNotes(),
      ]);
      return {
        memberStats: stats,
        rocks: allRocks.slice(0, 3),
        unreadEmails: recentEmails.filter((e: any) => !e.isRead).length,
        recentMeetingNote: recentNotes[0] || null,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
