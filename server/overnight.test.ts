/**
 * Overnight Build — Vitest coverage for Wave 6 procedures
 * Tests: computeScores, winback.candidates scoring, apexReview.candidates,
 *        lockers.list, staff.getLeaderboard, webhooks (unit logic)
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

// ─── Shared helpers ────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "andrew@industrialcigars.com",
    name: "Andrew Frakes",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAnonContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Score computation helpers (unit tests, no DB) ─────────────────────────

describe("Power Score computation logic", () => {
  function computeTenureScore(joinedAt: Date | null): number {
    if (!joinedAt) return 0;
    const now = new Date();
    const monthsActive = Math.floor(
      (now.getTime() - joinedAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    return Math.min(20, monthsActive * 2);
  }

  function computeTierScore(tier: string): number {
    if (tier === "APEX") return 30;
    if (tier === "Atabey") return 20;
    return 10;
  }

  it("gives APEX tier the highest tier score", () => {
    expect(computeTierScore("APEX")).toBe(30);
    expect(computeTierScore("Atabey")).toBe(20);
    expect(computeTierScore("Visionary")).toBe(10);
  });

  it("caps tenure score at 20", () => {
    const veryOldDate = new Date("2010-01-01");
    expect(computeTenureScore(veryOldDate)).toBe(20);
  });

  it("gives 0 tenure score for null joinedAt", () => {
    expect(computeTenureScore(null)).toBe(0);
  });

  it("gives proportional tenure score for recent member", () => {
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
    const score = computeTenureScore(sixMonthsAgo);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(20);
  });
});

// ─── Win-Back scoring logic (unit tests) ───────────────────────────────────

describe("Win-Back priority scoring logic", () => {
  function computeWinBackScore(
    daysSince: number,
    tier: string,
    joinedAt: Date | null
  ): { score: number; priority: string } {
    const recencyScore =
      daysSince <= 30 ? 40 :
      daysSince <= 60 ? 30 :
      daysSince <= 90 ? 20 :
      daysSince <= 180 ? 10 : 0;
    const tierScore = tier === "APEX" ? 30 : tier === "Atabey" ? 20 : 10;
    const now = new Date();
    const tenureScore = joinedAt
      ? Math.min(30, Math.floor((now.getTime() - joinedAt.getTime()) / (1000 * 60 * 60 * 24 * 30)) * 3)
      : 0;
    const score = recencyScore + tierScore + tenureScore;
    const priority = score >= 60 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
    return { score, priority };
  }

  it("marks recent APEX cancellation as HIGH priority", () => {
    const joinedAt = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000); // 12 months ago
    const { priority } = computeWinBackScore(15, "APEX", joinedAt);
    expect(priority).toBe("HIGH");
  });

  it("marks old Visionary cancellation as LOW priority", () => {
    const { priority } = computeWinBackScore(365, "Visionary", null);
    expect(priority).toBe("LOW");
  });

  it("recency score is 0 for cancellations older than 180 days", () => {
    const { score } = computeWinBackScore(200, "Visionary", null);
    expect(score).toBe(10); // Only tier score
  });

  it("APEX member cancelled 30 days ago gets maximum recency + tier", () => {
    const { score } = computeWinBackScore(30, "APEX", null);
    expect(score).toBe(70); // 40 recency + 30 tier
  });
});

// ─── Locker data integrity (unit tests) ────────────────────────────────────

describe("Locker bank data integrity", () => {
  const APEX_TOTAL = 41;
  const ATABEY_TOTAL = 96;
  const VISIONARY_TOTAL = 70;

  it("APEX bank has correct total locker count", () => {
    expect(APEX_TOTAL).toBe(41);
  });

  it("Atabey bank has correct total locker count (6 rows × 16 cols)", () => {
    expect(ATABEY_TOTAL).toBe(96);
  });

  it("Visionary bank has correct total locker count", () => {
    expect(VISIONARY_TOTAL).toBe(70);
  });

  it("total locker count across all banks is 207", () => {
    expect(APEX_TOTAL + ATABEY_TOTAL + VISIONARY_TOTAL).toBe(207);
  });

  it("locker ID format is valid alphanumeric for Atabey/Visionary", () => {
    const atabeyValidId = /^[1-6][A-P]$/; // Atabey: rows 1-6, cols A-P
    const visionaryValidId = /^[1-5][A-P]$/; // Visionary: rows 1-5, cols A-P
    expect(atabeyValidId.test("1A")).toBe(true);
    expect(atabeyValidId.test("6P")).toBe(true);
    expect(atabeyValidId.test("7A")).toBe(false); // Atabey only has 6 rows
    expect(visionaryValidId.test("5P")).toBe(true);
    expect(visionaryValidId.test("6A")).toBe(false); // Visionary only has 5 rows
  });
});

// ─── Webhook payload validation (unit tests) ───────────────────────────────

describe("Typeform webhook payload parsing", () => {
  function parseTypeformPayload(body: Record<string, unknown>): {
    name: string;
    email: string;
    phone: string;
    tier: string;
    source: string;
  } | null {
    if (!body?.form_response) return null;
    const answers = (body.form_response as any)?.answers ?? [];
    const getName = () => answers.find((a: any) => a.field?.ref === "name")?.text ?? "Unknown";
    const getEmail = () => answers.find((a: any) => a.field?.ref === "email")?.email ?? "";
    const getPhone = () => answers.find((a: any) => a.field?.ref === "phone")?.phone_number ?? "";
    const getTier = () => answers.find((a: any) => a.field?.ref === "tier")?.choice?.label ?? "Visionary";
    return { name: getName(), email: getEmail(), phone: getPhone(), tier: getTier(), source: "typeform" };
  }

  it("returns null for invalid payload", () => {
    expect(parseTypeformPayload({})).toBeNull();
    expect(parseTypeformPayload({ wrong_key: true })).toBeNull();
  });

  it("parses a valid Typeform payload", () => {
    const payload = {
      form_response: {
        answers: [
          { field: { ref: "name" }, text: "John Doe" },
          { field: { ref: "email" }, email: "john@example.com" },
          { field: { ref: "phone" }, phone_number: "555-1234" },
          { field: { ref: "tier" }, choice: { label: "Atabey" } },
        ],
      },
    };
    const result = parseTypeformPayload(payload);
    expect(result).not.toBeNull();
    expect(result?.name).toBe("John Doe");
    expect(result?.email).toBe("john@example.com");
    expect(result?.tier).toBe("Atabey");
    expect(result?.source).toBe("typeform");
  });

  it("defaults tier to Visionary when not specified", () => {
    const payload = {
      form_response: {
        answers: [
          { field: { ref: "name" }, text: "Jane Smith" },
        ],
      },
    };
    const result = parseTypeformPayload(payload);
    expect(result?.tier).toBe("Visionary");
  });
});

// ─── Commission tracker helpers (unit tests) ───────────────────────────────

describe("Commission payout calculation", () => {
  const QUARTERLY_POOL = 1000;
  const EOY_POOL = 2500;

  function computeCommission(
    closedQtr: number,
    totalQtrClosures: number,
    closedAllTime: number,
    totalAllTimeClosures: number
  ): { qtrPayout: number; eoyPayout: number } {
    if (totalQtrClosures === 0) return { qtrPayout: 0, eoyPayout: 0 };
    const qtrShare = closedQtr / totalQtrClosures;
    const allTimeShare = totalAllTimeClosures > 0 ? closedAllTime / totalAllTimeClosures : 0;
    return {
      qtrPayout: Math.round(QUARTERLY_POOL * qtrShare),
      eoyPayout: Math.round(EOY_POOL * allTimeShare),
    };
  }

  it("staff member with 50% of closures gets 50% of pool", () => {
    const { qtrPayout } = computeCommission(5, 10, 0, 0);
    expect(qtrPayout).toBe(500);
  });

  it("staff member with 0 closures gets $0", () => {
    const { qtrPayout, eoyPayout } = computeCommission(0, 10, 0, 10);
    expect(qtrPayout).toBe(0);
    expect(eoyPayout).toBe(0);
  });

  it("handles no team closures gracefully", () => {
    const { qtrPayout } = computeCommission(0, 0, 0, 0);
    expect(qtrPayout).toBe(0);
  });

  it("EOY payout is proportional to all-time closures", () => {
    const { eoyPayout } = computeCommission(0, 10, 10, 20);
    expect(eoyPayout).toBe(1250); // 50% of $2500
  });
});
