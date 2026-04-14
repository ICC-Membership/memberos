/**
 * APEX Power Rankings — ICC Membership OS
 * Unified page: member scoring leaderboard + quarterly APEX invitation workflow
 *
 * Algorithm (100 pts max — behavior only, no tier bonus):
 *   Visit Frequency  35 pts  — monthly lounge visits (auto from Lightspeed)
 *   Spend per Visit  25 pts  — average F&B + retail spend per visit
 *   Referrals        20 pts  — active member referrals brought in
 *   Tenure           10 pts  — 1 pt per month as member, capped at 10
 *   Event Attendance 10 pts  — 2 pts per event attended, max 5 events
 *
 * Threshold: 70+ pts → APEX Lounge invitation eligible
 * Quarterly review: Atabey members are the primary APEX candidates
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Trophy, Star, TrendingUp, RefreshCw, Zap,
  Crown, CheckCircle, Clock, ChevronDown, ChevronUp, Info,
} from "lucide-react";

const ICC_RED = "#C8102E";
const GOLD = "#D4AF37";
const APEX_THRESHOLD = 70;

// ─── Sub-components ────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string }) {
  if (tier === "APEX") return <span className="tier-badge-apex">{tier}</span>;
  if (tier === "Atabey") return <span className="tier-badge-atabey">{tier}</span>;
  return <span className="tier-badge-visionary">{tier}</span>;
}

function ScoreBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span style={{ fontSize: "0.6rem", color: "#6B6560", letterSpacing: "0.06em" }}>{label}</span>
        <span style={{ fontSize: "0.65rem", color, fontWeight: 700 }}>{value}/{max}</span>
      </div>
      <div style={{ height: "3px", background: "#1E1E1E", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px", transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function AlgorithmCard({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const criteria = [
    { category: "Visit Freq",  max: 35, color: "#8899CC", desc: "Monthly lounge visits — auto from Lightspeed POS" },
    { category: "Spend/Visit", max: 25, color: "#22C55E", desc: "Average F&B + retail spend per visit" },
    { category: "Referrals",   max: 20, color: "#C4A35A", desc: "Active member referrals brought in — 5 pts each" },
    { category: "Tenure",      max: 10, color: "#9B7FC7", desc: "1 pt per month as member, capped at 10" },
    { category: "Events",      max: 10, color: "#EAB308", desc: "Event attendance — 2 pts each, max 5 events" },
  ];
  return (
    <div className="icc-card" style={{ padding: "1rem 1.25rem" }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <div className="flex items-center gap-2">
          <Info size={13} style={{ color: ICC_RED }} />
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.85rem", letterSpacing: "0.08em", color: "#E8E4DC" }}>
            SCORING ALGORITHM — 100 POINTS TOTAL · APEX THRESHOLD: 70+
          </span>
        </div>
        {expanded ? <ChevronUp size={14} style={{ color: "#6B6560" }} /> : <ChevronDown size={14} style={{ color: "#6B6560" }} />}
      </button>

      {expanded && (
        <div className="mt-3">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-3">
            {criteria.map(c => (
              <div key={c.category} className="p-3 rounded" style={{ background: "#111" }}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#E8E4DC" }}>{c.category}</span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: c.color }}>/{c.max}</span>
                </div>
                <p style={{ fontSize: "0.65rem", color: "#4A4540", lineHeight: 1.4 }}>{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="red-rule pt-3 flex items-start gap-2">
            <Crown size={12} style={{ color: GOLD, flexShrink: 0, marginTop: "2px" }} />
            <p style={{ fontSize: "0.72rem", color: "#A09A94" }}>
              <strong style={{ color: "#E8E4DC" }}>APEX Lounge Invitations</strong> are sent quarterly to Atabey members scoring 70+.
              Scores auto-populate when Lightspeed POS is connected. Referral and event scores are tracked manually until integrations are live.
              Andrew reviews the candidate list each quarter and sends personalized invitations via Email Hub.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ApexPowerRankings() {
  const [tierFilter, setTierFilter] = useState<"All" | "APEX" | "Atabey" | "Visionary">("All");
  const [showAlgo, setShowAlgo] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [draftingFor, setDraftingFor] = useState<number | null>(null);
  const [view, setView] = useState<"leaderboard" | "apex">("leaderboard");

  const { data: members = [], isLoading } = trpc.members.list.useQuery();
  const { data: apexData, refetch: refetchApex } = trpc.apexReview.candidates.useQuery();
  const { data: lsStatus } = trpc.lightspeed.status.useQuery();
  const utils = trpc.useUtils();

  const computeScores = trpc.scores.compute.useMutation({
    onSuccess: (data) => {
      toast.success(`Scores recomputed for ${data.updated} members`);
      utils.members.list.invalidate();
      refetchApex();
    },
    onError: () => toast.error("Score computation failed — are you logged in?"),
  });

  const setEligible = trpc.apexReview.setApexEligible.useMutation({
    onSuccess: () => { toast.success("APEX eligibility updated"); refetchApex(); },
    onError: (err) => toast.error(err.message),
  });

  const draftInvite = trpc.apexReview.draftInvite.useMutation({
    onSuccess: () => { setDraftingFor(null); toast.success("APEX invite drafted — check Email Hub"); },
    onError: (err) => { setDraftingFor(null); toast.error(err.message); },
  });

  // Build ranked leaderboard
  const ranked = (members as any[])
    .filter(m => m.status === "Active")
    .filter(m => tierFilter === "All" || m.tier === tierFilter)
    .map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      tier: m.tier,
      visits: m.visitScore ?? 0,
      spend: m.spendScore ?? 0,
      referrals: m.referralScore ?? 0,
      tenure: m.tenureScore ?? 0,
      events: m.eventScore ?? 0,
      total: m.totalScore ?? 0,
      apexEligible: (m.totalScore ?? 0) >= APEX_THRESHOLD || m.apexEligible,
      joinedAt: m.joinedAt,
    }))
    .sort((a, b) => b.total - a.total)
    .map((m, i) => ({ ...m, rank: i + 1 }));

  const apexCandidates = apexData?.candidates ?? [];
  const topCandidates = apexData?.topCandidates ?? [];
  const quarterLabel = apexData?.quarterLabel ?? "Q2 2026";
  const eligibleCount = apexCandidates.filter((c: any) => c.apexEligible).length;
  const scoresAreEmpty = ranked.length > 0 && ranked.every(m => m.total === 0);
  const apexEligibleFromRanked = ranked.filter(m => m.apexEligible && m.total > 0);

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: "0.06em", color: "#E8E4DC", lineHeight: 1 }}>
            APEX POWER RANKINGS
          </h1>
          <p style={{ fontSize: "0.75rem", color: "#6B6560", marginTop: "0.2rem" }}>
            {ranked.length} active members scored · {quarterLabel} quarterly review
            {eligibleCount > 0 && ` · ${eligibleCount} APEX candidate${eligibleCount > 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => computeScores.mutate()}
            disabled={computeScores.isPending}
            className="px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-all"
            style={{ background: "rgba(200,16,46,0.12)", color: ICC_RED, border: "1px solid rgba(200,16,46,0.30)" }}
          >
            <RefreshCw size={11} className={computeScores.isPending ? "animate-spin" : ""} />
            {computeScores.isPending ? "Computing..." : "Recompute Scores"}
          </button>
        </div>
      </div>

      {/* ── View Toggle ── */}
      <div className="flex gap-2">
        {(["leaderboard", "apex"] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-4 py-2 rounded text-xs font-semibold transition-all"
            style={{
              background: view === v ? ICC_RED : "transparent",
              color: view === v ? "white" : "#6B6560",
              border: `1px solid ${view === v ? ICC_RED : "#2A2A2A"}`,
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: "0.06em",
              fontSize: "0.82rem",
            }}
          >
            {v === "leaderboard" ? "FULL LEADERBOARD" : `APEX CANDIDATES (${eligibleCount})`}
          </button>
        ))}
      </div>

      {/* ── Algorithm card (collapsible) ── */}
      <AlgorithmCard expanded={showAlgo} onToggle={() => setShowAlgo(s => !s)} />

      {/* ── Lightspeed notice ── */}
      {scoresAreEmpty && (
        <div className="flex items-start gap-3 px-4 py-3 rounded" style={{ background: "rgba(196,163,90,0.08)", border: "1px solid rgba(196,163,90,0.25)" }}>
          <Zap size={14} style={{ color: "#C4A35A", flexShrink: 0, marginTop: "0.1rem" }} />
          <div>
            <p style={{ fontSize: "0.78rem", color: "#C4A35A", fontWeight: 600 }}>
              {lsStatus?.connected ? "Lightspeed connected — scores will populate after first data sync" : "Connect Lightspeed to auto-populate visit and spend scores"}
            </p>
            <p style={{ fontSize: "0.7rem", color: "#6B6560", marginTop: "0.2rem" }}>
              Member names and tiers are live from Appstle. Visit and spend scores require Lightspeed POS data.
              {!lsStatus?.connected && <a href="/api/lightspeed/connect" style={{ color: "#C4A35A", marginLeft: "0.4rem" }}>Connect Lightspeed →</a>}
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          VIEW: LEADERBOARD
      ══════════════════════════════════════════════════════════════════ */}
      {view === "leaderboard" && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Active Members", value: ranked.length, color: ICC_RED, icon: TrendingUp },
              { label: "APEX Eligible", value: apexEligibleFromRanked.length, color: GOLD, icon: Crown },
              { label: "Top Score", value: ranked[0]?.total ?? 0, color: "#22C55E", icon: Trophy },
              { label: "Avg Score", value: ranked.length > 0 ? Math.round(ranked.reduce((s, m) => s + m.total, 0) / ranked.length) : 0, color: "#8899CC", icon: Star },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="rounded-lg p-4" style={{ background: "#141414", border: "1px solid #1E1E1E" }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: "0.65rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
                  <Icon size={13} style={{ color }} />
                </div>
                <p style={{ fontSize: "1.6rem", fontFamily: "'Bebas Neue', sans-serif", color: "#E8E4DC", lineHeight: 1 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Tier filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: "0.7rem", color: "#6B6560" }}>Filter:</span>
            {(["All", "APEX", "Atabey", "Visionary"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className="px-3 py-1 rounded text-xs font-medium transition-all"
                style={{
                  background: tierFilter === t ? ICC_RED : "transparent",
                  color: tierFilter === t ? "white" : "#6B6560",
                  border: `1px solid ${tierFilter === t ? ICC_RED : "#2A2A2A"}`,
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Rankings table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-3" style={{ color: "#3A3A3A" }}>
              <RefreshCw size={16} className="animate-spin" />
              <span style={{ fontSize: "0.82rem" }}>Loading rankings...</span>
            </div>
          ) : ranked.length === 0 ? (
            <div className="icc-card flex flex-col items-center justify-center py-12 gap-3">
              <TrendingUp size={24} style={{ color: "#3A3A3A" }} />
              <p style={{ fontSize: "0.82rem", color: "#3A3A3A" }}>No active members found. Sync from Appstle first.</p>
            </div>
          ) : (
            <div className="table-scroll rounded-lg overflow-hidden" style={{ border: "1px solid #2A2A2A" }}>
              <table className="w-full" style={{ fontSize: "0.78rem", minWidth: "700px" }}>
                <thead>
                  <tr style={{ background: "#141414", borderBottom: "1px solid #2A2A2A" }}>
                    {["#", "Member", "Tier", "Visits", "Spend", "Refs", "Tenure", "Events", "Total", "APEX"].map(h => (
                      <th key={h} className="px-3 py-3 text-left font-medium uppercase" style={{ color: "#6B6560", fontSize: "0.62rem", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((m, i) => {
                    const isExpanded = expandedRow === m.id;
                    return (
                      <>
                        <tr
                          key={m.id}
                          onClick={() => setExpandedRow(isExpanded ? null : m.id)}
                          style={{
                            background: m.apexEligible && m.total > 0
                              ? `${GOLD}08`
                              : i % 2 === 0 ? "#1C1C1C" : "#161616",
                            borderBottom: "1px solid #1E1E1E",
                            cursor: "pointer",
                          }}
                        >
                          <td className="px-3 py-2.5">
                            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.9rem", color: m.rank <= 3 ? GOLD : "#3A3A3A" }}>
                              {m.rank}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ background: "#1E1E1E", color: ICC_RED }}>
                                {(m.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: "#E8E4DC", fontSize: "0.78rem" }}>{m.name}</div>
                                {m.joinedAt && (
                                  <div style={{ fontSize: "0.62rem", color: "#3A3A3A" }}>
                                    Since {new Date(m.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5"><TierBadge tier={m.tier} /></td>
                          <td className="px-3 py-2.5" style={{ color: "#8899CC", fontWeight: 600 }}>{m.visits}</td>
                          <td className="px-3 py-2.5" style={{ color: "#22C55E", fontWeight: 600 }}>{m.spend}</td>
                          <td className="px-3 py-2.5" style={{ color: "#C4A35A", fontWeight: 600 }}>{m.referrals}</td>
                          <td className="px-3 py-2.5" style={{ color: "#9B7FC7", fontWeight: 600 }}>{m.tenure}</td>
                          <td className="px-3 py-2.5" style={{ color: "#EAB308", fontWeight: 600 }}>{m.events}</td>
                          <td className="px-3 py-2.5">
                            <span style={{
                              fontFamily: "'Bebas Neue', sans-serif",
                              fontSize: "1rem",
                              color: m.total >= APEX_THRESHOLD ? GOLD : "#E8E4DC",
                              fontWeight: 700,
                            }}>
                              {m.total}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            {m.apexEligible && m.total > 0 ? (
                              <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}44` }}>
                                ✦ YES
                              </span>
                            ) : (
                              <span style={{ color: "#2A2A2A" }}>—</span>
                            )}
                          </td>
                        </tr>
                        {/* Expanded score breakdown */}
                        {isExpanded && (
                          <tr key={`${m.id}-exp`} style={{ background: "#111", borderBottom: "1px solid #1E1E1E" }}>
                            <td colSpan={10} className="px-6 py-3">
                              <div className="grid grid-cols-5 gap-4">
                                <ScoreBar value={m.visits} max={35} color="#8899CC" label="VISIT FREQ" />
                                <ScoreBar value={m.spend} max={25} color="#22C55E" label="SPEND/VISIT" />
                                <ScoreBar value={m.referrals} max={20} color="#C4A35A" label="REFERRALS" />
                                <ScoreBar value={m.tenure} max={10} color="#9B7FC7" label="TENURE" />
                                <ScoreBar value={m.events} max={10} color="#EAB308" label="EVENTS" />
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          VIEW: APEX CANDIDATES
      ══════════════════════════════════════════════════════════════════ */}
      {view === "apex" && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Atabey Members", value: apexCandidates.length, color: ICC_RED, icon: Star },
              { label: "APEX Eligible", value: eligibleCount, color: GOLD, icon: Crown },
              { label: "Top Score", value: apexCandidates[0]?.totalScore ?? 0, color: "#22C55E", icon: TrendingUp },
              { label: "Review Due", value: apexData?.reviewDue ? new Date(apexData.reviewDue).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Jun 15", color: "#6B6570", icon: Clock },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="rounded-lg p-4" style={{ background: "#141414", border: "1px solid #1E1E1E" }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: "0.65rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
                  <Icon size={13} style={{ color }} />
                </div>
                <p style={{ fontSize: "1.6rem", fontFamily: "'Bebas Neue', sans-serif", color: "#E8E4DC", lineHeight: 1 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Top 5 spotlight */}
          {topCandidates.length > 0 && (
            <div className="rounded-lg p-5" style={{ background: "#141414", border: `1px solid ${GOLD}33` }}>
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={14} style={{ color: GOLD }} />
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem", letterSpacing: "0.08em", color: "#E8E4DC" }}>
                  TOP 5 APEX CANDIDATES — {quarterLabel}
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {topCandidates.map((c: any, i: number) => (
                  <div
                    key={c.id}
                    className="rounded-lg p-3 text-center"
                    style={{
                      background: i === 0 ? `${GOLD}11` : "#0A0A0A",
                      border: i === 0 ? `1px solid ${GOLD}44` : "1px solid #1E1E1E",
                    }}
                  >
                    <div
                      className="mx-auto flex items-center justify-center rounded-full font-bold mb-2"
                      style={{ width: "32px", height: "32px", background: i === 0 ? `${GOLD}22` : "#1C1C1C", color: i === 0 ? GOLD : "#6B6570", fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.82rem" }}
                    >
                      #{i + 1}
                    </div>
                    <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#E8E4DC" }}>{c.name}</p>
                    <p style={{ fontSize: "1.1rem", fontFamily: "'Bebas Neue', sans-serif", color: i === 0 ? GOLD : "#E8E4DC", marginTop: "0.2rem" }}>{c.totalScore}</p>
                    <p style={{ fontSize: "0.6rem", color: "#3A3A3A" }}>pts</p>
                    {c.apexEligible && <div className="mt-1"><span style={{ fontSize: "0.6rem", color: GOLD }}>✦ Eligible</span></div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Candidate table */}
          {apexCandidates.length === 0 ? (
            <div className="text-center py-12" style={{ color: "#6B6560" }}>
              <Trophy size={32} className="mx-auto mb-3 opacity-30" />
              <p>No Atabey members found. Sync from Appstle first.</p>
            </div>
          ) : (
            <div className="table-scroll rounded-lg overflow-hidden" style={{ border: "1px solid #2A2A2A" }}>
              <table className="w-full" style={{ fontSize: "0.78rem", minWidth: "700px" }}>
                <thead>
                  <tr style={{ background: "#141414", borderBottom: "1px solid #2A2A2A" }}>
                    {["#", "Member", "Visits", "Spend", "Refs", "Tenure", "Events", "Total", "APEX Status"].map(h => (
                      <th key={h} className="px-3 py-3 text-left font-medium uppercase" style={{ color: "#6B6560", fontSize: "0.62rem", letterSpacing: "0.1em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {apexCandidates.map((c: any, i: number) => (
                    <tr
                      key={c.id}
                      style={{
                        background: c.apexEligible ? `${GOLD}08` : i % 2 === 0 ? "#1C1C1C" : "#161616",
                        borderBottom: "1px solid #1E1E1E",
                      }}
                    >
                      <td className="px-3 py-3" style={{ color: "#3A3A3A", fontFamily: "'Bebas Neue', sans-serif" }}>{i + 1}</td>
                      <td className="px-3 py-3">
                        <div>
                          <p style={{ fontWeight: 600, color: "#E8E4DC" }}>{c.name}</p>
                          {c.joinedAt && (
                            <p style={{ fontSize: "0.62rem", color: "#3A3A3A" }}>
                              Since {new Date(c.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3" style={{ color: "#8899CC", fontWeight: 600 }}>{c.visitScore}</td>
                      <td className="px-3 py-3" style={{ color: "#22C55E", fontWeight: 600 }}>{c.spendScore}</td>
                      <td className="px-3 py-3" style={{ color: "#C4A35A", fontWeight: 600 }}>{c.referralScore}</td>
                      <td className="px-3 py-3" style={{ color: "#9B7FC7", fontWeight: 600 }}>{c.tenureScore}</td>
                      <td className="px-3 py-3" style={{ color: "#EAB308", fontWeight: 600 }}>{c.eventScore}</td>
                      <td className="px-3 py-3">
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", color: c.totalScore >= APEX_THRESHOLD ? GOLD : "#E8E4DC", fontWeight: 700 }}>
                          {c.totalScore}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEligible.mutate({ memberId: c.id, eligible: !c.apexEligible })}
                            disabled={setEligible.isPending}
                            className="flex items-center gap-1.5 px-2 py-1 rounded transition-all"
                            style={{
                              fontSize: "0.68rem",
                              background: c.apexEligible ? `${GOLD}22` : "transparent",
                              color: c.apexEligible ? GOLD : "#3A3A3A",
                              border: `1px solid ${c.apexEligible ? `${GOLD}44` : "#2A2A2A"}`,
                              cursor: "pointer",
                            }}
                          >
                            {c.apexEligible ? <><CheckCircle size={10} /> Eligible</> : "Mark"}
                          </button>
                          {c.apexEligible && (
                            <button
                              onClick={() => {
                                setDraftingFor(c.id);
                                draftInvite.mutate({ memberId: c.id, name: c.name, email: c.email, totalScore: c.totalScore, tenureScore: c.tenureScore });
                              }}
                              disabled={draftingFor === c.id}
                              className="flex items-center gap-1 px-2 py-1 rounded"
                              style={{
                                fontSize: "0.68rem",
                                color: ICC_RED,
                                border: "1px solid rgba(200,16,46,0.3)",
                                background: "rgba(200,16,46,0.08)",
                                cursor: draftingFor === c.id ? "not-allowed" : "pointer",
                                opacity: draftingFor === c.id ? 0.6 : 1,
                              }}
                            >
                              <Star size={10} />
                              {draftingFor === c.id ? "Drafting..." : "Invite"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Process steps */}
          <div className="rounded-lg p-4" style={{ background: "#0A0A0A", border: "1px solid #1E1E1E" }}>
            <p style={{ fontSize: "0.68rem", color: "#3A3A3A", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
              QUARTERLY APEX INVITATION PROCESS
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: "01", title: "Review Rankings", desc: "Atabey members are ranked by Power Score. Members scoring 70+ are auto-highlighted as APEX candidates." },
                { step: "02", title: "Mark Eligible", desc: "Click 'Mark' to confirm a member for APEX invitation. Andrew reviews each candidate personally before inviting." },
                { step: "03", title: "Send Invitations", desc: "Click 'Invite' to draft a personalized APEX lounge invitation. Review and send from Email Hub." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-3">
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", color: ICC_RED, lineHeight: 1, flexShrink: 0 }}>{step}</span>
                  <div>
                    <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#E8E4DC" }}>{title}</p>
                    <p style={{ fontSize: "0.68rem", color: "#6B6560", marginTop: "0.2rem", lineHeight: 1.5 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
