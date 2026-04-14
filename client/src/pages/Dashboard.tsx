/*
 * Dashboard — ICC Membership OS Command Center
 * All KPIs pulled live from Appstle via tRPC — no hardcoded numbers
 */
import { useState } from "react";
import { Users, AlertCircle, DollarSign, PauseCircle, AlertTriangle, RefreshCw, Star, FileDown, Target } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function TierBadge({ tier }: { tier: string }) {
  if (tier === "APEX") return <span className="tier-badge-apex">{tier}</span>;
  if (tier === "Atabey") return <span className="tier-badge-atabey">{tier}</span>;
  return <span className="tier-badge-visionary">{tier}</span>;
}

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663388846002/JxsvGXqZ8SL52kxCjJkGqG/icc-hero-bg-JrkCAL8Bfb4U4fT7zNxwBL.webp";
const Q1_TARGET = 172;
const AUGUST_TARGET = 200;

export default function Dashboard() {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const [exporting, setExporting] = useState(false);

  const { data: appstleStats, isLoading: statsLoading } = trpc.shopify.liveStats.useQuery(
    undefined,
    { refetchInterval: 5 * 60 * 1000 }
  );
  const { data: dashData, isLoading: dashLoading } = trpc.dashboard.summary.useQuery();
  const { data: members = [] } = trpc.members.list.useQuery();

  const isLoading = statsLoading || dashLoading;

  const activeCount = appstleStats?.active ?? dashData?.memberStats?.active ?? 0;
  const pausedCount = appstleStats?.paused ?? 0;
  const dunningCount = appstleStats?.dunning ?? 0;
  const mrr = appstleStats?.mrr ?? 0;
  const apexCount = appstleStats?.apex ?? dashData?.memberStats?.apex ?? 0;
  const atabeyCount = appstleStats?.atabey ?? dashData?.memberStats?.atabey ?? 0;
  const visionaryCount = appstleStats?.visionary ?? dashData?.memberStats?.visionary ?? 0;
  const q1Pct = Math.round((activeCount / Q1_TARGET) * 100);
  const augustPct = Math.round((activeCount / AUGUST_TARGET) * 100);

  // Projected date to reach 200 members based on current growth rate
  // Assume ~5 net new members/month (conservative)
  const NET_MONTHLY_ADDS = 5;
  const membersNeeded = AUGUST_TARGET - activeCount;
  const monthsNeeded = membersNeeded > 0 ? Math.ceil(membersNeeded / NET_MONTHLY_ADDS) : 0;
  const projectedDate = new Date();
  projectedDate.setMonth(projectedDate.getMonth() + monthsNeeded);
  const projectedDateStr = projectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const upcomingRenewals = (members as any[])
    .filter(m => m.renewalDate && new Date(m.renewalDate) >= now && new Date(m.renewalDate) <= in14Days && m.status === "Active")
    .sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime())
    .slice(0, 5);

  const dunningMembers = (members as any[]).filter(m => m.notes?.includes("dunning")).slice(0, 5);

  const tierData = [
    { tier: "APEX", count: apexCount, color: "#C8102E" },
    { tier: "Atabey", count: atabeyCount, color: "#C4A35A" },
    { tier: "Visionary", count: visionaryCount, color: "#8899CC" },
  ];

  const rocks = dashData?.rocks ?? [];

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      let y = 15;

      // Header
      doc.setFillColor(10, 8, 6);
      doc.rect(0, 0, pageW, 40, "F");
      doc.setTextColor(200, 16, 46);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("ICC MEMBERSHIP OS", 15, 18);
      doc.setTextColor(196, 163, 90);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("MORNING BRIEFING", 15, 26);
      doc.setTextColor(160, 152, 144);
      doc.text(today, 15, 33);
      y = 50;

      // KPI Section
      doc.setTextColor(200, 16, 46);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("KEY METRICS", 15, y);
      y += 6;
      doc.setDrawColor(200, 16, 46);
      doc.setLineWidth(0.5);
      doc.line(15, y, pageW - 15, y);
      y += 8;

      const kpis = [
        ["Active Members", String(activeCount), `${q1Pct}% of Q1 target (${Q1_TARGET})`],
        ["Monthly MRR", `$${mrr.toLocaleString()}`, `~$${Math.round(mrr * 12 / 1000)}k ARR`],
        ["Paused", String(pausedCount), "Subscriptions on hold"],
        ["Dunning", String(dunningCount), "Failed payments — action required"],
      ];
      kpis.forEach(([label, value, sub]) => {
        doc.setTextColor(107, 101, 96);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(label.toUpperCase(), 15, y);
        doc.setTextColor(232, 228, 220);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(value, 15, y + 6);
        doc.setTextColor(107, 101, 96);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(sub, 15, y + 12);
        y += 20;
      });

      // 200-Member Countdown
      y += 4;
      doc.setTextColor(200, 16, 46);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("200-MEMBER COUNTDOWN", 15, y);
      y += 6;
      doc.line(15, y, pageW - 15, y);
      y += 8;
      doc.setTextColor(232, 228, 220);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Progress: ${activeCount} / ${AUGUST_TARGET} members (${augustPct}%)`, 15, y);
      y += 7;
      doc.text(`Members needed: ${Math.max(0, AUGUST_TARGET - activeCount)}`, 15, y);
      y += 7;
      doc.setTextColor(196, 163, 90);
      doc.text(`Projected at current pace: ${projectedDateStr}`, 15, y);
      y += 14;

      // Tier Breakdown
      doc.setTextColor(200, 16, 46);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("TIER BREAKDOWN", 15, y);
      y += 6;
      doc.line(15, y, pageW - 15, y);
      y += 8;
      tierData.forEach(({ tier, count }) => {
        doc.setTextColor(232, 228, 220);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`${tier}: ${count} members`, 15, y);
        y += 7;
      });
      y += 7;

      // Upcoming Renewals
      if (upcomingRenewals.length > 0) {
        doc.setTextColor(200, 16, 46);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("RENEWALS — NEXT 14 DAYS", 15, y);
        y += 6;
        doc.line(15, y, pageW - 15, y);
        y += 8;
        upcomingRenewals.forEach((r: any) => {
          const daysLeft = Math.ceil((new Date(r.renewalDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          doc.setTextColor(232, 228, 220);
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.text(`${r.name} (${r.tier}) — ${new Date(r.renewalDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${daysLeft}d left`, 15, y);
          y += 7;
        });
        y += 7;
      }

      // Dunning Members
      if (dunningMembers.length > 0) {
        doc.setTextColor(234, 179, 8);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("PAYMENT ISSUES — ACTION REQUIRED", 15, y);
        y += 6;
        doc.setDrawColor(234, 179, 8);
        doc.line(15, y, pageW - 15, y);
        doc.setDrawColor(200, 16, 46);
        y += 8;
        dunningMembers.forEach((m: any) => {
          doc.setTextColor(232, 228, 220);
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.text(`${m.name} (${m.tier}) — $${m.monthlyRate?.toFixed(0) ?? "—"}/mo — ${m.email ?? ""}`, 15, y);
          y += 7;
        });
        y += 7;
      }

      // Footer
      doc.setFillColor(10, 8, 6);
      const pageH = doc.internal.pageSize.getHeight();
      doc.rect(0, pageH - 15, pageW, 15, "F");
      doc.setTextColor(107, 101, 96);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("Industrial Cigar Company — Private Membership OS — Confidential", 15, pageH - 5);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - 15, pageH - 5, { align: "right" });

      doc.save(`ICC-Morning-Briefing-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Morning report exported!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative rounded-lg overflow-hidden" style={{ minHeight: "150px", background: `url(${HERO_BG}) center/cover no-repeat` }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(10,8,6,0.92) 0%, rgba(10,8,6,0.60) 60%, transparent 100%)" }} />
        <div className="relative p-6 flex items-end justify-between" style={{ minHeight: "150px" }}>
          <div>
            <p style={{ fontSize: "0.7rem", letterSpacing: "0.18em", color: "#C4A35A", textTransform: "uppercase", marginBottom: "0.25rem" }}>{today}</p>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.2rem", letterSpacing: "0.06em", color: "#E8E4DC", lineHeight: 1 }}>COMMAND CENTER</h1>
            <p style={{ fontSize: "0.78rem", color: "rgba(232,228,220,0.55)", marginTop: "0.25rem" }}>Industrial Cigar Company — Private Membership</p>
            <div className="flex gap-3 mt-3">
              <a href="/email" style={{ fontSize: "0.72rem", padding: "0.4rem 1rem", borderRadius: "0.25rem", background: "#C8102E", color: "white", fontWeight: 600 }}>Email Hub</a>
              <a href="/members" style={{ fontSize: "0.72rem", padding: "0.4rem 1rem", borderRadius: "0.25rem", background: "transparent", color: "#E8E4DC", border: "1px solid rgba(232,228,220,0.35)", fontWeight: 600 }}>Members</a>
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", padding: "0.4rem 1rem", borderRadius: "0.25rem", background: "transparent", color: "#C4A35A", border: "1px solid rgba(196,163,90,0.35)", cursor: exporting ? "not-allowed" : "pointer", fontWeight: 600 }}
              >
                <FileDown size={12} />
                {exporting ? "Exporting..." : "Morning Report"}
              </button>
            </div>
          </div>
          <div className="text-right">
            {isLoading ? (
              <div className="flex items-center gap-2" style={{ color: "rgba(232,228,220,0.4)" }}>
                <RefreshCw size={12} className="animate-spin" />
                <span style={{ fontSize: "0.7rem" }}>Loading...</span>
              </div>
            ) : (
              <div>
                <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "3rem", color: "#C8102E", lineHeight: 1 }}>{activeCount}</p>
                <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", color: "rgba(232,228,220,0.45)", textTransform: "uppercase" }}>Active Members</p>
                <p style={{ fontSize: "0.65rem", color: "#C4A35A", marginTop: "0.2rem" }}>{Q1_TARGET - activeCount} to Q1 target</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dunning alert */}
      {dunningCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)" }}>
          <AlertTriangle size={14} style={{ color: "#EAB308", flexShrink: 0 }} />
          <span style={{ fontSize: "0.78rem", color: "#EAB308" }}>
            <strong>{dunningCount} member{dunningCount > 1 ? "s" : ""}</strong> in dunning — payment failed, Appstle is retrying. Go to Members to take action.
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active Members", value: isLoading ? "—" : String(activeCount), sub: `${q1Pct}% of Q1 target (${Q1_TARGET})`, icon: Users, color: "#C8102E" },
          { label: "Monthly MRR", value: isLoading ? "—" : `$${mrr.toLocaleString()}`, sub: `~$${Math.round(mrr * 12 / 1000)}k ARR`, icon: DollarSign, color: "#C4A35A" },
          { label: "Paused", value: isLoading ? "—" : String(pausedCount), sub: "Subscriptions on hold", icon: PauseCircle, color: "#8899CC" },
          { label: "Dunning", value: isLoading ? "—" : String(dunningCount), sub: "Failed payments", icon: AlertCircle, color: dunningCount > 0 ? "#EAB308" : "#3A3A3A" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="icc-card" style={{ padding: "1rem 1.25rem" }}>
            <div className="flex items-start justify-between">
              <div>
                <p style={{ fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#3A3A3A", marginBottom: "0.4rem" }}>{label}</p>
                <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", color, lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: "0.65rem", color: "#6B6560", marginTop: "0.25rem" }}>{sub}</p>
              </div>
              <Icon size={16} style={{ color, opacity: 0.6, flexShrink: 0 }} />
            </div>
          </div>
        ))}
      </div>

      {/* 200-Member Countdown */}
      <div className="icc-card" style={{ padding: "1.25rem", border: "1px solid rgba(200,16,46,0.20)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target size={14} style={{ color: "#C8102E" }} />
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem", letterSpacing: "0.08em", color: "#E8E4DC" }}>200-MEMBER COUNTDOWN</h3>
          </div>
          <div className="text-right">
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", color: "#C8102E", lineHeight: 1 }}>{activeCount}</span>
            <span style={{ fontSize: "0.75rem", color: "#6B6560" }}> / {AUGUST_TARGET}</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full rounded-full overflow-hidden mb-3" style={{ height: "10px", background: "#1E1E1E" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(augustPct, 100)}%`,
              background: "linear-gradient(90deg, #C8102E 0%, #C4A35A 100%)",
              transition: "width 0.7s ease"
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-6">
            <div>
              <p style={{ fontSize: "0.65rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>Remaining</p>
              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.2rem", color: "#C4A35A", lineHeight: 1 }}>{Math.max(0, AUGUST_TARGET - activeCount)}</p>
            </div>
            <div>
              <p style={{ fontSize: "0.65rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>Q1 Target</p>
              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.2rem", color: "#8899CC", lineHeight: 1 }}>{Q1_TARGET}</p>
            </div>
            <div>
              <p style={{ fontSize: "0.65rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>August Goal</p>
              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.2rem", color: "#22C55E", lineHeight: 1 }}>{AUGUST_TARGET}</p>
            </div>
          </div>
          <div className="text-right">
            <p style={{ fontSize: "0.65rem", color: "#6B6560" }}>At current pace (~{NET_MONTHLY_ADDS}/mo)</p>
            <p style={{ fontSize: "0.78rem", color: "#C4A35A", fontWeight: 600 }}>Projected: {projectedDateStr}</p>
          </div>
        </div>
      </div>

      {/* Q1 Rocks */}
      {rocks.length > 0 && (
        <div className="icc-card" style={{ padding: "1.25rem" }}>
          <div className="flex items-center gap-2 mb-4">
            <Star size={14} style={{ color: "#C8102E" }} />
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem", letterSpacing: "0.08em", color: "#E8E4DC" }}>Q1 ROCKS</h3>
            <span style={{ fontSize: "0.68rem", color: "#3A3A3A", marginLeft: "auto" }}>Due April 1, 2026</span>
          </div>
          <div className="space-y-4">
            {rocks.map((rock: any) => {
              const isGrowthRock = rock.title?.toLowerCase().includes("150") || rock.title?.toLowerCase().includes("member");
              const current = isGrowthRock ? activeCount : (rock.progressPct ?? 0);
              const target = isGrowthRock ? Q1_TARGET : 100;
              const pct = isGrowthRock ? q1Pct : (rock.progressPct ?? 0);
              return (
                <div key={rock.id}>
                  <div className="flex justify-between items-center mb-1.5">
                    <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#E8E4DC" }}>{rock.title}</p>
                    <span style={{ fontSize: "0.7rem", color: "#C4A35A", fontWeight: 700 }}>{isGrowthRock ? `${current}/${target}` : `${pct}%`}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#1E1E1E" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 80 ? "#22C55E" : pct >= 50 ? "#C4A35A" : "#C8102E", transition: "width 0.7s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tier breakdown + Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="icc-card" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem", letterSpacing: "0.08em", color: "#E8E4DC", marginBottom: "1rem" }}>BY TIER</h3>
          <div className="space-y-3">
            {tierData.map(({ tier, count, color }) => (
              <div key={tier}>
                <div className="flex justify-between items-center mb-1">
                  <TierBadge tier={tier} />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#E8E4DC" }}>{isLoading ? "—" : count}</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#1E1E1E" }}>
                  <div className="h-full rounded-full" style={{ width: activeCount > 0 ? `${(count / activeCount) * 100}%` : "0%", background: color, transition: "width 0.5s ease" }} />
                </div>
              </div>
            ))}
          </div>
          <div className="red-rule mt-4 pt-4">
            <p style={{ fontSize: "0.72rem", color: "#3A3A3A" }}>Annual target: <span style={{ color: "#C8102E", fontWeight: 700 }}>200 members</span>{appstleStats ? <span style={{ color: "#22C55E" }}> · Live from Appstle</span> : null}</p>
          </div>
        </div>

        <div className="icc-card" style={{ padding: "1.25rem" }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={14} style={{ color: "#C8102E" }} />
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem", letterSpacing: "0.08em", color: "#E8E4DC" }}>RENEWALS — NEXT 14 DAYS</h3>
          </div>
          {upcomingRenewals.length === 0 ? (
            <p style={{ fontSize: "0.78rem", color: "#3A3A3A", textAlign: "center", padding: "2rem 0" }}>
              {(members as any[]).length === 0 ? "Sync members to see renewals" : "No renewals in the next 14 days"}
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingRenewals.map((r: any) => {
                const daysLeft = Math.ceil((new Date(r.renewalDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "#1E1E1E" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "#1E1E1E", color: "#C8102E" }}>
                        {(r.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#E8E4DC" }}>{r.name}</p>
                        <TierBadge tier={r.tier} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p style={{ fontSize: "0.78rem", fontWeight: 700, color: daysLeft <= 5 ? "#C8102E" : "#C4A35A" }}>
                        {new Date(r.renewalDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                      <p style={{ fontSize: "0.65rem", color: "#3A3A3A" }}>{daysLeft}d left</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dunning members */}
      {dunningMembers.length > 0 && (
        <div className="icc-card" style={{ padding: "1.25rem", border: "1px solid rgba(234,179,8,0.20)" }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} style={{ color: "#EAB308" }} />
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem", letterSpacing: "0.08em", color: "#EAB308" }}>PAYMENT ISSUES — ACTION REQUIRED</h3>
          </div>
          <div className="space-y-2">
            {dunningMembers.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "#1E1E1E" }}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(234,179,8,0.1)", color: "#EAB308" }}>
                    {(m.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#E8E4DC" }}>{m.name}</p>
                    <p style={{ fontSize: "0.65rem", color: "#6B6560" }}>{m.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TierBadge tier={m.tier} />
                  <span style={{ fontSize: "0.72rem", color: "#EAB308", fontWeight: 600 }}>${m.monthlyRate?.toFixed(0) ?? "—"}/mo</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
