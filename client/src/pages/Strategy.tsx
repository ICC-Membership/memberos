/**
 * Strategy — ICC Membership OS
 * 200-member growth plan with live data from Appstle + DB
 */
import { Target, TrendingUp, Users, Zap, ExternalLink, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";

const ACQUISITION_CHANNELS = [
  { channel: "Member Referrals", target: 25, notes: "Commission plan active — $750–$1,000 per quarter for top referrer", priority: "high" },
  { channel: "Events & Activations", target: 20, notes: "Each event should convert 3–5 guests to members. Invite non-member guests.", priority: "high" },
  { channel: "Instagram / Social", target: 15, notes: "Showcase lounge experience, APEX events, humidor. DM follow-up within 24h.", priority: "medium" },
  { channel: "Typeform Inquiries", target: 15, notes: "Current average: 8–10 inquiries/month. Close rate target: 60%.", priority: "high" },
  { channel: "Corporate / Group", target: 10, notes: "Target local businesses, law firms, financial advisors. 3-pack pricing.", priority: "medium" },
  { channel: "Walk-in / Floor Sales", target: 15, notes: "Staff trained to present membership on every visit. Script in Training.", priority: "medium" },
];

const WEEKLY_ACTIONS = [
  { day: "Monday", actions: ["Review Power Rankings scorecard", "Check Typeform for new inquiries", "Respond to all unread emails in Email Hub"] },
  { day: "Tuesday", actions: ["Follow up with prospects from last week", "Check Appstle for upcoming renewals (7-day window)", "Post 1 piece of content on Instagram"] },
  { day: "Wednesday", actions: ["Call or text top 3 prospects", "Review member activation scores", "Plan upcoming event outreach"] },
  { day: "Thursday", actions: ["Staff check-in on floor sales", "Review commission tracking", "Send 1 personalized note to an at-risk member"] },
  { day: "Friday", actions: ["Weekly scorecard update in Ninety.io", "Pipeline cleanup — move stale prospects", "Plan next week's Top 3 priorities"] },
];

const ANNUAL_TARGET = 200;
const QUARTERLY_TARGETS = [
  { quarter: "Q1 2026", target: 150, deadline: "April 1" },
  { quarter: "Q2 2026", target: 165, deadline: "July 1" },
  { quarter: "Q3 2026", target: 180, deadline: "October 1" },
  { quarter: "Q4 2026", target: 200, deadline: "Dec 31" },
];

function currentQuarter(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const q = month <= 3 ? 1 : month <= 6 ? 2 : month <= 9 ? 3 : 4;
  return `Q${q} ${year}`;
}

export default function Strategy() {
  const { data: liveStats, isLoading: statsLoading } = trpc.shopify.liveStats.useQuery();
  const { data: dbStats } = trpc.members.stats.useQuery();
  const { data: prospects } = trpc.prospects.list.useQuery();
  const { data: rocks } = trpc.rocks.list.useQuery({ quarter: "Q1 2026" });

  // Use Appstle live stats if available, fall back to DB stats
  const activeCount = liveStats?.active ?? dbStats?.active ?? 0;
  const apexCount = liveStats?.apex ?? dbStats?.apex ?? 0;
  const atabeyCount = liveStats?.atabey ?? dbStats?.atabey ?? 0;
  const visionaryCount = liveStats?.visionary ?? dbStats?.visionary ?? 0;
  const mrr = liveStats?.mrr ?? 0;
  const paused = liveStats?.paused ?? 0;
  const dunning = liveStats?.dunning ?? 0;

  const neededFor200 = Math.max(0, ANNUAL_TARGET - activeCount);
  const openProspects = prospects?.filter((p: any) => !["Closed Won", "Closed Lost"].includes(p.status)).length ?? 0;
  const closedWon = prospects?.filter((p: any) => p.status === "Closed Won").length ?? 0;

  const cqLabel = currentQuarter();
  const cqData = QUARTERLY_TARGETS.find(q => q.quarter === cqLabel) || QUARTERLY_TARGETS[0];
  const cqPct = Math.min(100, Math.round((activeCount / cqData.target) * 100));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#E8E4DC" }}>
            Strategy
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B6560" }}>
            Path to 200 members by December 31, 2026 · Live from Appstle
          </p>
        </div>
        <a
          href="https://app.ninety.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs px-4 py-2 rounded-md border transition-all duration-180"
          style={{ color: "#C8102E", borderColor: "#C8102E", background: "rgba(200,16,46,0.1)" }}
        >
          <ExternalLink size={12} />
          Ninety.io
        </a>
      </div>

      {/* Live KPI bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Active Members", value: activeCount, color: "#E8E4DC", sub: `of ${ANNUAL_TARGET} target` },
          { label: "MRR", value: mrr ? `$${mrr.toLocaleString()}` : "—", color: "#C8102E", sub: mrr ? `~$${Math.round(mrr * 12 / 1000)}k ARR` : "Appstle sync" },
          { label: "APEX", value: apexCount, color: "#C8102E", sub: "$499/mo" },
          { label: "Atabey", value: atabeyCount, color: "#D4AF37", sub: "$299/mo" },
          { label: "Visionary", value: visionaryCount, color: "#8899CC", sub: "$199/mo" },
          { label: "Open Prospects", value: openProspects, color: "#4CAF50", sub: `${closedWon} closed won` },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "10px 14px" }}>
            <div style={{ fontSize: "1.4rem", fontFamily: "'Bebas Neue', sans-serif", color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: "0.65rem", color: "#888", letterSpacing: "0.05em" }}>{kpi.label.toUpperCase()}</div>
            <div style={{ fontSize: "0.6rem", color: "#444", marginTop: "2px" }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Annual milestone timeline with live current count */}
      <div className="icc-card">
        <div className="flex items-center gap-2 mb-5">
          <Target size={13} style={{ color: "#C8102E" }} />
          <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: "#C8102E" }}>
            2026 Membership Milestones
          </h2>
          {statsLoading && <RefreshCw size={11} style={{ color: "#555", animation: "spin 1s linear infinite" }} />}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {QUARTERLY_TARGETS.map((m) => {
            const isCurrent = m.quarter === cqLabel;
            const pct = isCurrent ? cqPct : 0;
            return (
              <div
                key={m.quarter}
                className="p-4 rounded-lg border"
                style={{
                  background: isCurrent ? "rgba(200,16,46,0.12)" : "#161616",
                  borderColor: isCurrent ? "#C8102E" : "#1E1E1E",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color: isCurrent ? "#C8102E" : "#6B6560" }}>
                    {m.quarter}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#C8102E", color: "#E8E4DC" }}>
                      Active
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#E8E4DC" }}>
                  {m.target}
                </p>
                <p className="text-xs mb-3" style={{ color: "#6B6560" }}>members by {m.deadline}</p>
                {isCurrent && (
                  <>
                    <div className="w-full h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "#2A2A2A" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #C8102E, #E8E4DC)" }} />
                    </div>
                    <p className="text-[10px]" style={{ color: "#6B6560" }}>{activeCount} / {m.target} ({pct}%)</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Q1 Rocks from DB */}
      {rocks && rocks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide uppercase flex items-center gap-2" style={{ color: "#C8102E" }}>
            <Zap size={13} />
            Q1 2026 Rocks — Live from EOS
          </h2>
          {rocks.map((rock: any) => (
            <div key={rock.id} className="icc-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs mr-2" style={{ color: "#6B6560" }}>{rock.status}</span>
                  <span className="text-sm font-semibold" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#E8E4DC" }}>
                    {rock.title}
                  </span>
                </div>
                <span className="text-sm font-bold" style={{ color: (rock.progressPct ?? 0) >= 80 ? "#4CAF50" : "#A09A94" }}>
                  {rock.progressPct ?? 0}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "#2A2A2A" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${rock.progressPct ?? 0}%`,
                    background: (rock.progressPct ?? 0) >= 80
                      ? "linear-gradient(90deg, #4CAF50, #8BC34A)"
                      : "linear-gradient(90deg, #C8102E, #E8E4DC)",
                  }}
                />
              </div>
              {rock.description && (
                <p className="text-xs" style={{ color: "#6B6560" }}>{rock.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Membership gap analysis */}
      <div className="icc-card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={13} style={{ color: "#C8102E" }} />
          <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: "#C8102E" }}>
            Gap Analysis — {neededFor200} Members Needed to Hit 200
          </h2>
        </div>
        <div className="space-y-3">
          {ACQUISITION_CHANNELS.map((ch) => (
            <div key={ch.channel} className="flex items-start gap-4 p-3 rounded-lg" style={{ background: "#161616" }}>
              <div className="text-center flex-shrink-0 w-12">
                <p className="text-xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#E8E4DC" }}>+{ch.target}</p>
                <p className="text-[9px]" style={{ color: "#6B6560" }}>target</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: "#E8E4DC" }}>{ch.channel}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      background: ch.priority === "high" ? "rgba(200,16,46,0.15)" : "rgba(107,101,96,0.2)",
                      color: ch.priority === "high" ? "#C8102E" : "#6B6560",
                    }}
                  >
                    {ch.priority}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "#6B6560" }}>{ch.notes}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg" style={{ background: "rgba(200,16,46,0.06)", border: "1px solid rgba(200,16,46,0.2)" }}>
          <p className="text-xs" style={{ color: "#C8102E" }}>
            <strong>Revenue impact at 200 members:</strong> Assuming current tier mix ({apexCount} APEX / {atabeyCount} Atabey / {visionaryCount} Visionary),
            reaching 200 active members projects to ~${Math.round(((apexCount / Math.max(1, activeCount)) * 499 + (atabeyCount / Math.max(1, activeCount)) * 299 + (visionaryCount / Math.max(1, activeCount)) * 199) * 200).toLocaleString()}/mo MRR.
          </p>
        </div>
      </div>

      {/* Alerts: paused + dunning */}
      {(paused > 0 || dunning > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {paused > 0 && (
            <div style={{ background: "rgba(255,152,0,0.08)", border: "1px solid rgba(255,152,0,0.25)", borderRadius: "8px", padding: "12px 16px" }}>
              <div style={{ fontSize: "0.7rem", color: "#FF9800", letterSpacing: "0.08em", marginBottom: "4px" }}>⚠ PAUSED SUBSCRIPTIONS</div>
              <div style={{ fontSize: "1.4rem", fontFamily: "'Bebas Neue', sans-serif", color: "#FF9800" }}>{paused}</div>
              <div style={{ fontSize: "0.7rem", color: "#888" }}>members on hold — review in Win-Back Queue</div>
            </div>
          )}
          {dunning > 0 && (
            <div style={{ background: "rgba(200,16,46,0.08)", border: "1px solid rgba(200,16,46,0.25)", borderRadius: "8px", padding: "12px 16px" }}>
              <div style={{ fontSize: "0.7rem", color: "#C8102E", letterSpacing: "0.08em", marginBottom: "4px" }}>⚠ FAILED PAYMENTS</div>
              <div style={{ fontSize: "1.4rem", fontFamily: "'Bebas Neue', sans-serif", color: "#C8102E" }}>{dunning}</div>
              <div style={{ fontSize: "0.7rem", color: "#888" }}>members in dunning — check Email Hub draft queue</div>
            </div>
          )}
        </div>
      )}

      {/* Weekly cadence */}
      <div className="icc-card">
        <div className="flex items-center gap-2 mb-4">
          <Users size={13} style={{ color: "#C8102E" }} />
          <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: "#C8102E" }}>
            Weekly Execution Cadence
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {WEEKLY_ACTIONS.map((day) => (
            <div key={day.day} className="p-3 rounded-lg" style={{ background: "#161616" }}>
              <p className="text-xs font-bold mb-2" style={{ color: "#C8102E", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>
                {day.day}
              </p>
              <div className="space-y-1.5">
                {day.actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px]" style={{ color: "#A09A94" }}>
                    <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#3A3A3A" }} />
                    {action}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
