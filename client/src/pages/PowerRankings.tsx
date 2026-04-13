/*
 * Power Rankings — ICC Membership OS
 * Member scoring system for APEX lounge invitation eligibility
 * Live data from DB — scores auto-populate when Lightspeed is connected
 */
import { useState } from "react";
import { Trophy, Star, TrendingUp, RefreshCw, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";

const SCORING_CRITERIA = [
  { category: "Visits", max: 30, color: "#8899CC", description: "Monthly lounge visits (3 pts each, max 10 visits)" },
  { category: "Spend", max: 25, color: "#22C55E", description: "Monthly F&B + retail spend ($50 = 1pt, max 25pts)" },
  { category: "Referrals", max: 20, color: "#C4A35A", description: "Active member referrals (5 pts each)" },
  { category: "Tenure", max: 15, color: "#9B7FC7", description: "Membership length (1pt/month, max 15)" },
  { category: "Events", max: 10, color: "#EAB308", description: "Event attendance (2 pts each, max 5 events)" },
];

const APEX_THRESHOLD = 70;

function TierBadge({ tier }: { tier: string }) {
  if (tier === "APEX") return <span className="tier-badge-apex">{tier}</span>;
  if (tier === "Atabey") return <span className="tier-badge-atabey">{tier}</span>;
  return <span className="tier-badge-visionary">{tier}</span>;
}

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#2A2A2A" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
      </div>
      <span className="text-xs w-6 text-right" style={{ color: "#A09A94" }}>{value}</span>
    </div>
  );
}

