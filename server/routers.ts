import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { fetchAppstleMembers, getAppstleHealthStats } from "./appstle";
import { getLightspeedToken, getLightspeedCustomers, getLightspeedSales } from "./lightspeed";
import { getQueueStats } from "./emailQueue";
import { getDb } from "./db";
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
    // Sync all members from Appstle subscription contracts into the local DB
    syncMembers: protectedProcedure.mutation(async () => {
      const appstleMembers = await fetchAppstleMembers();
      let synced = 0;
      for (const m of appstleMembers) {
        await upsertMember({
          externalId: m.externalId,
          name: m.name,
          email: m.email || undefined,
          phone: m.phone,
          tier: m.tier,
          status: m.status,
          monthlyRate: m.monthlyRate,
          joinedAt: m.joinedAt,
          renewalDate: m.nextBillingDate,
          notes: m.dunning ? "Payment issue - dunning active" : undefined,
        });
        synced++;
      }
      return { synced, total: appstleMembers.length };
    }),
    // Live stats direct from Appstle (no DB needed - always fresh)
    liveStats: publicProcedure.query(async () => {
      try {
        return await getAppstleHealthStats();
      } catch (e) {
        console.error("Appstle liveStats error:", e);
        return null;
      }
    }),
    // Full member health data from Appstle for the members page
    healthData: publicProcedure.query(async () => {
      try {
        return await fetchAppstleMembers();
      } catch (e) {
        console.error("Appstle healthData error:", e);
        return [];
      }
    }),
  }),

  lightspeed: router({
    // Check if Lightspeed is connected
    status: publicProcedure.query(async () => {
      const token = await getLightspeedToken();
      return { connected: !!token, accountId: token?.accountId || null };
    }),
    // Identify prospects from Lightspeed POS — frequent visitors not yet members
    prospects: protectedProcedure
      .input(z.object({ minVisits: z.number().default(3) }))
      .query(async ({ input }) => {
        const token = await getLightspeedToken();
        if (!token) return { connected: false, prospects: [] };
        try {
          // Get all Lightspeed customers
          const lsCustomers = await getLightspeedCustomers();
          // Get current member emails for cross-reference
          const currentMembers = await getAllMembers();
          const memberEmails = new Set(currentMembers.map((m: any) => (m.email || "").toLowerCase()));
          // Get recent sales (last 90 days) to calculate visit frequency
          const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          const recentSales = await getLightspeedSales(since90);
          // Aggregate visits and spend per customer
          const customerStats: Record<string, { name: string; email: string; phone: string; visits: number; spend: number; lastVisit: Date }> = {};
          for (const sale of recentSales) {
            const cid = sale.customerID;
            if (!cid || cid === "0") continue;
            if (!customerStats[cid]) {
              const customer = lsCustomers.find((c: any) => c.customerID === cid);
              if (!customer) continue;
              const email = customer.Contact?.Emails?.ContactEmail?.[0]?.address || customer.Contact?.Emails?.ContactEmail?.address || "";
              const firstName = customer.firstName || "";
              const lastName = customer.lastName || "";
              customerStats[cid] = { name: `${firstName} ${lastName}`.trim() || "Unknown", email, phone: customer.Contact?.Phones?.ContactPhone?.[0]?.number || "", visits: 0, spend: 0, lastVisit: new Date(0) };
            }
            customerStats[cid].visits++;
            customerStats[cid].spend += parseFloat(sale.calcTotal || "0");
            const saleDate = new Date(sale.timeStamp);
            if (saleDate > customerStats[cid].lastVisit) customerStats[cid].lastVisit = saleDate;
          }
          // Filter: frequent visitors not already members
          const prospects = Object.values(customerStats)
            .filter(c => c.visits >= input.minVisits && c.email && !memberEmails.has(c.email.toLowerCase()))
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 50)
            .map(c => ({ ...c, lastVisit: c.lastVisit.toISOString() }));
          return { connected: true, prospects };
        } catch (e) {
          console.error("Lightspeed prospects error:", e);
          return { connected: true, prospects: [], error: String(e) };
        }
      }),
  }),

  emailAutomation: router({
    // Get current email draft queue status
    queueStats: protectedProcedure.query(async () => {
      return getQueueStats();
    }),
    // Manually trigger queue processing (creates Gmail drafts)
    processQueue: protectedProcedure.mutation(async () => {
      return { processed: 0, message: "Queue processing handled by agent scheduler" };
    }),
    // Get all dunning members for the admin UI
    dunningMembers: publicProcedure.query(async () => {
      const stats = await getAppstleHealthStats();
      const allMembers = await fetchAppstleMembers();
      const dunning = allMembers
        .filter(m => m.dunning && m.status === 'Active')
        .map(m => ({
          name: m.name,
          email: m.email,
          phone: m.phone,
          tier: m.tier,
          monthlyRate: m.monthlyRate,
          contractId: m.appstleContractId,
        }));
      return { dunning, total: dunning.length };
    }),
  }),

  winback: router({
    // Get HIGH priority win-back candidates from cancelled/paused members
    candidates: protectedProcedure.query(async () => {
      const allMembers = await fetchAppstleMembers();
      const now = new Date();

      const candidates = allMembers
        .filter(m => m.status === 'Cancelled' || m.status === 'Paused')
        .map(m => {
          const daysSince = m.cancelledOn
            ? Math.floor((now.getTime() - m.cancelledOn.getTime()) / (1000 * 60 * 60 * 24))
            : m.pausedOn
            ? Math.floor((now.getTime() - m.pausedOn.getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          // Score: recency (0-40) + tier value (0-30) + tenure (0-30)
          const recencyScore = daysSince <= 30 ? 40 : daysSince <= 60 ? 30 : daysSince <= 90 ? 20 : daysSince <= 180 ? 10 : 0;
          const tierScore = m.tier === 'APEX' ? 30 : m.tier === 'Atabey' ? 20 : 10;
          const tenureScore = m.joinedAt
            ? Math.min(30, Math.floor((now.getTime() - m.joinedAt.getTime()) / (1000 * 60 * 60 * 24 * 30)) * 3)
            : 0;
          const totalScore = recencyScore + tierScore + tenureScore;

          return {
            name: m.name,
            email: m.email,
            phone: m.phone,
            tier: m.tier,
            monthlyRate: m.monthlyRate,
            status: m.status,
            daysSince,
            totalScore,
            priority: totalScore >= 60 ? 'HIGH' : totalScore >= 40 ? 'MEDIUM' : 'LOW',
            cancellationFeedback: m.cancellationFeedback,
          };
        })
        .filter(m => m.totalScore >= 40) // Only HIGH and MEDIUM
        .sort((a, b) => b.totalScore - a.totalScore);

      return candidates;
    }),
    // Queue an AI-generated re-engagement email draft for a specific candidate
    draftReengagement: protectedProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().optional(),
        tier: z.string(),
        daysSince: z.number(),
        monthlyRate: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const firstName = input.name.split(' ')[0];
        const tierContext = input.tier === 'APEX'
          ? 'They were an APEX member — our most exclusive tier. Emphasize the private APEX lounge, quarterly events, and personal connection.'
          : input.tier === 'Atabey'
          ? 'They were an Atabey member. Highlight new lounge additions, events, and the premium experience.'
          : 'They were a Visionary member. Keep it warm and low-pressure, focus on community and value.';
        const aiResponse = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `You are Andrew Frakes, Head of Membership at Industrial Cigar Company in Frisco, Texas — one of the world's premier cigar lounges. Write a warm, personal win-back email to a former member. ${tierContext} Keep it under 150 words, personal, and end with a clear soft call to action (reply to chat, come in for a smoke, etc.). Do NOT use generic marketing language.`
            },
            {
              role: 'user',
              content: `Write a win-back email for ${input.name} (${input.tier} tier). They cancelled/paused ${input.daysSince} days ago. Monthly rate was $${input.monthlyRate || 0}.`
            }
          ]
        });
        const draft = (aiResponse.choices?.[0]?.message?.content as string) || '';
        // Queue the draft in the email queue
        const db = await getDb();
        if (db) {
          const { emailDraftQueue } = await import('../drizzle/schema');
          await db.insert(emailDraftQueue).values({
            toEmail: input.email || '',
            memberName: input.name,
            subject: `We miss you at ICC, ${firstName}`,
            body: draft,
            type: 'winback_draft',
            tier: input.tier,
            monthlyRate: input.monthlyRate,
            status: 'pending',
          });
        }
        return { draft, queued: true };
      }),
  }),

  apexReview: router({
    // Get Atabey members ranked by Power Score for APEX quarterly review
    candidates: protectedProcedure.query(async () => {
      const allDbMembers = await getAllMembers();
      const atabeyMembers = allDbMembers
        .filter((m: any) => m.tier === 'Atabey' && m.status === 'Active')
        .map((m: any) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          phone: m.phone,
          monthlyRate: m.monthlyRate,
          joinedAt: m.joinedAt,
          totalScore: m.totalScore || 0,
          visitScore: m.visitScore || 0,
          spendScore: m.spendScore || 0,
          referralScore: m.referralScore || 0,
          tenureScore: m.tenureScore || 0,
          eventScore: m.eventScore || 0,
          apexEligible: m.apexEligible || false,
        }))
        .sort((a: any, b: any) => b.totalScore - a.totalScore);

      return {
        candidates: atabeyMembers,
        topCandidates: atabeyMembers.slice(0, 5),
        quarterLabel: 'Q2 2026',
        reviewDue: new Date('2026-06-15').toISOString(),
      };
    }),
    // Mark a member as APEX eligible
    setApexEligible: protectedProcedure
      .input(z.object({ memberId: z.number(), eligible: z.boolean() }))
      .mutation(async ({ input }) => {
        await upsertMember({ id: input.memberId, name: '', apexEligible: input.eligible } as any);
        return { success: true };
      }),
    // Draft a personalized APEX invitation email for an eligible Atabey member
    draftInvite: protectedProcedure
      .input(z.object({
        memberId: z.number(),
        name: z.string(),
        email: z.string().optional(),
        totalScore: z.number(),
        tenureScore: z.number(),
      }))
      .mutation(async ({ input }) => {
        const firstName = input.name.split(' ')[0];
        const aiResponse = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `You are Andrew Frakes, Head of Membership at Industrial Cigar Company in Frisco, Texas. Write a warm, exclusive, personal invitation email to an Atabey member who has earned an invitation to the APEX Lounge — our most exclusive private space. The tone should feel like a personal note from Andrew, not a marketing email. Mention their loyalty and tenure as a member. Keep it under 120 words. End with an invitation to come in for a private tour of the APEX Lounge.`
            },
            {
              role: 'user',
              content: `Write an APEX invitation for ${input.name}. They have a Power Score of ${input.totalScore} and have been a member for approximately ${Math.round(input.tenureScore / 1.5)} months.`
            }
          ]
        });
        const draft = (aiResponse.choices?.[0]?.message?.content as string) || '';
        const db = await getDb();
        if (db) {
          const { emailDraftQueue } = await import('../drizzle/schema');
          await db.insert(emailDraftQueue).values({
            toEmail: input.email || '',
            memberName: input.name,
            subject: `${firstName}, you've been invited to the APEX Lounge`,
            body: draft,
            type: 'apex_invite',
            tier: 'Atabey',
            status: 'pending',
          });
        }
        return { draft, queued: true };
      }),
  }),

  // ─── Staff & Commission ────────────────────────────────────────────────────
  staff: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const { staff } = await import('../drizzle/schema');
      return db.select().from(staff).orderBy(staff.name);
    }),
    getLeaderboard: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const { staff } = await import('../drizzle/schema');
      const allStaff = await db.select().from(staff).where(eq(staff.isActive, true));
      // Sort by closedQtr desc, then closedAllTime
      return allStaff.sort((a, b) => (b.closedQtr ?? 0) - (a.closedQtr ?? 0) || (b.closedAllTime ?? 0) - (a.closedAllTime ?? 0));
    }),
    upsert: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        name: z.string(),
        referralCode: z.string().optional(),
        shopifyUrl: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        role: z.string().optional(),
        isActive: z.boolean().optional(),
        toursGivenAllTime: z.number().optional(),
        toursGivenQtr: z.number().optional(),
        closedAllTime: z.number().optional(),
        closedQtr: z.number().optional(),
        closedYTD: z.number().optional(),
        bonusEligibleQtr: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('DB unavailable');
        const { staff } = await import('../drizzle/schema');
        if (input.id) {
          await db.update(staff).set({ ...input, updatedAt: new Date() } as any).where(eq(staff.id, input.id));
          return { success: true };
        }
        await db.insert(staff).values(input as any);
        return { success: true };
      }),
    logTour: protectedProcedure
      .input(z.object({
        staffId: z.number().optional(),
        staffName: z.string(),
        prospectFirstName: z.string(),
        prospectLastName: z.string().optional(),
        prospectEmail: z.string().optional(),
        prospectPhone: z.string().optional(),
        cameWithGroup: z.boolean().optional(),
        interestedTier: z.enum(["Visionary", "Atabey", "APEX"]).optional(),
        converted: z.boolean().optional(),
        memberId: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('DB unavailable');
        const { tourLogs, staff } = await import('../drizzle/schema');
        await db.insert(tourLogs).values({ ...input, tourDate: new Date() } as any);
        // Increment tour count for the staff member
        if (input.staffId) {
          await db.execute(
            sql`UPDATE staff SET toursGivenAllTime = toursGivenAllTime + 1, toursGivenQtr = toursGivenQtr + 1 WHERE id = ${input.staffId}`
          );
          if (input.converted) {
            await db.execute(
              sql`UPDATE staff SET closedAllTime = closedAllTime + 1, closedQtr = closedQtr + 1, closedYTD = closedYTD + 1 WHERE id = ${input.staffId}`
            );
          }
        }
        return { success: true };
      }),
    getTourLogs: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const { tourLogs } = await import('../drizzle/schema');
      return db.select().from(tourLogs).orderBy(desc(tourLogs.tourDate)).limit(200);
    }),
    resetQuarter: protectedProcedure.mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      await db.execute(sql`UPDATE staff SET toursGivenQtr = 0, closedQtr = 0, bonusEligibleQtr = 0`);
      return { success: true };
    }),
  }),

  // ─── Lockers ─────────────────────────────────────────────────────────────────
  lockers: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const { lockers } = await import('../drizzle/schema');
      return db.select().from(lockers).orderBy(lockers.section, lockers.lockerNumber);
    }),
    assign: protectedProcedure
      .input(z.object({
        lockerNumber: z.string(),
        memberId: z.number().nullable(),
        memberName: z.string().nullable(),
        tier: z.enum(["Visionary", "Atabey", "APEX"]).nullable(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('DB unavailable');
        const { lockers } = await import('../drizzle/schema');
        const isAvailable = input.memberId === null;
        await db.update(lockers)
          .set({
            memberId: input.memberId,
            memberName: input.memberName,
            tier: input.tier as any,
            isAvailable,
            assignedAt: isAvailable ? null : new Date(),
            notes: input.notes,
            updatedAt: new Date(),
          })
          .where(eq(lockers.lockerNumber, input.lockerNumber));
        return { success: true };
      }),
    seed: protectedProcedure
      .input(z.object({
        lockers: z.array(z.object({
          lockerNumber: z.string(),
          section: z.string().optional(),
          row: z.number().optional(),
          col: z.number().optional(),
        }))
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('DB unavailable');
        const { lockers } = await import('../drizzle/schema');
        for (const l of input.lockers) {
          const existing = await db.select().from(lockers).where(eq(lockers.lockerNumber, l.lockerNumber));
          if (existing.length === 0) {
            await db.insert(lockers).values({ ...l, isAvailable: true } as any);
          }
        }
        return { success: true, count: input.lockers.length };
      }),
  }),

  // ─── Member 360 Profile ───────────────────────────────────────────────────────
  member360: router({
    get: publicProcedure
      .input(z.object({ memberId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const { members, tourLogs, lockers } = await import('../drizzle/schema');
        const [member] = await db.select().from(members).where(eq(members.id, input.memberId));
        if (!member) return null;
        // Get their locker
        const locker = member.lockerNumber
          ? (await db.select().from(lockers).where(eq(lockers.lockerNumber, member.lockerNumber)))[0]
          : null;
        // Get tours they were involved in (as converted prospect)
        const tours = await db.select().from(tourLogs).where(eq(tourLogs.memberId, input.memberId));
        return { member, locker, tours };
      }),
  }),

  scores: router({
    // Compute tenure + tier scores for all active members
    compute: protectedProcedure.mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      const { members } = await import('../drizzle/schema');
      const allActive = await db.select().from(members).where(eq(members.status, 'Active'));
      const now = new Date();
      let updated = 0;
      for (const m of allActive) {
        const monthsAsMember = m.joinedAt
          ? (now.getTime() - new Date(m.joinedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
          : 0;
        const tenureScore = Math.min(15, Math.round(monthsAsMember * 1.5));
        const tierScore = m.tier === 'APEX' ? 30 : m.tier === 'Atabey' ? 20 : 10;
        const totalScore = (m.visitScore || 0) + (m.spendScore || 0) + (m.referralScore || 0) + tenureScore + (m.eventScore || 0) + tierScore;
        const apexEligible = m.tier === 'APEX' || (m.tier === 'Atabey' && totalScore >= 28);
        await db.update(members)
          .set({ tenureScore, totalScore, apexEligible })
          .where(eq(members.id, m.id));
        updated++;
      }
      return { updated };
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
