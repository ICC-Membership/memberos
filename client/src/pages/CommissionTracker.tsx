/**
 * Commission Tracker — ICC Membership OS
 * Tracks staff tours, closings, commissions, and quarterly/EOY bonuses
 * Commission structure from ICC Membership Sales Training PPTX
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Trophy, Users, TrendingUp, Plus, Award, Target,
  ChevronDown, ChevronUp, Star, DollarSign, BarChart3, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ─── Commission Structure (from Sales Training PPTX) ─────────────────────────
const COMMISSION_STRUCTURE = [
  {
    tier: "Visionary",
    monthlyRate: 49,
    commission: 20,
    color: "#6B7280",
    description: "$20 per sign-up",
  },
  {
    tier: "Atabey",
    monthlyRate: 125,
    commission: 40,
    color: "#C8102E",
    description: "$40 per sign-up",
  },
  {
    tier: "APEX (No Locker)",
    monthlyRate: 215,
    commission: 75,
    color: "#D4AF37",
    description: "$75 per sign-up",
  },
  {
    tier: "APEX (With Locker)",
    monthlyRate: 260,
    commission: 100,
    color: "#D4AF37",
    description: "$100 per sign-up",
  },
];

const BONUS_STRUCTURE = [
  {
    type: "Quarterly Bonus",
    threshold: 3,
    bonus: 150,
    description: "Close 3+ memberships in a quarter → $150 bonus",
    icon: "🏆",
  },
  {
    type: "Quarterly Elite",
    threshold: 5,
    bonus: 300,
    description: "Close 5+ memberships in a quarter → $300 bonus",
    icon: "⭐",
  },
  {
    type: "EOY Champion",
    threshold: 15,
    bonus: 500,
    description: "Top closer of the year → $500 EOY bonus",
    icon: "🎯",
  },
  {
    type: "Tour Bonus",
    threshold: 10,
    bonus: 50,
    description: "10+ tours in a quarter → $50 tour activity bonus",
    icon: "🚀",
  },
];

const MEDAL_COLORS = ["#D4AF37", "#9CA3AF", "#CD7F32"];
const MEDAL_LABELS = ["1st", "2nd", "3rd"];

function calcCommission(member: any): number {
  // Estimate based on closed count — use avg commission of $55 (weighted avg)
  return (member.closedAllTime ?? 0) * 55;
}

function calcQtrEarnings(member: any): number {
  return (member.closedQtr ?? 0) * 55;
}

function getBonusEarned(closedQtr: number): number {
  if (closedQtr >= 5) return 300;
  if (closedQtr >= 3) return 150;
  return 0;
}

function getRankBadge(rank: number) {
  if (rank === 1) return { label: "🥇 Champion", color: "#D4AF37" };
  if (rank === 2) return { label: "🥈 Runner-Up", color: "#9CA3AF" };
  if (rank === 3) return { label: "🥉 3rd Place", color: "#CD7F32" };
  return null;
}

export default function CommissionTracker() {
  const [showTourForm, setShowTourForm] = useState(false);
  const [showStructure, setShowStructure] = useState(false);
  const [activeTab, setActiveTab] = useState<"leaderboard" | "tours" | "structure">("leaderboard");

  // Tour form state
  const [tourForm, setTourForm] = useState({
    staffId: "",
    staffName: "",
    prospectFirstName: "",
    prospectLastName: "",
    prospectEmail: "",
    prospectPhone: "",
    cameWithGroup: false,
    interestedTier: "" as "" | "Visionary" | "Atabey" | "APEX",
    converted: false,
    notes: "",
  });

  const { data: leaderboard = [], isLoading: loadingLB, refetch: refetchLB } = trpc.staff.getLeaderboard.useQuery();
  const { data: tourLogs = [], isLoading: loadingTours, refetch: refetchTours } = trpc.staff.getTourLogs.useQuery();
  const { data: allStaff = [] } = trpc.staff.list.useQuery();

  const logTourMutation = trpc.staff.logTour.useMutation({
    onSuccess: () => {
      toast.success("Tour logged! Stats updated on leaderboard.");
      setShowTourForm(false);
      setTourForm({
        staffId: "", staffName: "", prospectFirstName: "", prospectLastName: "",
        prospectEmail: "", prospectPhone: "", cameWithGroup: false,
        interestedTier: "", converted: false, notes: "",
      });
      refetchLB();
      refetchTours();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const resetQtrMutation = trpc.staff.resetQuarter.useMutation({
    onSuccess: () => {
      toast.success("Quarter reset! All quarterly stats cleared.");
      refetchLB();
    },
  });

  const handleLogTour = () => {
    if (!tourForm.staffName || !tourForm.prospectFirstName) {
      toast.error("Staff name and prospect first name are required.");
      return;
    }
    const selectedStaff = allStaff.find((s: any) => s.name === tourForm.staffName);
    logTourMutation.mutate({
      staffId: selectedStaff?.id,
      staffName: tourForm.staffName,
      prospectFirstName: tourForm.prospectFirstName,
      prospectLastName: tourForm.prospectLastName || undefined,
      prospectEmail: tourForm.prospectEmail || undefined,
      prospectPhone: tourForm.prospectPhone || undefined,
      cameWithGroup: tourForm.cameWithGroup,
      interestedTier: tourForm.interestedTier || undefined,
      converted: tourForm.converted,
      notes: tourForm.notes || undefined,
    });
  };

  // Stats
  const totalTours = leaderboard.reduce((s: number, m: any) => s + (m.toursGivenAllTime ?? 0), 0);
  const totalClosed = leaderboard.reduce((s: number, m: any) => s + (m.closedAllTime ?? 0), 0);
  const totalQtrClosed = leaderboard.reduce((s: number, m: any) => s + (m.closedQtr ?? 0), 0);
  const conversionRate = totalTours > 0 ? Math.round((totalClosed / totalTours) * 100) : 0;

  return (
    <div className="space-y-6" style={{ color: "#E8E4DC" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: "0.05em", color: "#E8E4DC", lineHeight: 1 }}>
            COMMISSION TRACKER
          </h1>
          <p style={{ fontSize: "0.78rem", color: "#6B6560", marginTop: "0.25rem" }}>
            Staff leaderboard · Tour logs · Quarterly & EOY bonuses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { refetchLB(); refetchTours(); }}
            style={{ borderColor: "#2A2A2A", color: "#6B6560", background: "transparent", fontSize: "0.72rem" }}
          >
            <RefreshCw size={12} className="mr-1.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setShowTourForm(true)}
            style={{ background: "#C8102E", color: "#fff", fontSize: "0.72rem", border: "none" }}
          >
            <Plus size={12} className="mr-1.5" />
            Log Tour
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Tours", value: totalTours, icon: Users, color: "#C8102E" },
          { label: "All-Time Closed", value: totalClosed, icon: Trophy, color: "#D4AF37" },
          { label: "Qtr Closed", value: totalQtrClosed, icon: Target, color: "#22C55E" },
          { label: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp, color: "#3B82F6" },
        ].map(({ label, value, icon: Icon, color }) => (
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

      {/* Tabs */}
      <div className="flex gap-1" style={{ borderBottom: "1px solid #1E1E1E", paddingBottom: "0" }}>
        {(["leaderboard", "tours", "structure"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color: activeTab === tab ? "#C8102E" : "#6B6560",
              borderBottom: activeTab === tab ? "2px solid #C8102E" : "2px solid transparent",
              background: "transparent",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.78rem",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {tab === "leaderboard" ? "🏆 Leaderboard" : tab === "tours" ? "📋 Tour Logs" : "💰 Commission Structure"}
          </button>
        ))}
      </div>

      {/* ── LEADERBOARD TAB ─────────────────────────────────────────────────── */}
      {activeTab === "leaderboard" && (
        <div className="space-y-3">
          {loadingLB ? (
            <div className="text-center py-12" style={{ color: "#6B6560" }}>Loading leaderboard...</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12" style={{ color: "#6B6560" }}>
              <Trophy size={32} className="mx-auto mb-3 opacity-30" />
              <p>No staff data yet. Staff are seeded — check DB connection.</p>
            </div>
          ) : (
            leaderboard.map((member: any, idx: number) => {
              const rank = idx + 1;
              const badge = getRankBadge(rank);
              const qtrEarnings = calcQtrEarnings(member);
              const bonusEarned = getBonusEarned(member.closedQtr ?? 0);
              const tourBonus = (member.toursGivenQtr ?? 0) >= 10 ? 50 : 0;
              const totalQtrComp = qtrEarnings + bonusEarned + tourBonus;
              const convRate = (member.toursGivenAllTime ?? 0) > 0
                ? Math.round(((member.closedAllTime ?? 0) / (member.toursGivenAllTime ?? 1)) * 100)
                : 0;

              return (
                <div
                  key={member.id}
                  className="rounded-lg p-4"
                  style={{
                    background: "#141414",
                    border: rank <= 3 ? `1px solid ${MEDAL_COLORS[rank - 1]}33` : "1px solid #1E1E1E",
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div
                      className="flex items-center justify-center flex-shrink-0 rounded-full font-bold"
                      style={{
                        width: "36px",
                        height: "36px",
                        background: rank <= 3 ? `${MEDAL_COLORS[rank - 1]}22` : "#1C1C1C",
                        color: rank <= 3 ? MEDAL_COLORS[rank - 1] : "#4A4A4A",
                        fontSize: "0.82rem",
                        fontFamily: "'Bebas Neue', sans-serif",
                        letterSpacing: "0.05em",
                        border: rank <= 3 ? `1px solid ${MEDAL_COLORS[rank - 1]}44` : "1px solid #2A2A2A",
                      }}
                    >
                      {rank <= 3 ? MEDAL_LABELS[rank - 1] : rank}
                    </div>

                    {/* Name & referral code */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#E8E4DC" }}>{member.name}</span>
                        {member.referralCode && (
                          <span
                            className="px-1.5 py-0.5 rounded text-xs font-mono"
                            style={{ background: "#1C1C1C", color: "#C8102E", border: "1px solid #2A2A2A", fontSize: "0.65rem" }}
                          >
                            {member.referralCode}
                          </span>
                        )}
                        {badge && (
                          <span style={{ fontSize: "0.7rem", color: badge.color }}>{badge.label}</span>
                        )}
                        {member.bonusEligibleQtr && (
                          <Badge style={{ background: "#22C55E22", color: "#22C55E", border: "1px solid #22C55E44", fontSize: "0.62rem" }}>
                            Bonus Eligible
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span style={{ fontSize: "0.72rem", color: "#6B6560" }}>{member.role || "Staff"}</span>
                        <span style={{ fontSize: "0.72rem", color: "#3A3A3A" }}>·</span>
                        <span style={{ fontSize: "0.72rem", color: "#6B6560" }}>Conv. rate: {convRate}%</span>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="hidden md:grid grid-cols-5 gap-4 text-center">
                      {[
                        { label: "Tours (All)", value: member.toursGivenAllTime ?? 0, color: "#6B6560" },
                        { label: "Tours (Qtr)", value: member.toursGivenQtr ?? 0, color: "#6B6560" },
                        { label: "Closed (All)", value: member.closedAllTime ?? 0, color: "#D4AF37" },
                        { label: "Closed (Qtr)", value: member.closedQtr ?? 0, color: "#22C55E" },
                        { label: "Qtr Comp", value: `$${totalQtrComp}`, color: "#C8102E" },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <p style={{ fontSize: "0.62rem", color: "#3A3A3A", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
                          <p style={{ fontSize: "1.05rem", fontFamily: "'Bebas Neue', sans-serif", color, lineHeight: 1.2 }}>{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Mobile stats */}
                    <div className="md:hidden flex flex-col items-end gap-1">
                      <span style={{ fontSize: "1.1rem", fontFamily: "'Bebas Neue', sans-serif", color: "#D4AF37" }}>
                        {member.closedAllTime ?? 0} closed
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#C8102E" }}>${totalQtrComp} qtr</span>
                    </div>
                  </div>

                  {/* Bonus progress bar */}
                  {(member.closedQtr ?? 0) < 5 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontSize: "0.65rem", color: "#3A3A3A" }}>
                          {(member.closedQtr ?? 0) < 3
                            ? `${3 - (member.closedQtr ?? 0)} more to $150 quarterly bonus`
                            : `${5 - (member.closedQtr ?? 0)} more to $300 quarterly bonus`}
                        </span>
                        <span style={{ fontSize: "0.65rem", color: "#6B6560" }}>
                          {member.closedQtr ?? 0}/{(member.closedQtr ?? 0) < 3 ? 3 : 5}
                        </span>
                      </div>
                      <div className="rounded-full overflow-hidden" style={{ height: "3px", background: "#1E1E1E" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, ((member.closedQtr ?? 0) / ((member.closedQtr ?? 0) < 3 ? 3 : 5)) * 100)}%`,
                            background: bonusEarned > 0 ? "#22C55E" : "#C8102E",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Quarter reset */}
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Reset ALL quarterly stats? This cannot be undone.")) {
                  resetQtrMutation.mutate();
                }
              }}
              style={{ borderColor: "#2A2A2A", color: "#4A4A4A", background: "transparent", fontSize: "0.68rem" }}
            >
              <RefreshCw size={11} className="mr-1.5" />
              Reset Quarter
            </Button>
          </div>
        </div>
      )}

      {/* ── TOUR LOGS TAB ───────────────────────────────────────────────────── */}
      {activeTab === "tours" && (
        <div className="space-y-3">
          {loadingTours ? (
            <div className="text-center py-12" style={{ color: "#6B6560" }}>Loading tour logs...</div>
          ) : tourLogs.length === 0 ? (
            <div className="text-center py-12" style={{ color: "#6B6560" }}>
              <Users size={32} className="mx-auto mb-3 opacity-30" />
              <p>No tour logs yet. Use "Log Tour" to record a prospect visit.</p>
            </div>
          ) : (
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: "1px solid #1E1E1E" }}
            >
              <table className="w-full" style={{ fontSize: "0.78rem" }}>
                <thead>
                  <tr style={{ background: "#0A0A0A", borderBottom: "1px solid #1E1E1E" }}>
                    {["Date", "Staff", "Prospect", "Tier Interest", "Group?", "Converted", "Notes"].map(h => (
                      <th key={h} className="px-3 py-2 text-left" style={{ color: "#3A3A3A", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tourLogs.map((log: any) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid #1A1A1A" }}>
                      <td className="px-3 py-2" style={{ color: "#6B6560" }}>
                        {log.tourDate ? new Date(log.tourDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-3 py-2" style={{ color: "#E8E4DC" }}>{log.staffName}</td>
                      <td className="px-3 py-2" style={{ color: "#E8E4DC" }}>
                        {log.prospectFirstName} {log.prospectLastName || ""}
                        {log.prospectEmail && <div style={{ fontSize: "0.65rem", color: "#6B6560" }}>{log.prospectEmail}</div>}
                      </td>
                      <td className="px-3 py-2">
                        {log.interestedTier ? (
                          <span
                            className="px-1.5 py-0.5 rounded text-xs"
                            style={{
                              background: log.interestedTier === "APEX" ? "#D4AF3722" : log.interestedTier === "Atabey" ? "#C8102E22" : "#6B657022",
                              color: log.interestedTier === "APEX" ? "#D4AF37" : log.interestedTier === "Atabey" ? "#C8102E" : "#6B6570",
                              fontSize: "0.65rem",
                            }}
                          >
                            {log.interestedTier}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-2" style={{ color: "#6B6560" }}>{log.cameWithGroup ? "Yes" : "No"}</td>
                      <td className="px-3 py-2">
                        <span style={{ color: log.converted ? "#22C55E" : "#4A4A4A", fontWeight: log.converted ? 600 : 400 }}>
                          {log.converted ? "✓ Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-3 py-2" style={{ color: "#6B6560", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── COMMISSION STRUCTURE TAB ─────────────────────────────────────────── */}
      {activeTab === "structure" && (
        <div className="space-y-6">
          {/* Per-tier commissions */}
          <div>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", color: "#E8E4DC", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
              PER-SIGN-UP COMMISSIONS
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {COMMISSION_STRUCTURE.map((tier) => (
                <div
                  key={tier.tier}
                  className="rounded-lg p-4"
                  style={{ background: "#141414", border: `1px solid ${tier.color}33` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign size={14} style={{ color: tier.color }} />
                    <span style={{ fontSize: "0.72rem", color: tier.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {tier.tier}
                    </span>
                  </div>
                  <p style={{ fontSize: "2rem", fontFamily: "'Bebas Neue', sans-serif", color: "#E8E4DC", lineHeight: 1 }}>
                    ${tier.commission}
                  </p>
                  <p style={{ fontSize: "0.68rem", color: "#6B6560", marginTop: "0.25rem" }}>{tier.description}</p>
                  <p style={{ fontSize: "0.65rem", color: "#3A3A3A", marginTop: "0.5rem" }}>Member pays ${tier.monthlyRate}/mo</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bonus structure */}
          <div>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", color: "#E8E4DC", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
              BONUS STRUCTURE
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BONUS_STRUCTURE.map((bonus) => (
                <div
                  key={bonus.type}
                  className="rounded-lg p-4 flex items-start gap-4"
                  style={{ background: "#141414", border: "1px solid #1E1E1E" }}
                >
                  <span style={{ fontSize: "1.8rem", lineHeight: 1 }}>{bonus.icon}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#E8E4DC" }}>{bonus.type}</span>
                      <span
                        className="px-2 py-0.5 rounded"
                        style={{ background: "#C8102E22", color: "#C8102E", fontSize: "0.72rem", fontWeight: 700 }}
                      >
                        +${bonus.bonus}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "#6B6560" }}>{bonus.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Referral code system */}
          <div>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", color: "#E8E4DC", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
              REFERRAL CODES
            </h3>
            <div
              className="rounded-lg p-4"
              style={{ background: "#141414", border: "1px solid #1E1E1E" }}
            >
              <p style={{ fontSize: "0.75rem", color: "#6B6560", marginBottom: "0.75rem" }}>
                Each staff member has a unique referral code. When a prospect signs up using their code via the Shopify link, the sale is attributed to that staff member.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {allStaff.filter((s: any) => s.referralCode).map((s: any) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-3 py-2 rounded"
                    style={{ background: "#0A0A0A", border: "1px solid #1E1E1E" }}
                  >
                    <span style={{ fontSize: "0.75rem", color: "#E8E4DC" }}>{s.name.split(" ")[0]}</span>
                    <span
                      className="font-mono"
                      style={{ fontSize: "0.65rem", color: "#C8102E", background: "#1C1C1C", padding: "0.15rem 0.4rem", borderRadius: "0.2rem" }}
                    >
                      {s.referralCode}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LOG TOUR DIALOG ──────────────────────────────────────────────────── */}
      <Dialog open={showTourForm} onOpenChange={setShowTourForm}>
        <DialogContent style={{ background: "#141414", border: "1px solid #2A2A2A", color: "#E8E4DC", maxWidth: "520px" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.3rem", letterSpacing: "0.05em", color: "#E8E4DC" }}>
              LOG TOUR
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label style={{ fontSize: "0.72rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>Staff Member *</Label>
                <Select value={tourForm.staffName} onValueChange={(v) => setTourForm(f => ({ ...f, staffName: v }))}>
                  <SelectTrigger style={{ background: "#0A0A0A", border: "1px solid #2A2A2A", color: "#E8E4DC", marginTop: "0.35rem", fontSize: "0.82rem" }}>
                    <SelectValue placeholder="Select staff..." />
                  </SelectTrigger>
                  <SelectContent style={{ background: "#141414", border: "1px solid #2A2A2A" }}>
                    {allStaff.map((s: any) => (
                      <SelectItem key={s.id} value={s.name} style={{ color: "#E8E4DC", fontSize: "0.82rem" }}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label style={{ fontSize: "0.72rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>Tier Interest</Label>
                <Select value={tourForm.interestedTier} onValueChange={(v) => setTourForm(f => ({ ...f, interestedTier: v as any }))}>
                  <SelectTrigger style={{ background: "#0A0A0A", border: "1px solid #2A2A2A", color: "#E8E4DC", marginTop: "0.35rem", fontSize: "0.82rem" }}>
                    <SelectValue placeholder="Select tier..." />
                  </SelectTrigger>
                  <SelectContent style={{ background: "#141414", border: "1px solid #2A2A2A" }}>
                    {["Visionary", "Atabey", "APEX"].map(t => (
                      <SelectItem key={t} value={t} style={{ color: "#E8E4DC", fontSize: "0.82rem" }}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label style={{ fontSize: "0.72rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>Prospect First Name *</Label>
                <Input
                  value={tourForm.prospectFirstName}
                  onChange={(e) => setTourForm(f => ({ ...f, prospectFirstName: e.target.value }))}
                  placeholder="First name"
                  style={{ background: "#0A0A0A", border: "1px solid #2A2A2A", color: "#E8E4DC", marginTop: "0.35rem", fontSize: "0.82rem" }}
                />
              </div>
              <div>
                <Label style={{ fontSize: "0.72rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>Last Name</Label>
                <Input
                  value={tourForm.prospectLastName}
                  onChange={(e) => setTourForm(f => ({ ...f, prospectLastName: e.target.value }))}
                  placeholder="Last name"
                  style={{ background: "#0A0A0A", border: "1px solid #2A2A2A", color: "#E8E4DC", marginTop: "0.35rem", fontSize: "0.82rem" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label style={{ fontSize: "0.72rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>Email</Label>
                <Input
                  value={tourForm.prospectEmail}
                  onChange={(e) => setTourForm(f => ({ ...f, prospectEmail: e.target.value }))}
                  placeholder="prospect@email.com"
                  type="email"
                  style={{ background: "#0A0A0A", border: "1px solid #2A2A2A", color: "#E8E4DC", marginTop: "0.35rem", fontSize: "0.82rem" }}
                />
              </div>
              <div>
                <Label style={{ fontSize: "0.72rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>Phone</Label>
                <Input
                  value={tourForm.prospectPhone}
                  onChange={(e) => setTourForm(f => ({ ...f, prospectPhone: e.target.value }))}
                  placeholder="(555) 555-5555"
                  style={{ background: "#0A0A0A", border: "1px solid #2A2A2A", color: "#E8E4DC", marginTop: "0.35rem", fontSize: "0.82rem" }}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tourForm.cameWithGroup}
                  onChange={(e) => setTourForm(f => ({ ...f, cameWithGroup: e.target.checked }))}
                  style={{ accentColor: "#C8102E" }}
                />
                <span style={{ fontSize: "0.78rem", color: "#E8E4DC" }}>Came with group</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tourForm.converted}
                  onChange={(e) => setTourForm(f => ({ ...f, converted: e.target.checked }))}
                  style={{ accentColor: "#22C55E" }}
                />
                <span style={{ fontSize: "0.78rem", color: "#E8E4DC" }}>Converted (signed up)</span>
              </label>
            </div>

            <div>
              <Label style={{ fontSize: "0.72rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>Notes</Label>
              <Textarea
                value={tourForm.notes}
                onChange={(e) => setTourForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any notes about this prospect..."
                rows={2}
                style={{ background: "#0A0A0A", border: "1px solid #2A2A2A", color: "#E8E4DC", marginTop: "0.35rem", fontSize: "0.82rem", resize: "none" }}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleLogTour}
                disabled={logTourMutation.isPending}
                style={{ background: "#C8102E", color: "#fff", flex: 1, fontSize: "0.82rem" }}
              >
                {logTourMutation.isPending ? "Logging..." : "Log Tour"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowTourForm(false)}
                style={{ borderColor: "#2A2A2A", color: "#6B6560", background: "transparent", fontSize: "0.82rem" }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
