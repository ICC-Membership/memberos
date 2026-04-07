/**
 * Lightspeed R-Series API Integration
 * Handles OAuth flow, token storage, and data fetching
 */
import type { Express } from "express";
import { getDb } from "./db";
import { integrationTokens } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const LS_CLIENT_ID = process.env.LIGHTSPEED_CLIENT_ID!;
const LS_CLIENT_SECRET = process.env.LIGHTSPEED_CLIENT_SECRET!;
const LS_API_BASE = "https://api.lightspeedapp.com/API/V3";
const LS_AUTH_URL = "https://cloud.lightspeedapp.com/auth/oauth/authorize";
const LS_TOKEN_URL = "https://cloud.lightspeedapp.com/auth/oauth/token";

// ── Token Storage ─────────────────────────────────────────────────────────────

export async function getLightspeedToken(): Promise<{ accessToken: string; refreshToken: string; accountId: string } | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    const rows = await db.select().from(integrationTokens).where(eq(integrationTokens.service, "lightspeed")).limit(1);
    if (!rows.length) return null;
    const row = rows[0];
    // Check if token is expired (expires_at is stored as unix ms)
    if (row.expiresAt && Date.now() > row.expiresAt) {
      return await refreshLightspeedToken(row.refreshToken!, row.accountId!);
    }
    return { accessToken: row.accessToken, refreshToken: row.refreshToken!, accountId: row.accountId! };
  } catch {
    return null;
  }
}

async function saveLightspeedToken(accessToken: string, refreshToken: string, accountId: string, expiresIn: number) {
  const expiresAt = Date.now() + (expiresIn - 60) * 1000; // subtract 60s buffer
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(integrationTokens).where(eq(integrationTokens.service, "lightspeed"));
  await db.insert(integrationTokens).values({
    service: "lightspeed",
    accessToken,
    refreshToken,
    accountId,
    expiresAt,
    createdAt: new Date(),
  });
}

async function refreshLightspeedToken(refreshToken: string, accountId: string) {
  const res = await fetch(LS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: LS_CLIENT_ID,
      client_secret: LS_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const data = await res.json() as { access_token: string; refresh_token: string; expires_in: number };
  await saveLightspeedToken(data.access_token, data.refresh_token, accountId, data.expires_in);
  return { accessToken: data.access_token, refreshToken: data.refresh_token, accountId };
}

// ── OAuth Routes ──────────────────────────────────────────────────────────────

export function registerLightspeedRoutes(app: Express) {
  // Step 1: Initiate OAuth flow — redirect to Lightspeed
  app.get("/api/lightspeed/connect", (req, res) => {
    const redirectUri = `${req.protocol}://${req.get("host")}/api/lightspeed/callback`;
    const scopes = "employee:all";
    const url = `${LS_AUTH_URL}?response_type=code&client_id=${LS_CLIENT_ID}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=icc-ls-connect`;
    res.redirect(url);
  });

  // Step 2: OAuth callback — exchange code for tokens
  app.get("/api/lightspeed/callback", async (req, res) => {
    const { code, error } = req.query as { code?: string; error?: string };
    if (error || !code) {
      return res.redirect("/?lightspeed=error&reason=" + (error || "no_code"));
    }
    try {
      const redirectUri = `${req.protocol}://${req.get("host")}/api/lightspeed/callback`;
      const tokenRes = await fetch(LS_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: LS_CLIENT_ID,
          client_secret: LS_CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      });
      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("[Lightspeed] Token exchange failed:", errText);
        return res.redirect("/?lightspeed=error&reason=token_exchange");
      }
      const tokenData = await tokenRes.json() as { access_token: string; refresh_token: string; expires_in: number };

      // Get account ID from the API
      const accountRes = await fetch(`${LS_API_BASE}/Account.json`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const accountData = await accountRes.json() as { Account: { accountID: string } };
      const accountId = accountData.Account.accountID;

      await saveLightspeedToken(tokenData.access_token, tokenData.refresh_token, accountId, tokenData.expires_in);
      console.log("[Lightspeed] Connected successfully. Account ID:", accountId);
      res.redirect("/?lightspeed=connected&accountId=" + accountId);
    } catch (err) {
      console.error("[Lightspeed] Callback error:", err);
      res.redirect("/?lightspeed=error&reason=server_error");
    }
  });

  // Status check endpoint
  app.get("/api/lightspeed/status", async (_req, res) => {
    const token = await getLightspeedToken();
    res.json({ connected: !!token, accountId: token?.accountId || null });
  });
}

// ── API Helpers ───────────────────────────────────────────────────────────────

async function lsGet(path: string): Promise<any> {
  const token = await getLightspeedToken();
  if (!token) throw new Error("Lightspeed not connected");
  const url = `${LS_API_BASE}/Account/${token.accountId}/${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token.accessToken}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Lightspeed API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// Paginate through all results
async function lsGetAll(path: string, key: string): Promise<any[]> {
  const results: any[] = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const separator = path.includes("?") ? "&" : "?";
    const data = await lsGet(`${path}${separator}limit=${limit}&offset=${offset}`);
    const items = data[key];
    if (!items) break;
    const arr = Array.isArray(items) ? items : [items];
    results.push(...arr);
    if (arr.length < limit) break;
    offset += limit;
  }
  return results;
}

// ── Data Fetchers ─────────────────────────────────────────────────────────────

export async function getLightspeedCustomers() {
  return lsGetAll('Customer.json?load_relations=[%22Contact%22]', 'Customer');
}

export async function getLightspeedSales(since?: Date) {
  const dateFilter = since
    ? `&timeStamp=%3E%3C%2C${since.toISOString().split("T")[0]}%2C${new Date().toISOString().split("T")[0]}`
    : "";
  return lsGetAll(`Sale.json?load_relations=["SaleLines","Customer"]${dateFilter}`, "Sale");
}

export async function getLightspeedCustomerSales(customerId: string) {
  return lsGetAll(`Sale.json?customerID=${customerId}&load_relations=["SaleLines"]`, "Sale");
}

export async function getLightspeedAccountInfo() {
  const data = await lsGet("Account.json");
  return data.Account;
}

// Calculate visit frequency and spend for a customer
export async function getCustomerEngagement(customerId: string) {
  const sales = await getLightspeedCustomerSales(customerId);
  if (!sales.length) return { visitCount: 0, totalSpend: 0, avgMonthlySpend: 0, lastVisit: null };

  const totalSpend = sales.reduce((sum: number, s: any) => sum + parseFloat(s.calcTotal || "0"), 0);
  const dates = sales.map((s: any) => new Date(s.timeStamp)).sort((a: Date, b: Date) => b.getTime() - a.getTime());
  const lastVisit = dates[0];
  const firstVisit = dates[dates.length - 1];
  const monthsActive = Math.max(1, (lastVisit.getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const avgMonthlySpend = totalSpend / monthsActive;

  return { visitCount: sales.length, totalSpend, avgMonthlySpend, lastVisit };
}