export default function PowerRankings() {
  const [tierFilter, setTierFilter] = useState<"All" | "APEX" | "Atabey" | "Visionary">("All");

  const { data: members = [], isLoading } = trpc.members.list.useQuery();
  const { data: lsStatus } = trpc.lightspeed.status.useQuery();

  // Build ranked list from live DB data
  const ranked = (members as any[])
    .filter(m => m.status === "Active")
    .filter(m => tierFilter === "All" || m.tier === tierFilter)
    .map(m => ({
      id: m.id,
      name: m.name,
      tier: m.tier,
      visits: m.visitScore ?? 0,
      spend: m.spendScore ?? 0,
      referrals: m.referralScore ?? 0,
      tenure: m.tenureScore ?? 0,
      events: m.eventScore ?? 0,
      total: m.totalScore ?? 0,
      apexEligible: (m.totalScore ?? 0) >= APEX_THRESHOLD || m.apexEligible,
    }))
    .sort((a, b) => b.total - a.total)
    .map((m, i) => ({ ...m, rank: i + 1 }));

  const apexEligible = ranked.filter(m => m.apexEligible);
  const scoresAreEmpty = ranked.length > 0 && ranked.every(m => m.total === 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", letterSpacing: "0.06em", color: "#E8E4DC" }}>
            POWER RANKINGS
          </h1>
          <p style={{ fontSize: "0.75rem", color: "#6B6560", marginTop: "0.15rem" }}>
            {ranked.length} active members ranked · Scores auto-update from Lightspeed
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["All", "APEX", "Atabey", "Visionary"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-all"
              style={{
                background: tierFilter === t ? "#C8102E" : "transparent",
                color: tierFilter === t ? "white" : "#6B6560",
                border: `1px solid ${tierFilter === t ? "#C8102E" : "#2A2A2A"}`,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Lightspeed connection notice */}
      {scoresAreEmpty && (
        <div className="flex items-start gap-3 px-4 py-3 rounded" style={{ background: "rgba(196,163,90,0.08)", border: "1px solid rgba(196,163,90,0.25)" }}>
          <Zap size={14} style={{ color: "#C4A35A", flexShrink: 0, marginTop: "0.1rem" }} />
          <div>
            <p style={{ fontSize: "0.78rem", color: "#C4A35A", fontWeight: 600 }}>
              {lsStatus?.connected ? "Lightspeed connected — scores will populate after first data sync" : "Connect Lightspeed to auto-populate visit and spend scores"}
            </p>
            <p style={{ fontSize: "0.7rem", color: "#6B6560", marginTop: "0.2rem" }}>
              Member names and tiers are live from Appstle. Visit and spend scores require Lightspeed POS data.
              {!lsStatus?.connected && (
                <a href="/api/lightspeed/connect" style={{ color: "#C4A35A", marginLeft: "0.4rem" }}>Connect Lightspeed →</a>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Scoring criteria */}
      <div className="icc-card" style={{ padding: "1.25rem" }}>
        <div className="flex items-center gap-2 mb-3">
          <Star size={14} style={{ color: "#C8102E" }} />
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.9rem", letterSpacing: "0.08em", color: "#E8E4DC" }}>
            SCORING CRITERIA — 100 POINTS TOTAL
          </h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {SCORING_CRITERIA.map(c => (
            <div key={c.category} className="p-3 rounded" style={{ background: "#141414" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold" style={{ color: "#E8E4DC" }}>{c.category}</span>
                <span className="text-xs font-bold" style={{ color: c.color }}>/{c.max}</span>
              </div>
              <p className="text-[10px]" style={{ color: "#3A3A3A" }}>{c.description}</p>
            </div>
          ))}
        </div>
        <div className="red-rule mt-3 pt-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: "#C8102E" }} />
          <p className="text-xs" style={{ color: "#A09A94" }}>
            APEX Lounge invitation threshold: <span style={{ color: "#E8E4DC", fontWeight: 600 }}>70+ points</span>
            {apexEligible.length > 0 && ` — ${apexEligible.length} member${apexEligible.length > 1 ? "s" : ""} qualify`}
          </p>
        </div>
      </div>

      {/* APEX Eligible highlight */}
      {apexEligible.length > 0 && (
        <div className="p-4 rounded-lg border" style={{ background: "rgba(200,16,46,0.08)", borderColor: "rgba(200,16,46,0.35)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={14} style={{ color: "#C8102E" }} />
            <h3 className="text-sm font-semibold" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#E8E4DC" }}>
              APEX LOUNGE INVITATIONS
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-sm ml-auto" style={{ background: "#C8102E", color: "white" }}>
              {apexEligible.length} Eligible
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {apexEligible.map(m => (
              <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 rounded-md" style={{ background: "#161616", border: "1px solid rgba(200,16,46,0.40)" }}>
                <span className="text-xs font-medium" style={{ color: "#E8E4DC" }}>{m.name}</span>
                {m.total > 0 && <span className="text-xs font-bold" style={{ color: "#C8102E" }}>{m.total}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rankings table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 gap-3" style={{ color: "#3A3A3A" }}>
          <RefreshCw size={16} className="animate-spin" />
          <span style={{ fontSize: "0.82rem" }}>Loading member rankings...</span>
        </div>
      ) : ranked.length === 0 ? (
        <div className="icc-card flex flex-col items-center justify-center py-12 gap-3">
          <TrendingUp size={24} style={{ color: "#3A3A3A" }} />
          <p style={{ fontSize: "0.82rem", color: "#3A3A3A" }}>No active members found. Sync from Appstle first.</p>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden border" style={{ borderColor: "#2A2A2A" }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "#141414", borderBottom: "1px solid #2A2A2A" }}>
                <th className="text-left px-4 py-3 font-medium tracking-wide uppercase w-10" style={{ color: "#6B6560" }}>#</th>
                <th className="text-left px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>Member</th>
                <th className="text-left px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>Tier</th>
                <th className="text-left px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>Visits</th>
                <th className="text-left px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>Spend</th>
                <th className="text-left px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>Referrals</th>
                <th className="text-left px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>Tenure</th>
                <th className="text-left px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>Events</th>
                <th className="text-center px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>Total</th>
                <th className="text-center px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>APEX</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((m, i) => (
                <tr
                  key={m.id}
                  className="border-b transition-colors duration-150"
                  style={{
                    borderColor: "#1E1E1E",
                    background: m.apexEligible && m.total > 0 ? "rgba(200,16,46,0.08)" : (i % 2 === 0 ? "#1C1C1C" : "#161616"),
                  }}
                >
                  <td className="px-4 py-3">
                    <span className="font-bold" style={{ color: m.rank <= 3 ? "#C4A35A" : "#3A3A3A" }}>
                      {m.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "#1E1E1E", color: "#C8102E" }}>
                        {(m.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium" style={{ color: "#E8E4DC" }}>{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><TierBadge tier={m.tier} /></td>
                  <td className="px-4 py-3 w-24"><ScoreBar value={m.visits} max={30} color="#8899CC" /></td>
                  <td className="px-4 py-3 w-24"><ScoreBar value={m.spend} max={25} color="#22C55E" /></td>
                  <td className="px-4 py-3 w-24"><ScoreBar value={m.referrals} max={20} color="#C4A35A" /></td>
                  <td className="px-4 py-3 w-24"><ScoreBar value={m.tenure} max={15} color="#9B7FC7" /></td>
                  <td className="px-4 py-3 w-24"><ScoreBar value={m.events} max={10} color="#EAB308" /></td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-sm" style={{ color: m.total >= APEX_THRESHOLD ? "#C8102E" : "#E8E4DC" }}>
                      {m.total}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.apexEligible && m.total > 0 ? (
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#C8102E", color: "white" }}>YES</span>
                    ) : (
                      <span style={{ color: "#2A2A2A" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
