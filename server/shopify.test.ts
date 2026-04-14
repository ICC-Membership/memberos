import { describe, it, expect } from "vitest";

describe("Shopify API credentials", () => {
  it("should connect to Shopify and return a valid customer count", async () => {
    const storeDomain = process.env.SHOPIFY_STORE_DOMAIN || "";
    const clientId = process.env.SHOPIFY_CLIENT_ID || "";
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET || "";

    if (!storeDomain || !clientId || !clientSecret) {
      console.warn("Shopify env vars not set — skipping live API test");
      return;
    }

    // Get access token
    const tokenRes = await fetch(`https://${storeDomain}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
    });
    const tokenData = await tokenRes.json() as { access_token?: string };
    expect(tokenData.access_token).toBeTruthy();
    expect(tokenData.access_token).toMatch(/^shpat_/);

    // Verify we can read customers
    const countRes = await fetch(`https://${storeDomain}/admin/api/2026-04/customers/count.json`, {
      headers: { "X-Shopify-Access-Token": tokenData.access_token! },
    });
    const countData = await countRes.json() as { count?: number };
    expect(typeof countData.count).toBe("number");
    expect(countData.count).toBeGreaterThan(0);
  });
});
