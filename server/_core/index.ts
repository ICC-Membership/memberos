import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerLightspeedRoutes } from "../lightspeed";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { fetchAppstleMembers } from "../appstle";
import { upsertMember } from "../db";
import { notifyOwner } from "./notification";
import { runPaymentAutomation, queueWelcomeEmail } from "../paymentAutomation";

// ─── Auto-sync Appstle members to DB ────────────────────────────────────────
async function runAppstleSync(notifyOnIssues = false) {
  try {
    const appstleMembers = await fetchAppstleMembers();
    const dunningMembers: string[] = [];

    // Track new active members for welcome emails
    const newActiveEmails = new Set<string>();

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
      if (m.dunning) dunningMembers.push(`${m.name} (${m.tier} — $${m.monthlyRate}/mo)`);
      // Queue welcome email for recently activated members (within last 48 hours)
      if (m.status === "Active" && m.joinedAt) {
        const hoursOld = (Date.now() - m.joinedAt.getTime()) / (1000 * 60 * 60);
        if (hoursOld <= 48) {
          await queueWelcomeEmail({
            customerName: m.name,
            customerEmail: m.email || "",
            tier: m.tier,
            monthlyRate: m.monthlyRate,
            activatedOn: m.joinedAt.toISOString(),
          });
        }
      }
    }

    console.log(`[Appstle Sync] Synced ${appstleMembers.length} members at ${new Date().toISOString()}`);

    // Run payment automation — queues drafts for dunning members
    const paymentIssueContracts = appstleMembers
      .filter(m => m.dunning)
      .map(m => ({
        id: m.appstleContractId,
        customerName: m.name,
        customerEmail: m.email || "",
        phone: m.phone,
        tier: m.tier,
        monthlyRate: m.monthlyRate,
        dunning: m.dunning,
        emailBouncedOrFailed: false, // will be enriched in future
        status: m.status.toLowerCase(),
      }));
    await runPaymentAutomation(paymentIssueContracts);

    // Notify owner if there are dunning members (once per day at 8 AM)
    if (notifyOnIssues && dunningMembers.length > 0) {
      await notifyOwner({
        title: `⚠️ ${dunningMembers.length} Member Payment Issue${dunningMembers.length > 1 ? 's' : ''}`,
        content: `The following members have failed payments in Appstle:\n\n${dunningMembers.join('\n')}\n\nGmail drafts have been queued for your review. Log in to the Membership OS for details.`,
      });
    }
  } catch (e) {
    console.error("[Appstle Sync] Error:", e);
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Lightspeed R-Series OAuth routes
  registerLightspeedRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Run initial sync immediately on startup, then every 30 minutes
  setTimeout(() => runAppstleSync(false), 5000); // 5s delay to let DB connect
  setInterval(() => runAppstleSync(false), 30 * 60 * 1000); // every 30 min
  // Daily dunning notification at 8 AM (check every hour, fire once per day)
  let lastDunningNotifyDate = "";
  setInterval(() => {
    const now = new Date();
    const dateStr = now.toDateString();
    if (now.getHours() === 8 && dateStr !== lastDunningNotifyDate) {
      lastDunningNotifyDate = dateStr;
      runAppstleSync(true); // notify on issues
    }
  }, 60 * 60 * 1000); // check every hour
}

startServer().catch(console.error);
