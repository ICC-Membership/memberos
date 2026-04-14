/**
 * GrowthEngine — ICC Membership OS Wave 2
 * Brain Trust Growth Engineering output:
 * - 3 growth loops with tracking
 * - Staff Commission Leaderboard
 * - At-Risk Member Alerts (30-day no-visit)
 * - Event Attendee Tracker
 * - Prospect Outreach Generator (AI)
 */
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Zap,
  Users,
  Trophy,
  AlertTriangle,
  Calendar,
  TrendingUp,
  ChevronRight,
  Copy,
  Star,
  Clock,
  Target,
} from "lucide-react";

const ICC_RED = "#C8102E";
const SURFACE = "#1C1C1C";
const BORDER = "#2A2A2A";
const MUTED = "#3A3A3A";
const TEXT = "#E8E4DC";
const TEXT_DIM = "#6B6560";

const eventAttendees = [
  { name: "Tyler W.", event: "Whiskey & Cigars Night", date: "Mar 14", isMember: false, followedUp: false },
  { name: "Robert H.", event: "Whiskey & Cigars Night", date: "Mar 14", isMember: false, followedUp: true },
  { name: "Sarah L.", event: "Whiskey & Cigars Night", date: "Mar 14", isMember: true, followedUp: false },
  { name: "Kevin P.", event: "Pairing Masterclass", date: "Mar 8", isMember: false, followedUp: false },
  { name: "Michelle D.", event: "Pairing Masterclass", date: "Mar 8", isMember: false, followedUp: false },
];

const growthLoops = [
  {
    id: 1,
    title: "APEX Aspiration Loop",
    icon: Star,
    color: ICC_RED,
    mechanism: "Members see their Power Score in real time → aspiration to earn APEX → APEX recognition drives referrals",
    status: "Active",
    impact: "+15–20% visit frequency",
    actions: ["Add member-facing Power Score QR link", "Build APEX recognition wall"],
    progress: 60,
  },
  {
    id: 2,
    title: "Referral Commission Loop",
    icon: Trophy,
    color: "#C4A35A",
    mechanism: "Staff earn commissions → leaderboard visibility → competition → more referrals → more members",
    status: "Active",
    impact: "+3–5 members/month",
    actions: ["Staff leaderboard live below", "Track attribution in Appstle"],
    progress: 75,
  },
  {
    id: 3,
    title: "Event-to-Member Loop",
    icon: Calendar,
    color: "#8899CC",
    mechanism: "Every event is a prospect activation → track non-member attendees → follow up within 48hrs → convert at 20–30%",
    status: "Needs action",
    impact: "+2–4 members/event",
    actions: ["Event attendee tracker live below", "48-hr follow-up rule"],
    progress: 30,
  },
];

// Prospect outreach AI generator
const outreachTemplates: Record<string, string> = {
  "New Inquiry": `Hi [Name],

Thanks for reaching out about ICC membership — we'd love to welcome you into the family.

I'm Andrew, Head of Membership. ICC isn't just a cigar lounge — it's a community. We have three membership tiers designed around how you want to experience the lounge, and I'd love to walk you through what fits you best.

Would you be available for a quick call this week, or would you prefer to stop by for a tour? I'll make sure you get the full experience.

Looking forward to connecting.

— Andrew Frakes
Head of Membership, Industrial Cigar Co.`,
  "Prospect Follow-Up": `Hi [Name],

I wanted to follow up on your interest in ICC membership. We're at 135 members and growing fast — a few of our tiers have limited locker availability.

If you've had a chance to think it over, I'd love to answer any questions and get you set up. The process takes about 10 minutes and you'd have access immediately.

Let me know what works for you.

— Andrew`,
  "Event Invite": `Hi [Name],

It was great seeing you at [Event Name] — hope you enjoyed the evening.

I wanted to personally reach out because I think you'd be a great fit for ICC membership. As a member, you'd have access to our private lounges, your own locker, and events like this one as a priority guest.

I'd love to have a quick conversation about what tier makes sense for you. Are you free for a call this week?

— Andrew Frakes
Head of Membership, Industrial Cigar Co.`,
  "Renewal Reminder": `Hi [Name],

Your ICC membership is coming up for renewal on [Date]. I wanted to reach out personally to make sure everything has been great for you this year.

If there's anything we can do better, I'd love to hear it. And if you've been thinking about upgrading your tier, now is a great time to talk about it.

Looking forward to another year with you in the family.

— Andrew`,
};

