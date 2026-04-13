/**
 * Appstle Memberships API Integration
 * Pulls subscription contracts with full status, pricing, and health data
 */

const APPSTLE_API_KEY = process.env.APPSTLE_API_KEY!;
const APPSTLE_BASE = "https://membership-admin.appstle.com/api/external/v2";

interface AppstleContract {
  id: number;
  customerId: number;
  customerName: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  phone?: string;
  status: "active" | "paused" | "cancelled";
  contractAmount: number;
  contractAmountUSD: number;
  billingPolicyInterval: "month" | "year";
  billingPolicyIntervalCount: number;
  nextBillingDate?: string;
  activatedOn?: string;
  pausedOn?: string;
  cancelledOn?: string;
  dunning: boolean;
  contractDetailsJSON?: string | any[];
  cancellationFeedback?: string;
  emailBouncedOrFailed?: boolean;
}

async function fetchAllContracts(): Promise<AppstleContract[]> {
  const all: AppstleContract[] = [];
  let page = 0;
  const size = 100;

  while (true) {
    const res = await fetch(
      `${APPSTLE_BASE}/subscription-contract-details?page=${page}&size=${size}`,
      {
        headers: {
          "X-API-Key": APPSTLE_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    if (!res.ok) {
      console.error("[Appstle] Fetch failed:", res.status, await res.text());
      break;
    }
    const data = await res.json() as AppstleContract[];
    if (!Array.isArray(data) || data.length === 0) break;
    all.push(...data);
    if (data.length < size) break;
    page++;
  }
  return all;
}

function getTierFromContract(contract: AppstleContract): "APEX" | "Atabey" | "Visionary" {
  // Try to parse from contractDetailsJSON product title
  if (contract.contractDetailsJSON) {
    try {
      const details = typeof contract.contractDetailsJSON === "string"
        ? JSON.parse(contract.contractDetailsJSON)
        : contract.contractDetailsJSON;
      const lines = Array.isArray(details) ? details : Object.values(details);
      for (const line of lines as any[]) {
        const title = (line.title || "").toLowerCase();
        if (title.includes("apex")) return "APEX";
        if (title.includes("atabey")) return "Atabey";
        if (title.includes("visionary")) return "Visionary";
      }
    } catch { /* ignore */ }
  }
  // Fallback: infer from price
  const amount = contract.contractAmount || 0;
  const monthly = contract.billingPolicyInterval === "year" ? amount / 12 : amount;
  if (monthly >= 200) return "APEX";
  if (monthly >= 100) return "Atabey";
  return "Visionary";
}

function getMonthlyRate(contract: AppstleContract): number {
  const amount = contract.contractAmount || 0;
  if (contract.billingPolicyInterval === "year") return Math.round((amount / 12) * 100) / 100;
  return amount;
}

export interface AppstleMemberData {
  externalId: string;
  appstleContractId: number;
  name: string;
  email: string;
  phone?: string;
  tier: "APEX" | "Atabey" | "Visionary";
  status: "Active" | "Paused" | "Cancelled";
  monthlyRate: number;
  joinedAt?: Date;
  nextBillingDate?: Date;
  dunning: boolean;
  pausedOn?: Date;
  cancelledOn?: Date;
  cancellationFeedback?: string;
}

export async function fetchAppstleMembers(): Promise<AppstleMemberData[]> {
  const contracts = await fetchAllContracts();
  return contracts.map((c) => ({
    externalId: String(c.customerId),
    appstleContractId: c.id,
    name: c.customerName || `${c.customerFirstName || ""} ${c.customerLastName || ""}`.trim() || "Unknown",
    email: c.customerEmail || "",
    phone: c.phone || undefined,
    tier: getTierFromContract(c),
    status: c.status === "active" ? "Active" : c.status === "paused" ? "Paused" : "Cancelled",
    monthlyRate: getMonthlyRate(c),
    joinedAt: c.activatedOn ? new Date(c.activatedOn) : undefined,
    nextBillingDate: c.nextBillingDate ? new Date(c.nextBillingDate) : undefined,
    dunning: c.dunning || false,
    pausedOn: c.pausedOn ? new Date(c.pausedOn) : undefined,
    cancelledOn: c.cancelledOn ? new Date(c.cancelledOn) : undefined,
    cancellationFeedback: c.cancellationFeedback || undefined,
  }));
}

export interface AppstleHealthStats {
  active: number;
  paused: number;
  cancelled: number;
  dunning: number;
  failedBilling: number;
  mrr: number;
  apex: number;
  atabey: number;
  visionary: number;
  lastSynced: Date;
}

export async function getAppstleHealthStats(): Promise<AppstleHealthStats> {
  const contracts = await fetchAllContracts();
  const active = contracts.filter(c => c.status === "active");
  const paused = contracts.filter(c => c.status === "paused");
  const cancelled = contracts.filter(c => c.status === "cancelled");

  let mrr = 0;
  active.forEach(c => {
    const monthly = c.billingPolicyInterval === "year"
      ? c.contractAmount / 12
      : c.contractAmount;
    mrr += monthly;
  });

  const tierCounts = { apex: 0, atabey: 0, visionary: 0 };
  active.forEach(c => {
    const tier = getTierFromContract(c);
    if (tier === "APEX") tierCounts.apex++;
    else if (tier === "Atabey") tierCounts.atabey++;
    else tierCounts.visionary++;
  });

  return {
    active: active.length,
    paused: paused.length,
    cancelled: cancelled.length,
    dunning: active.filter(c => c.dunning).length,
    failedBilling: active.filter(c => c.emailBouncedOrFailed).length,
    mrr: Math.round(mrr),
    apex: tierCounts.apex,
    atabey: tierCounts.atabey,
    visionary: tierCounts.visionary,
    lastSynced: new Date(),
  };
}
