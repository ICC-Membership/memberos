/**
 * Member 360 Profile — ICC Membership OS
 * Full per-member view: tier, status, locker, payment health, power score, win-back score
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  ArrowLeft, User, CreditCard, Key, Trophy, Star,
  Phone, Mail, Calendar, AlertTriangle, CheckCircle,
  TrendingUp, Clock, Search, ExternalLink, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const ICC_RED = "#C8102E";
const GOLD = "#D4AF37";

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
      style={{ background: s.bg, color: s.color, fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase" }}
    >
      {tier}
    </span>
  );
}

function StatusBadge({ status, dunning }: { status: string; dunning?: boolean }) {
  if (dunning) return (
    <span className="px-2 py-0.5 rounded font-bold" style={{ background: "#EAB30822", color: "#EAB308", fontSize: "0.72rem" }}>
      ⚠ DUNNING
    </span>
  );
  const colors: Record<string, { bg: string; text: string }> = {
    Active: { bg: "#22C55E22", text: "#22C55E" },
    Paused: { bg: "#C4A35A22", text: "#C4A35A" },
    Cancelled: { bg: `${ICC_RED}22`, text: ICC_RED },
  };
  const c = colors[status] || colors.Active;
  return (
    <span className="px-2 py-0.5 rounded font-bold" style={{ background: c.bg, color: c.text, fontSize: "0.72rem" }}>
      {status.toUpperCase()}
    </span>
  );
}

function ScoreBar({ score, max = 100, color = ICC_RED }: { score: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.round((score / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: "4px", background: "#1E1E1E" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontSize: "0.72rem", color: "#E8E4DC", fontWeight: 600, minWidth: "28px", textAlign: "right" }}>{score}</span>
    </div>
  );
}

function MemberCard({ member, onClick }: { member: any; onClick: () => void }) {
  const isDunning = member.dunning ?? false;
  const monthlyRate = member.monthlyRate ?? 0;

  return (
    <div
      className="rounded-lg p-3 cursor-pointer transition-all"
      style={{
        background: "#141414",
        border: isDunning ? "1px solid #EAB30844" : "1px solid #1E1E1E",
      }}
      onClick={onClick}
      onMouseEnter={e => (e.currentTarget.style.borderColor = isDunning ? "#EAB308" : "#2A2A2A")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = isDunning ? "#EAB30844" : "#1E1E1E")}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-full font-bold flex-shrink-0"
            style={{
              width: "34px",
              height: "34px",
              background: member.tier === "APEX" ? `${GOLD}22` : member.tier === "Atabey" ? `${ICC_RED}22` : "#1C1C1C",
              color: member.tier === "APEX" ? GOLD : member.tier === "Atabey" ? ICC_RED : "#6B6570",
              fontSize: "0.72rem",
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            {member.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#E8E4DC" }}>{member.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <TierBadge tier={member.tier} />
              <StatusBadge status={member.status} dunning={isDunning} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p style={{ fontSize: "0.85rem", fontFamily: "'Bebas Neue', sans-serif", color: "#E8E4DC" }}>
              ${monthlyRate}/mo
            </p>
            {member.lockerNumber && (
              <p style={{ fontSize: "0.65rem", color: "#6B6560" }}>Locker {member.lockerNumber}</p>
            )}
          </div>
          <ChevronRight size={14} style={{ color: "#3A3A3A" }} />
        </div>
      </div>
    </div>
  );
}

function MemberDetail({ member, onBack }: { member: any; onBack: () => void }) {
  const { data: profile, isLoading } = trpc.member360.get.useQuery(
    { memberId: member.id },
    { enabled: !!member.id }
  );

  const isDunning = member.dunning ?? false;
  const joinDate = member.joinedAt ? new Date(member.joinedAt) : null;
  const renewDate = member.renewalDate ? new Date(member.renewalDate) : null;

  // Calculate months as member
  const monthsAsMember = joinDate
    ? Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0;

  // Estimated LTV
  const ltv = (member.monthlyRate ?? 0) * monthsAsMember;

  // Power score breakdown
  const scores = {
    Visit: member.visitScore ?? 0,
    Spend: member.spendScore ?? 0,
    Referral: member.referralScore ?? 0,
    Tenure: member.tenureScore ?? 0,
    Event: member.eventScore ?? 0,
  };
  const totalScore = member.totalScore ?? 0;

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 transition-colors"
        style={{ color: "#6B6560", fontSize: "0.78rem", background: "none", border: "none", cursor: "pointer" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#E8E4DC")}
        onMouseLeave={e => (e.currentTarget.style.color = "#6B6560")}
      >
        <ArrowLeft size={14} />
        Back to Members
      </button>

      {/* Hero card */}
      <div
        className="rounded-lg p-5"
        style={{
          background: "#141414",
          border: isDunning ? `1px solid #EAB30844` : `1px solid #1E1E1E`,
        }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center rounded-full font-bold flex-shrink-0"
              style={{
                width: "52px",
                height: "52px",
                background: member.tier === "APEX" ? `${GOLD}22` : member.tier === "Atabey" ? `${ICC_RED}22` : "#1C1C1C",
                color: member.tier === "APEX" ? GOLD : member.tier === "Atabey" ? ICC_RED : "#6B6570",
                fontSize: "1.1rem",
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: "0.05em",
                border: `1px solid ${member.tier === "APEX" ? `${GOLD}44` : member.tier === "Atabey" ? `${ICC_RED}44` : "#2A2A2A"}`,
              }}
            >
              {member.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: "#E8E4DC", letterSpacing: "0.05em", lineHeight: 1 }}>
                {member.name}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <TierBadge tier={member.tier} />
                <StatusBadge status={member.status} dunning={isDunning} />
                {member.apexEligible && (
                  <span className="px-2 py-0.5 rounded font-bold" style={{ background: `${GOLD}22`, color: GOLD, fontSize: "0.65rem" }}>
                    ⭐ APEX ELIGIBLE
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p style={{ fontSize: "2rem", fontFamily: "'Bebas Neue', sans-serif", color: "#E8E4DC", lineHeight: 1 }}>
              ${member.monthlyRate ?? 0}
            </p>
            <p style={{ fontSize: "0.68rem", color: "#6B6560" }}>per month</p>
            <p style={{ fontSize: "0.72rem", color: "#3A3A3A", marginTop: "0.25rem" }}>
              Est. LTV: <span style={{ color: "#E8E4DC" }}>${ltv.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4" style={{ borderTop: "1px solid #1E1E1E" }}>
          {member.email && (
            <div className="flex items-center gap-2">
              <Mail size={12} style={{ color: "#3A3A3A", flexShrink: 0 }} />
              <a href={`mailto:${member.email}`} style={{ fontSize: "0.72rem", color: "#6B6560", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#C8102E")}
                onMouseLeave={e => (e.currentTarget.style.color = "#6B6560")}
              >
                {member.email}
              </a>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center gap-2">
              <Phone size={12} style={{ color: "#3A3A3A", flexShrink: 0 }} />
              <a href={`tel:${member.phone}`} style={{ fontSize: "0.72rem", color: "#6B6560", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#E8E4DC")}
                onMouseLeave={e => (e.currentTarget.style.color = "#6B6560")}
              >
                {member.phone}
              </a>
            </div>
          )}
          {joinDate && (
            <div className="flex items-center gap-2">
              <Calendar size={12} style={{ color: "#3A3A3A", flexShrink: 0 }} />
              <span style={{ fontSize: "0.72rem", color: "#6B6560" }}>
                Joined {joinDate.toLocaleDateString()} ({monthsAsMember}mo)
              </span>
            </div>
          )}
          {renewDate && (
            <div className="flex items-center gap-2">
              <Clock size={12} style={{ color: "#3A3A3A", flexShrink: 0 }} />
              <span style={{ fontSize: "0.72rem", color: "#6B6560" }}>
                Renews {renewDate.toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Locker + Payment + Power Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Locker */}
        <div className="rounded-lg p-4" style={{ background: "#141414", border: "1px solid #1E1E1E" }}>
          <div className="flex items-center gap-2 mb-3">
            <Key size={14} style={{ color: "#D4AF37" }} />
            <span style={{ fontSize: "0.72rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>Locker</span>
          </div>
          {member.lockerNumber ? (
            <>
              <p style={{ fontSize: "2rem", fontFamily: "'Bebas Neue', sans-serif", color: GOLD, lineHeight: 1 }}>
                #{member.lockerNumber}
              </p>
              {member.lockerSection && (
                <p style={{ fontSize: "0.72rem", color: "#6B6560", marginTop: "0.25rem" }}>
                  Section {member.lockerSection}
                </p>
              )}
              {profile?.locker?.assignedAt && (
                <p style={{ fontSize: "0.65rem", color: "#3A3A3A", marginTop: "0.25rem" }}>
                  Assigned {new Date(profile.locker.assignedAt).toLocaleDateString()}
                </p>
              )}
            </>
          ) : (
            <p style={{ fontSize: "0.82rem", color: "#3A3A3A" }}>No locker assigned</p>
          )}
        </div>

        {/* Payment Health */}
        <div className="rounded-lg p-4" style={{ background: "#141414", border: isDunning ? "1px solid #EAB30844" : "1px solid #1E1E1E" }}>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={14} style={{ color: isDunning ? "#EAB308" : "#22C55E" }} />
            <span style={{ fontSize: "0.72rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>Payment Health</span>
          </div>
          {isDunning ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} style={{ color: "#EAB308" }} />
                <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#EAB308" }}>PAYMENT FAILED</span>
              </div>
              <p style={{ fontSize: "0.72rem", color: "#6B6560" }}>
                Billing has failed. Recovery email should be sent.
              </p>
              {member.email && (
                <a
                  href={`mailto:${member.email}?subject=Your ICC Membership Payment&body=Hi ${member.name?.split(" ")[0]}, we noticed your recent payment didn't go through...`}
                  style={{ display: "inline-block", marginTop: "0.75rem", fontSize: "0.72rem", color: "#C8102E", textDecoration: "none" }}
                >
                  → Draft recovery email
                </a>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={16} style={{ color: "#22C55E" }} />
                <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#22C55E" }}>CURRENT</span>
              </div>
              <p style={{ fontSize: "0.72rem", color: "#6B6560" }}>
                ${member.monthlyRate ?? 0}/mo · {member.status}
              </p>
            </>
          )}
        </div>

        {/* Power Score */}
        <div className="rounded-lg p-4" style={{ background: "#141414", border: "1px solid #1E1E1E" }}>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={14} style={{ color: GOLD }} />
            <span style={{ fontSize: "0.72rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>Power Score</span>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <p style={{ fontSize: "2rem", fontFamily: "'Bebas Neue', sans-serif", color: "#E8E4DC", lineHeight: 1 }}>
              {totalScore}
            </p>
            <span style={{ fontSize: "0.72rem", color: "#6B6560" }}>/ 100</span>
            {member.apexEligible && (
              <span style={{ fontSize: "0.65rem", color: GOLD, marginLeft: "auto" }}>⭐ APEX Eligible</span>
            )}
          </div>
          <div className="space-y-1.5">
            {Object.entries(scores).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <span style={{ fontSize: "0.65rem", color: "#3A3A3A", width: "50px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{key}</span>
                <ScoreBar score={val as number} max={20} color={key === "Visit" ? "#3B82F6" : key === "Spend" ? "#22C55E" : key === "Referral" ? ICC_RED : key === "Tenure" ? GOLD : "#8B5CF6"} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notes */}
      {member.notes && (
        <div className="rounded-lg p-4" style={{ background: "#141414", border: "1px solid #1E1E1E" }}>
          <div className="flex items-center gap-2 mb-2">
            <Star size={12} style={{ color: "#6B6560" }} />
            <span style={{ fontSize: "0.72rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>Notes</span>
          </div>
          <p style={{ fontSize: "0.82rem", color: "#E8E4DC", lineHeight: 1.6 }}>{member.notes}</p>
        </div>
      )}

      {/* Tour history */}
      {profile?.tours && profile.tours.length > 0 && (
        <div className="rounded-lg p-4" style={{ background: "#141414", border: "1px solid #1E1E1E" }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={12} style={{ color: "#6B6560" }} />
            <span style={{ fontSize: "0.72rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>Tour History</span>
          </div>
          <div className="space-y-2">
            {profile.tours.map((tour: any) => (
              <div key={tour.id} className="flex items-center justify-between" style={{ fontSize: "0.78rem" }}>
                <span style={{ color: "#E8E4DC" }}>
                  Tour by {tour.staffName} on {new Date(tour.tourDate).toLocaleDateString()}
                </span>
                <span style={{ color: tour.converted ? "#22C55E" : "#6B6560" }}>
                  {tour.converted ? "✓ Converted" : "Not converted"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appstle link */}
      {member.externalId && (
        <div className="flex justify-end">
          <a
            href={`https://admin.shopify.com/store/08bcdd/apps/appstle-memberships/dashboards/subscriptions`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5"
            style={{ fontSize: "0.72rem", color: "#C8102E", textDecoration: "none" }}
          >
            <ExternalLink size={11} />
            View in Appstle
          </a>
        </div>
      )}
    </div>
  );
}

export default function Member360() {
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [tierFilter, setTierFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const { data: members = [], isLoading } = trpc.members.list.useQuery();

  const filtered = members.filter((m: any) => {
    const matchSearch = !search || m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === "All" || m.tier === tierFilter;
    const matchStatus = statusFilter === "All" || m.status === statusFilter;
    return matchSearch && matchTier && matchStatus;
  });

  // Sort: dunning first, then by tier (APEX > Atabey > Visionary), then name
  const sorted = [...filtered].sort((a: any, b: any) => {
    if (((a as any).dunning ?? false) !== ((b as any).dunning ?? false)) return ((b as any).dunning ? 1 : 0) - ((a as any).dunning ? 1 : 0);
    const tierOrder: Record<string, number> = { APEX: 0, Atabey: 1, Visionary: 2 };
    const ta = tierOrder[a.tier] ?? 3;
    const tb = tierOrder[b.tier] ?? 3;
    if (ta !== tb) return ta - tb;
    return (a.name ?? "").localeCompare(b.name ?? "");
  });

  if (selectedMember) {
    return (
      <div className="p-6">
        <MemberDetail member={selectedMember} onBack={() => setSelectedMember(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-5" style={{ color: "#E8E4DC" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: "0.05em", color: "#E8E4DC", lineHeight: 1 }}>
          MEMBER 360
        </h1>
        <p style={{ fontSize: "0.78rem", color: "#6B6560", marginTop: "0.25rem" }}>
          Full per-member profile — tier, payment health, power score, locker, notes
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#3A3A3A" }} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="pl-8"
            style={{ background: "#141414", border: "1px solid #2A2A2A", color: "#E8E4DC", fontSize: "0.82rem" }}
          />
        </div>
        <div className="flex gap-2">
          {["All", "APEX", "Atabey", "Visionary"].map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              style={{
                fontSize: "0.68rem",
                padding: "0.3rem 0.75rem",
                borderRadius: "0.25rem",
                border: `1px solid ${tierFilter === t ? "#C8102E" : "#2A2A2A"}`,
                background: tierFilter === t ? "rgba(200,16,46,0.12)" : "transparent",
                color: tierFilter === t ? "#C8102E" : "#6B6560",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {["All", "Active", "Paused", "Cancelled"].map(s => (
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
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p style={{ fontSize: "0.72rem", color: "#3A3A3A" }}>
        {sorted.length} member{sorted.length !== 1 ? "s" : ""} shown
        {sorted.filter((m: any) => m.dunning).length > 0 && (
          <span style={{ color: "#EAB308", marginLeft: "0.5rem" }}>
            · ⚠ {sorted.filter((m: any) => m.dunning).length} with payment issues
          </span>
        )}
      </p>

      {/* Member list */}
      {isLoading ? (
        <div className="text-center py-12" style={{ color: "#6B6560" }}>
          <User size={32} className="mx-auto mb-3 opacity-30" />
          <p>Loading members...</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12" style={{ color: "#6B6560" }}>
          <User size={32} className="mx-auto mb-3 opacity-30" />
          <p>No members found. Sync from Appstle on the Members page.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((member: any) => (
            <MemberCard
              key={member.id}
              member={member}
              onClick={() => setSelectedMember(member)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
