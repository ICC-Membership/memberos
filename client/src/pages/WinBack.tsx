/**
 * Win-Back Queue — ICC Membership OS
 * Prioritized list of cancelled/paused members for re-engagement
 * Scoring: recency (0-40) + tier value (0-30) + tenure (0-30)
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  TrendingUp, AlertTriangle, Mail, Phone, RefreshCw,
  Clock, Star, DollarSign, Filter, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ICC_RED = "#C8102E";
const GOLD = "#D4AF37";

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    HIGH: { bg: "#C8102E22", color: "#C8102E", label: "🔴 HIGH" },
    MEDIUM: { bg: "#EAB30822", color: "#EAB308", label: "🟡 MEDIUM" },
    LOW: { bg: "#6B657022", color: "#6B6570", label: "⚪ LOW" },
  };
  const s = styles[priority] || styles.LOW;
  return (
    <span
      className="px-2 py-0.5 rounded font-bold"
      style={{ background: s.bg, color: s.color, fontSize: "0.68rem", letterSpacing: "0.06em" }}
    >
      {s.label}
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    APEX: { bg: `${GOLD}22`, color: GOLD },
    Atabey: { bg: `${ICC_RED}22`, color: ICC_RED },
    Visionary: { bg: "#6B657022", color: "#6B6570" },
  };
  const s = styles[tier] || styles.Visionary;
  return (
    <span
      className="px-2 py-0.5 rounded font-bold"
      style={{ background: s.bg, color: s.color, fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase" }}
    >
      {tier}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, score);
  const color = score >= 60 ? ICC_RED : score >= 40 ? "#EAB308" : "#6B6570";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: "3px", background: "#1E1E1E" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontSize: "0.72rem", color, fontWeight: 700, minWidth: "24px", textAlign: "right" }}>{score}</span>
    </div>
  );
}

// Pre-built win-back email templates
function getEmailTemplate(candidate: any): string {
  const firstName = candidate.name?.split(" ")[0] || "there";
  if (candidate.tier === "APEX") {
    return `Hi ${firstName},

We wanted to personally reach out — your presence at Industrial Cigar Company was always valued, and we miss having you as part of our APEX community.

A lot has changed since you left, and we'd love to catch you up over a smoke. We're holding a private APEX member event next month and wanted to extend you a personal invitation.

If you're open to it, I'd love to have a quick conversation about what brought you in originally and what might bring you back.

Warm regards,
Andrew Frakes
Head of Membership — Industrial Cigar Company`;
  }
  if (candidate.tier === "Atabey") {
    return `Hi ${firstName},

It's been a while since we've seen you at ICC, and we wanted to reach out personally.

We've made some exciting additions to the lounge and our Atabey membership tier — including new events, expanded locker availability, and an upgraded member experience.

If you've been thinking about coming back, now is a great time. I'd love to reconnect and hear what would make ICC the right fit for you again.

Best,
Andrew Frakes
Head of Membership — Industrial Cigar Company`;
  }
  return `Hi ${firstName},

We noticed it's been a while since you were last with us at Industrial Cigar Company, and we wanted to reach out.

We have some exciting things happening at the lounge and would love to have you back. Our Visionary membership is a great way to stay connected to the ICC community without a big commitment.

If you're interested in reconnecting, I'd love to chat.

Best,
Andrew Frakes
Head of Membership — Industrial Cigar Company`;
}

export default function WinBack() {
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | "HIGH" | "MEDIUM">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Cancelled" | "Paused">("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftingFor, setDraftingFor] = useState<string | null>(null);

  const { data: candidates = [], isLoading, refetch } = trpc.winback.candidates.useQuery();
  const draftEmail = trpc.winback.draftReengagement.useMutation({
    onSuccess: () => {
      setDraftingFor(null);
      toast.success('Re-engagement draft queued — check Email Hub');
    },
    onError: () => {
      setDraftingFor(null);
      toast.error('Failed to queue draft');
    },
  });

  const filtered = (candidates as any[]).filter(c => {
    const matchPriority = priorityFilter === "ALL" || c.priority === priorityFilter;
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchPriority && matchStatus;
  });

  const highCount = (candidates as any[]).filter(c => c.priority === "HIGH").length;
  const mediumCount = (candidates as any[]).filter(c => c.priority === "MEDIUM").length;
  const cancelledCount = (candidates as any[]).filter(c => c.status === "Cancelled").length;
  const pausedCount = (candidates as any[]).filter(c => c.status === "Paused").length;

  // Estimated MRR recovery if all HIGH priority win back
  const highMrrRecovery = (candidates as any[])
    .filter(c => c.priority === "HIGH")
    .reduce((sum: number, c: any) => sum + (c.monthlyRate ?? 0), 0);

  return (
    <div className="space-y-6" style={{ color: "#E8E4DC" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: "0.05em", color: "#E8E4DC", lineHeight: 1 }}>
            WIN-BACK QUEUE
          </h1>
          <p style={{ fontSize: "0.78rem", color: "#6B6560", marginTop: "0.25rem" }}>
            Cancelled & paused members ranked by re-engagement potential
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          style={{ borderColor: "#2A2A2A", color: "#6B6560", background: "transparent", fontSize: "0.72rem" }}
        >
          <RefreshCw size={12} className="mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "HIGH Priority", value: highCount, color: ICC_RED, icon: AlertTriangle },
          { label: "MEDIUM Priority", value: mediumCount, color: "#EAB308", icon: Star },
          { label: "Cancelled", value: cancelledCount, color: "#6B6570", icon: Clock },
          { label: "MRR Recovery (HIGH)", value: `$${Math.round(highMrrRecovery)}/mo`, color: "#22C55E", icon: DollarSign },
        ].map(({ label, value, color, icon: Icon }) => (
          <div
            key={label}
            className="rounded-lg p-4"
            style={{ background: "#141414", border: "1px solid #1E1E1E" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: "0.68rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
              <Icon size={14} style={{ color }} />
            </div>
            <p style={{ fontSize: "1.6rem", fontFamily: "'Bebas Neue', sans-serif", color: "#E8E4DC", lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {(["ALL", "HIGH", "MEDIUM"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              style={{
                fontSize: "0.68rem",
                padding: "0.3rem 0.75rem",
                borderRadius: "0.25rem",
                border: `1px solid ${priorityFilter === p ? ICC_RED : "#2A2A2A"}`,
                background: priorityFilter === p ? "rgba(200,16,46,0.12)" : "transparent",
                color: priorityFilter === p ? ICC_RED : "#6B6560",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {p === "ALL" ? "All Priority" : p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(["ALL", "Cancelled", "Paused"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                fontSize: "0.68rem",
                padding: "0.3rem 0.75rem",
                borderRadius: "0.25rem",
                border: `1px solid ${statusFilter === s ? "#6B6560" : "#2A2A2A"}`,
                background: statusFilter === s ? "#1C1C1C" : "transparent",
                color: statusFilter === s ? "#E8E4DC" : "#6B6560",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {s === "ALL" ? "All Status" : s}
            </button>
          ))}
        </div>
        <span style={{ fontSize: "0.68rem", color: "#3A3A3A", marginLeft: "auto" }}>
          {filtered.length} candidates shown
        </span>
      </div>

      {/* Candidate list */}
      {isLoading ? (
        <div className="text-center py-12" style={{ color: "#6B6560" }}>
          <RefreshCw size={24} className="mx-auto mb-3 opacity-30 animate-spin" />
          <p>Loading win-back candidates from Appstle...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12" style={{ color: "#6B6560" }}>
          <TrendingUp size={32} className="mx-auto mb-3 opacity-30" />
          <p>No win-back candidates found with current filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((candidate: any, idx: number) => {
            const key = `${candidate.name}-${idx}`;
            const isExpanded = expandedId === key;
            const emailTemplate = getEmailTemplate(candidate);

            return (
              <div
                key={key}
                className="rounded-lg overflow-hidden"
                style={{
                  background: "#141414",
                  border: candidate.priority === "HIGH" ? `1px solid ${ICC_RED}33` : "1px solid #1E1E1E",
                }}
              >
                {/* Main row */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : key)}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div
                      className="flex items-center justify-center flex-shrink-0 rounded-full font-bold"
                      style={{
                        width: "32px",
                        height: "32px",
                        background: "#1C1C1C",
                        color: "#3A3A3A",
                        fontSize: "0.75rem",
                        fontFamily: "'Bebas Neue', sans-serif",
                        border: "1px solid #2A2A2A",
                      }}
                    >
                      {idx + 1}
                    </div>

                    {/* Name & badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#E8E4DC" }}>{candidate.name}</span>
                        <TierBadge tier={candidate.tier} />
                        <PriorityBadge priority={candidate.priority} />
                        <span
                          className="px-2 py-0.5 rounded"
                          style={{
                            background: candidate.status === "Cancelled" ? "#C8102E22" : "#C4A35A22",
                            color: candidate.status === "Cancelled" ? "#C8102E" : "#C4A35A",
                            fontSize: "0.65rem",
                            fontWeight: 600,
                          }}
                        >
                          {candidate.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span style={{ fontSize: "0.72rem", color: "#6B6560" }}>
                          {candidate.daysSince < 999 ? `${candidate.daysSince}d since ${candidate.status.toLowerCase()}` : "Date unknown"}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "#3A3A3A" }}>·</span>
                        <span style={{ fontSize: "0.72rem", color: "#6B6560" }}>${candidate.monthlyRate ?? 0}/mo</span>
                        {candidate.cancellationFeedback && (
                          <>
                            <span style={{ fontSize: "0.72rem", color: "#3A3A3A" }}>·</span>
                            <span style={{ fontSize: "0.72rem", color: "#6B6560", fontStyle: "italic" }}>
                              "{candidate.cancellationFeedback}"
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="hidden md:block w-32">
                      <p style={{ fontSize: "0.62rem", color: "#3A3A3A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>Win-Back Score</p>
                      <ScoreBar score={candidate.totalScore} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* AI Draft button */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setDraftingFor(key);
                          draftEmail.mutate({
                            name: candidate.name,
                            email: candidate.email,
                            tier: candidate.tier,
                            daysSince: candidate.daysSince,
                            monthlyRate: candidate.monthlyRate,
                          });
                        }}
                        disabled={draftingFor === key}
                        className="flex items-center gap-1 px-2 py-1.5 rounded"
                        style={{
                          fontSize: "0.68rem",
                          color: "#C4A35A",
                          border: "1px solid rgba(196,163,90,0.3)",
                          background: "rgba(196,163,90,0.08)",
                          cursor: draftingFor === key ? 'not-allowed' : 'pointer',
                          opacity: draftingFor === key ? 0.6 : 1,
                        }}
                      >
                        <Star size={11} />
                        <span>{draftingFor === key ? 'Drafting...' : 'AI Draft'}</span>
                      </button>
                      {candidate.email && (
                        <a
                          href={`mailto:${candidate.email}?subject=We miss you at ICC&body=${encodeURIComponent(emailTemplate)}`}
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 px-2 py-1.5 rounded"
                          style={{
                            fontSize: "0.68rem",
                            color: ICC_RED,
                            border: `1px solid ${ICC_RED}44`,
                            background: `${ICC_RED}11`,
                            textDecoration: "none",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = `${ICC_RED}22`)}
                          onMouseLeave={e => (e.currentTarget.style.background = `${ICC_RED}11`)}
                        >
                          <Mail size={11} />
                          <span>Email</span>
                        </a>
                      )}
                      {candidate.phone && (
                        <a
                          href={`tel:${candidate.phone}`}
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 px-2 py-1.5 rounded"
                          style={{
                            fontSize: "0.68rem",
                            color: "#6B6560",
                            border: "1px solid #2A2A2A",
                            background: "transparent",
                            textDecoration: "none",
                          }}
                        >
                          <Phone size={11} />
                          <span>Call</span>
                        </a>
                      )}
                      <ChevronDown
                        size={14}
                        style={{
                          color: "#3A3A3A",
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded: email template */}
                {isExpanded && (
                  <div
                    className="px-4 pb-4"
                    style={{ borderTop: "1px solid #1E1E1E" }}
                  >
                    <div className="pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <p style={{ fontSize: "0.72rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                          Pre-built Win-Back Email
                        </p>
                        {candidate.email && (
                          <a
                            href={`mailto:${candidate.email}?subject=We miss you at ICC&body=${encodeURIComponent(emailTemplate)}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded"
                            style={{
                              fontSize: "0.72rem",
                              color: "#fff",
                              background: ICC_RED,
                              textDecoration: "none",
                            }}
                          >
                            <Mail size={11} />
                            Open in Email Client
                          </a>
                        )}
                      </div>
                      <div
                        className="rounded p-3"
                        style={{ background: "#0A0A0A", border: "1px solid #1E1E1E" }}
                      >
                        <p style={{ fontSize: "0.75rem", color: "#E8E4DC", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                          {emailTemplate}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Scoring explanation */}
      <div
        className="rounded-lg p-4"
        style={{ background: "#0A0A0A", border: "1px solid #1E1E1E" }}
      >
        <p style={{ fontSize: "0.72rem", color: "#3A3A3A", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
          Scoring Methodology
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "Recency (0-40)", desc: "≤30d = 40pts, ≤60d = 30pts, ≤90d = 20pts, ≤180d = 10pts" },
            { label: "Tier Value (0-30)", desc: "APEX = 30pts, Atabey = 20pts, Visionary = 10pts" },
            { label: "Tenure (0-30)", desc: "3pts per month as member, max 30pts (10 months)" },
          ].map(({ label, desc }) => (
            <div key={label}>
              <p style={{ fontSize: "0.72rem", color: "#6B6560", fontWeight: 600 }}>{label}</p>
              <p style={{ fontSize: "0.68rem", color: "#3A3A3A", marginTop: "0.2rem" }}>{desc}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "0.68rem", color: "#3A3A3A", marginTop: "0.75rem" }}>
          <span style={{ color: ICC_RED }}>HIGH</span> = 60+ pts · <span style={{ color: "#EAB308" }}>MEDIUM</span> = 40-59 pts · Only HIGH and MEDIUM shown
        </p>
      </div>
    </div>
  );
}
