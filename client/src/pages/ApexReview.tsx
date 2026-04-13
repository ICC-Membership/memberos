/**
 * APEX Quarterly Review — ICC Membership OS
 * Atabey members ranked by Power Score for APEX lounge invitation
 */
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Trophy, Star, TrendingUp, RefreshCw, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const ICC_RED = "#C8102E";
const GOLD = "#D4AF37";

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: "3px", background: "#1E1E1E" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
      </div>
      <span style={{ fontSize: "0.68rem", color: "#E8E4DC", fontWeight: 600, minWidth: "22px", textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default function ApexReview() {
  const { data, isLoading, refetch } = trpc.apexReview.candidates.useQuery();
  const setEligible = trpc.apexReview.setApexEligible.useMutation({
    onSuccess: () => {
      toast.success("APEX eligibility updated");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const candidates = data?.candidates ?? [];
  const topCandidates = data?.topCandidates ?? [];
  const quarterLabel = data?.quarterLabel ?? "Q2 2026";
  const reviewDue = data?.reviewDue ? new Date(data.reviewDue).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "June 15, 2026";

  const eligibleCount = candidates.filter((c: any) => c.apexEligible).length;

  return (
    <div className="p-6 space-y-6" style={{ color: "#E8E4DC" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: "0.05em", color: "#E8E4DC", lineHeight: 1 }}>
            APEX QUARTERLY REVIEW
          </h1>
          <p style={{ fontSize: "0.78rem", color: "#6B6560", marginTop: "0.25rem" }}>
            {quarterLabel} · Review due {reviewDue} · Atabey members ranked by Power Score
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

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Atabey Members", value: candidates.length, color: ICC_RED, icon: Star },
          { label: "APEX Eligible", value: eligibleCount, color: GOLD, icon: Trophy },
          { label: "Top Score", value: candidates[0]?.totalScore ?? 0, color: "#22C55E", icon: TrendingUp },
          { label: "Review Due", value: reviewDue.split(",")[0], color: "#6B6570", icon: Clock },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-lg p-4" style={{ background: "#141414", border: "1px solid #1E1E1E" }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: "0.68rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
              <Icon size={14} style={{ color }} />
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
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", letterSpacing: "0.08em", color: "#E8E4DC" }}>
              TOP 5 APEX CANDIDATES — {quarterLabel}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
                  style={{
                    width: "36px",
                    height: "36px",
                    background: i === 0 ? `${GOLD}22` : "#1C1C1C",
                    color: i === 0 ? GOLD : "#6B6570",
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "0.88rem",
                  }}
                >
                  #{i + 1}
                </div>
                <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#E8E4DC" }}>{c.name}</p>
                <p style={{ fontSize: "1.2rem", fontFamily: "'Bebas Neue', sans-serif", color: i === 0 ? GOLD : "#E8E4DC", marginTop: "0.25rem" }}>
                  {c.totalScore}
                </p>
                <p style={{ fontSize: "0.62rem", color: "#3A3A3A" }}>pts</p>
                {c.apexEligible && (
                  <div className="mt-1.5">
                    <span style={{ fontSize: "0.62rem", color: GOLD }}>⭐ Eligible</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full rankings table */}
      {isLoading ? (
        <div className="text-center py-12" style={{ color: "#6B6560" }}>
          <RefreshCw size={24} className="mx-auto mb-3 opacity-30 animate-spin" />
          <p>Loading APEX candidates...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-12" style={{ color: "#6B6560" }}>
          <Trophy size={32} className="mx-auto mb-3 opacity-30" />
          <p>No Atabey members found. Sync from Appstle first.</p>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #2A2A2A" }}>
          <table className="w-full" style={{ fontSize: "0.78rem" }}>
            <thead>
              <tr style={{ background: "#141414", borderBottom: "1px solid #2A2A2A" }}>
                {["#", "Member", "Visits", "Spend", "Referrals", "Tenure", "Events", "Total", "APEX"].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-medium uppercase"
                    style={{ color: "#6B6560", fontSize: "0.65rem", letterSpacing: "0.1em" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidates.map((c: any, i: number) => (
                <tr
                  key={c.id}
                  style={{
                    background: c.apexEligible ? `${GOLD}08` : i % 2 === 0 ? "#1C1C1C" : "#161616",
                    borderBottom: "1px solid #1E1E1E",
                  }}
                >
                  <td className="px-4 py-3" style={{ color: "#3A3A3A", fontFamily: "'Bebas Neue', sans-serif" }}>{i + 1}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p style={{ fontWeight: 600, color: "#E8E4DC" }}>{c.name}</p>
                      {c.joinedAt && (
                        <p style={{ fontSize: "0.65rem", color: "#3A3A3A" }}>
                          Since {new Date(c.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: "#8899CC" }}>{c.visitScore}</td>
                  <td className="px-4 py-3" style={{ color: "#22C55E" }}>{c.spendScore}</td>
                  <td className="px-4 py-3" style={{ color: "#C4A35A" }}>{c.referralScore}</td>
                  <td className="px-4 py-3" style={{ color: "#9B7FC7" }}>{c.tenureScore}</td>
                  <td className="px-4 py-3" style={{ color: "#EAB308" }}>{c.eventScore}</td>
                  <td className="px-4 py-3">
                    <span
                      style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: "1rem",
                        color: c.totalScore >= 70 ? GOLD : "#E8E4DC",
                        fontWeight: 700,
                      }}
                    >
                      {c.totalScore}
                    </span>
                  </td>
                  <td className="px-4 py-3">
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
                      {c.apexEligible ? (
                        <>
                          <CheckCircle size={10} />
                          Eligible
                        </>
                      ) : (
                        "Mark"
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Instructions */}
      <div className="rounded-lg p-4" style={{ background: "#0A0A0A", border: "1px solid #1E1E1E" }}>
        <p style={{ fontSize: "0.72rem", color: "#3A3A3A", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
          APEX Review Process
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { step: "01", title: "Review Rankings", desc: "Atabey members are ranked by Power Score. Top scorers are APEX candidates." },
            { step: "02", title: "Mark Eligible", desc: "Click 'Mark' to flag members for APEX invitation. Scores ≥70 are auto-highlighted." },
            { step: "03", title: "Send Invitations", desc: "Use the Email Hub to send personalized APEX lounge invitations to marked members." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3">
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: ICC_RED, lineHeight: 1, flexShrink: 0 }}>{step}</span>
              <div>
                <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#E8E4DC" }}>{title}</p>
                <p style={{ fontSize: "0.68rem", color: "#6B6560", marginTop: "0.2rem" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