export default function GrowthEngine() {
  const [selectedTemplate, setSelectedTemplate] = useState("New Inquiry");
  const [prospectName, setProspectName] = useState("");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [followedUp, setFollowedUp] = useState<Record<number, boolean>>({});

  // Live data
  const { data: liveStats } = trpc.shopify.liveStats.useQuery();
  const { data: staffLeaderboardData } = trpc.staff.getLeaderboard.useQuery();
  const { data: winbackCandidates } = trpc.winback.candidates.useQuery();

  const activeCount = liveStats?.active ?? 0;

  // Build staff leaderboard from live DB data
  const staffLeaderboard = useMemo(() => {
    if (!staffLeaderboardData || staffLeaderboardData.length === 0) return [];
    return staffLeaderboardData.slice(0, 6).map((s: any, i: number) => ({
      rank: i + 1,
      name: s.name,
      referrals: s.closedQtr ?? 0,
      target: 10,
      payout: s.closedQtr && s.closedQtr >= 10
        ? '$1,000'
        : s.closedQtr && s.closedQtr >= 5
        ? `$${(s.closedQtr ?? 0) * 75}`
        : `$${(s.closedQtr ?? 0) * 50}`,
      trend: s.toursGivenQtr ? `${s.toursGivenQtr} tours this qtr` : 'No tours yet',
    }));
  }, [staffLeaderboardData]);

  // At-risk members from win-back candidates (paused only, sorted by score)
  const atRiskMembers = useMemo(() => {
    if (!winbackCandidates) return [];
    return winbackCandidates
      .filter((c: any) => c.status === 'Paused')
      .slice(0, 5)
      .map((c: any) => ({
        name: c.name,
        tier: c.tier ?? 'Visionary',
        lastVisit: c.daysSince ? `${c.daysSince} days ago` : 'Unknown',
        spend: c.monthlyRate ? `$${(c.monthlyRate * 12).toLocaleString()}/yr` : '—',
        action: c.tier === 'APEX' ? 'Call' : c.tier === 'Atabey' ? 'Email' : 'Text',
      }));
  }, [winbackCandidates]);

  const generateOutreach = () => {
    const template = outreachTemplates[selectedTemplate] || "";
    const personalized = template.replace("[Name]", prospectName || "[Name]");
    setGeneratedMessage(personalized);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage);
    toast.success("Copied to clipboard — paste into Gmail");
  };

  const markFollowedUp = (idx: number) => {
    setFollowedUp(prev => ({ ...prev, [idx]: true }));
    toast.success("Marked as followed up");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.75rem", letterSpacing: "0.04em", color: TEXT, lineHeight: 1 }}>
            GROWTH ENGINE
          </h1>
          <p style={{ fontSize: "0.8rem", color: TEXT_DIM, marginTop: "0.25rem" }}>
            Brain Trust–engineered growth loops to reach 200 members
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded"
          style={{ background: "rgba(200,16,46,0.10)", border: "1px solid rgba(200,16,46,0.25)" }}
        >
          <Target size={14} style={{ color: ICC_RED }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: ICC_RED }}>{activeCount || '—'} → 200 Members</span>
        </div>
      </div>

      {/* Growth Loops */}
      <div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", letterSpacing: "0.08em", color: MUTED, marginBottom: "0.75rem" }}>
          THE 3 GROWTH LOOPS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {growthLoops.map(loop => {
            const Icon = loop.icon;
            return (
              <div
                key={loop.id}
                className="p-4 rounded"
                style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderTop: `3px solid ${loop.color}` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={16} style={{ color: loop.color }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "0.8rem", color: TEXT }}>
                    {loop.title}
                  </span>
                  <span
                    className="ml-auto text-xs px-2 py-0.5 rounded"
                    style={{
                      background: loop.status === "Active" ? "rgba(34,197,94,0.12)" : "rgba(200,16,46,0.12)",
                      color: loop.status === "Active" ? "#22C55E" : ICC_RED,
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                    }}
                  >
                    {loop.status.toUpperCase()}
                  </span>
                </div>
                <p style={{ fontSize: "0.72rem", color: TEXT_DIM, lineHeight: 1.5, marginBottom: "0.75rem" }}>
                  {loop.mechanism}
                </p>
                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: "0.65rem", color: MUTED }}>Loop activation</span>
                    <span style={{ fontSize: "0.65rem", color: loop.color, fontWeight: 700 }}>{loop.progress}%</span>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ height: "3px", background: "#2A2A2A" }}>
                    <div className="h-full rounded-full" style={{ width: `${loop.progress}%`, background: loop.color }} />
                  </div>
                </div>
                <div style={{ fontSize: "0.68rem", color: "#C4A35A", fontWeight: 600 }}>
                  Expected: {loop.impact}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-column: Staff Leaderboard + At-Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Staff Commission Leaderboard */}
        <div className="rounded" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2">
              <Trophy size={14} style={{ color: "#C4A35A" }} />
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem", letterSpacing: "0.06em", color: TEXT }}>
                STAFF COMMISSION LEADERBOARD
              </span>
            </div>
            <span style={{ fontSize: "0.65rem", color: MUTED }}>Q1 2026 · 20-member target</span>
          </div>
          <div className="p-4 space-y-3">
            {staffLeaderboard.map(staff => (
              <div key={staff.rank} className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: staff.rank === 1 ? "rgba(196,163,90,0.20)" : "#1E1E1E",
                    color: staff.rank === 1 ? "#C4A35A" : MUTED,
                    border: staff.rank === 1 ? "1px solid rgba(196,163,90,0.40)" : `1px solid ${BORDER}`,
                    fontSize: "0.65rem",
                  }}
                >
                  {staff.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: TEXT }}>{staff.name}</span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: staff.rank === 1 ? "#C4A35A" : TEXT_DIM }}>
                      {staff.payout}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-full overflow-hidden" style={{ height: "3px", background: "#2A2A2A" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(staff.referrals / staff.target) * 100}%`,
                          background: staff.rank === 1 ? "#C4A35A" : ICC_RED,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "0.62rem", color: MUTED, whiteSpace: "nowrap" }}>
                      {staff.referrals}/{staff.target}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.62rem", color: "#22C55E", marginTop: "2px", display: "block" }}>
                    {staff.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* At-Risk Members */}
        <div className="rounded" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} style={{ color: ICC_RED }} />
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem", letterSpacing: "0.06em", color: TEXT }}>
                AT-RISK MEMBERS
              </span>
            </div>
            <span style={{ fontSize: "0.65rem", color: ICC_RED }}>30+ days no visit</span>
          </div>
          <div className="p-4 space-y-3">
            {atRiskMembers.map((member, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded"
                style={{ background: "#161616", border: `1px solid ${BORDER}` }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: TEXT }}>{member.name}</span>
                    <span
                      className={`tier-badge-${member.tier.toLowerCase()}`}
                    >
                      {member.tier}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1" style={{ fontSize: "0.68rem", color: ICC_RED }}>
                      <Clock size={10} />
                      {member.lastVisit}
                    </span>
                    <span style={{ fontSize: "0.68rem", color: MUTED }}>{member.spend}</span>
                  </div>
                </div>
                <button
                  className="btn-icc"
                  style={{ padding: "0.3rem 0.75rem", fontSize: "0.68rem" }}
                  onClick={() => toast.success(`Opening ${member.action} for ${member.name}`)}
                >
                  {member.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Attendee Tracker */}
      <div className="rounded" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2">
            <Calendar size={14} style={{ color: "#8899CC" }} />
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem", letterSpacing: "0.06em", color: TEXT }}>
              EVENT ATTENDEE TRACKER
            </span>
          </div>
          <span style={{ fontSize: "0.65rem", color: MUTED }}>Follow up within 48 hrs</span>
        </div>
        <div className="overflow-x-auto">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["Name", "Event", "Date", "Member?", "Followed Up", "Action"].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: "0.6rem 1rem",
                      textAlign: "left",
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      letterSpacing: "0.10em",
                      color: MUTED,
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {eventAttendees.map((attendee, idx) => (
                <tr
                  key={idx}
                  style={{ borderBottom: `1px solid #1E1E1E` }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#161616")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "0.65rem 1rem", fontSize: "0.78rem", fontWeight: 600, color: TEXT }}>{attendee.name}</td>
                  <td style={{ padding: "0.65rem 1rem", fontSize: "0.75rem", color: TEXT_DIM }}>{attendee.event}</td>
                  <td style={{ padding: "0.65rem 1rem", fontSize: "0.75rem", color: TEXT_DIM }}>{attendee.date}</td>
                  <td style={{ padding: "0.65rem 1rem" }}>
                    <span style={{
                      fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "0.2rem",
                      background: attendee.isMember ? "rgba(34,197,94,0.12)" : "rgba(200,16,46,0.10)",
                      color: attendee.isMember ? "#22C55E" : ICC_RED,
                    }}>
                      {attendee.isMember ? "Member" : "Prospect"}
                    </span>
                  </td>
                  <td style={{ padding: "0.65rem 1rem" }}>
                    <span style={{
                      fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "0.2rem",
                      background: (followedUp[idx] || attendee.followedUp) ? "rgba(34,197,94,0.12)" : "rgba(196,163,90,0.12)",
                      color: (followedUp[idx] || attendee.followedUp) ? "#22C55E" : "#C4A35A",
                    }}>
                      {(followedUp[idx] || attendee.followedUp) ? "Done" : "Pending"}
                    </span>
                  </td>
                  <td style={{ padding: "0.65rem 1rem" }}>
                    {!attendee.isMember && !(followedUp[idx] || attendee.followedUp) && (
                      <button
                        className="flex items-center gap-1"
                        style={{ fontSize: "0.7rem", color: ICC_RED, fontWeight: 600 }}
                        onClick={() => markFollowedUp(idx)}
                      >
                        Follow Up <ChevronRight size={11} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Prospect Outreach Generator */}
      <div className="rounded" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <Zap size={14} style={{ color: ICC_RED }} />
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem", letterSpacing: "0.06em", color: TEXT }}>
            AI PROSPECT OUTREACH GENERATOR
          </span>
          <span
            className="ml-2 px-2 py-0.5 rounded text-xs"
            style={{ background: "rgba(200,16,46,0.12)", color: ICC_RED, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em" }}
          >
            ICC VOICE
          </span>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 600, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>
                Message Type
              </label>
              <select
                value={selectedTemplate}
                onChange={e => setSelectedTemplate(e.target.value)}
                style={{
                  width: "100%",
                  background: "#161616",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "0.25rem",
                  color: TEXT,
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.8rem",
                }}
              >
                {Object.keys(outreachTemplates).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 600, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>
                Prospect Name
              </label>
              <input
                type="text"
                value={prospectName}
                onChange={e => setProspectName(e.target.value)}
                placeholder="e.g. Tyler"
                style={{
                  width: "100%",
                  background: "#161616",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "0.25rem",
                  color: TEXT,
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.8rem",
                }}
              />
            </div>
            <button
              className="btn-icc w-full flex items-center justify-center gap-2"
              style={{ padding: "0.6rem 1rem" }}
              onClick={generateOutreach}
            >
              <TrendingUp size={14} />
              Generate Message
            </button>
          </div>
          <div className="relative">
            <textarea
              value={generatedMessage}
              onChange={e => setGeneratedMessage(e.target.value)}
              placeholder="Your personalized outreach message will appear here..."
              rows={8}
              style={{
                width: "100%",
                background: "#161616",
                border: `1px solid ${BORDER}`,
                borderRadius: "0.25rem",
                color: TEXT,
                padding: "0.75rem",
                fontSize: "0.75rem",
                lineHeight: 1.6,
                resize: "none",
                fontFamily: "'Inter', sans-serif",
              }}
            />
            {generatedMessage && (
              <button
                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded"
                style={{ background: ICC_RED, color: "white", fontSize: "0.7rem", fontWeight: 600 }}
                onClick={copyToClipboard}
              >
                <Copy size={11} />
                Copy to Gmail
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
