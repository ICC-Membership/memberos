/*
 * Strategy — ICC Membership OS
 * 200-member growth plan, quarterly milestones, acquisition channels, tactics
 */
import { Target, TrendingUp, Users, Zap, ExternalLink } from "lucide-react";

const MILESTONES = [
  { quarter: "Q1 2026", target: 150, current: 135, deadline: "April 1", status: "in-progress" },
  { quarter: "Q2 2026", target: 165, current: null, deadline: "July 1", status: "upcoming" },
  { quarter: "Q3 2026", target: 180, current: null, deadline: "October 1", status: "upcoming" },
  { quarter: "Q4 2026", target: 200, current: null, deadline: "Dec 31", status: "upcoming" },
];

const ACQUISITION_CHANNELS = [
  { channel: "Member Referrals", target: 25, notes: "Commission plan active — $750-$1,000 per quarter for top referrer", priority: "high" },
  { channel: "Events & Activations", target: 20, notes: "Each event should convert 3-5 guests to members. Invite non-member guests.", priority: "high" },
  { channel: "Instagram / Social", target: 15, notes: "Showcase lounge experience, APEX events, humidor. DM follow-up within 24h.", priority: "medium" },
  { channel: "Typeform Inquiries", target: 15, notes: "Current average: 8-10 inquiries/month. Close rate target: 60%.", priority: "high" },
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

const ROCKS = [
  {
    id: 1,
    title: "Grow to 150 Members",
    current: 135,
    target: 150,
    pct: Math.round((135 / 150) * 100),
    tactics: [
      "Activate commission plan — brief all staff this week",
      "Follow up with all open Typeform inquiries (est. 12 open)",
      "Host 1 invite-only prospect event before April 1",
      "Personal outreach to top 5 lapsed prospects",
    ],
  },
  {
    id: 2,
    title: "Define Membership Program + Visuals + Training",
    current: 40,
    target: 100,
    pct: 40,
    tactics: [
      "Finalize tier benefits chart (Visionary / Atabey / APEX)",
      "Create visual one-pager for each tier",
      "Build staff training guide from Sales Training doc",
      "Record a 5-minute orientation video for new members",
    ],
  },
  {
    id: 3,
    title: "Ecosystem Training + Commission Plan Rollout",
    current: 25,
    target: 100,
    pct: 25,
    tactics: [
      "Schedule all-staff training session (2 hours)",
      "Distribute commission plan one-pager to all staff",
      "Set up commission tracking in Google Sheets",
      "First commission payout at end of Q1",
    ],
  },
];

export default function Strategy() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.92 0.012 75)" }}>
            Strategy
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "oklch(0.55 0.008 65)" }}>
            Path to 200 members by December 31, 2026
          </p>
        </div>
        <a
          href="https://app.ninety.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs px-4 py-2 rounded-md border transition-all duration-180"
          style={{ color: "oklch(0.72 0.12 75)", borderColor: "oklch(0.72 0.12 75 / 0.3)", background: "oklch(0.72 0.12 75 / 0.05)" }}
        >
          <ExternalLink size={12} />
          Ninety.io
        </a>
      </div>

      {/* Annual milestone timeline */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-5">
          <Target size={13} style={{ color: "oklch(0.72 0.12 75)" }} />
          <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: "oklch(0.72 0.12 75)" }}>
            2026 Membership Milestones
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MILESTONES.map((m) => {
            const pct = m.current ? Math.round((m.current / m.target) * 100) : 0;
            return (
              <div
                key={m.quarter}
                className="p-4 rounded-lg border"
                style={{
                  background: m.status === "in-progress" ? "oklch(0.72 0.12 75 / 0.06)" : "oklch(0.14 0.008 55)",
                  borderColor: m.status === "in-progress" ? "oklch(0.72 0.12 75 / 0.30)" : "oklch(0.20 0.008 55)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color: m.status === "in-progress" ? "oklch(0.80 0.14 78)" : "oklch(0.55 0.008 65)" }}>
                    {m.quarter}
                  </span>
                  {m.status === "in-progress" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "oklch(0.72 0.12 75 / 0.20)", color: "oklch(0.80 0.14 78)" }}>
                      Active
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.92 0.012 75)" }}>
                  {m.target}
                </p>
                <p className="text-xs mb-3" style={{ color: "oklch(0.50 0.008 65)" }}>members by {m.deadline}</p>
                {m.current && (
                  <>
                    <div className="w-full h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "oklch(0.22 0.008 55)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, oklch(0.72 0.12 75), oklch(0.80 0.14 78))" }} />
                    </div>
                    <p className="text-[10px]" style={{ color: "oklch(0.55 0.008 65)" }}>{m.current} / {m.target} ({pct}%)</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Q1 Rocks with tactics */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide uppercase flex items-center gap-2" style={{ color: "oklch(0.72 0.12 75)" }}>
          <Zap size={13} />
          Q1 2026 Rocks + Execution Tactics
        </h2>
        {ROCKS.map((rock) => (
          <div key={rock.id} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs mr-2" style={{ color: "oklch(0.50 0.008 65)" }}>Rock {rock.id}</span>
                <span className="text-sm font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.85 0.010 75)" }}>
                  {rock.title}
                </span>
              </div>
              <span className="text-sm font-bold" style={{ color: rock.pct >= 80 ? "oklch(0.80 0.14 78)" : "oklch(0.65 0.010 70)" }}>
                {rock.pct}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden mb-4" style={{ background: "oklch(0.22 0.008 55)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${rock.pct}%`,
                  background: rock.pct >= 80
                    ? "linear-gradient(90deg, oklch(0.72 0.12 75), oklch(0.80 0.14 78))"
                    : "linear-gradient(90deg, oklch(0.55 0.08 35), oklch(0.65 0.10 45))",
                }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {rock.tactics.map((tactic, i) => (
                <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "oklch(0.70 0.010 72)" }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: "oklch(0.72 0.12 75 / 0.60)" }} />
                  {tactic}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Acquisition channels */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={13} style={{ color: "oklch(0.72 0.12 75)" }} />
          <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: "oklch(0.72 0.12 75)" }}>
            Acquisition Channels — 65 Members Needed
          </h2>
        </div>
        <div className="space-y-3">
          {ACQUISITION_CHANNELS.map((ch) => (
            <div key={ch.channel} className="flex items-start gap-4 p-3 rounded-lg" style={{ background: "oklch(0.14 0.008 55)" }}>
              <div className="text-center flex-shrink-0 w-12">
                <p className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.80 0.14 78)" }}>+{ch.target}</p>
                <p className="text-[9px] uppercase tracking-wide" style={{ color: "oklch(0.45 0.006 60)" }}>target</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: "oklch(0.85 0.010 75)" }}>{ch.channel}</span>
                  {ch.priority === "high" && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "oklch(0.72 0.12 75 / 0.15)", color: "oklch(0.80 0.14 78)" }}>Priority</span>
                  )}
                </div>
                <p className="text-xs" style={{ color: "oklch(0.55 0.008 65)" }}>{ch.notes}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly rhythm */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-4">
          <Users size={13} style={{ color: "oklch(0.72 0.12 75)" }} />
          <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: "oklch(0.72 0.12 75)" }}>
            Weekly Execution Rhythm
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {WEEKLY_ACTIONS.map((day) => (
            <div key={day.day} className="p-3 rounded-lg" style={{ background: "oklch(0.14 0.008 55)" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "oklch(0.80 0.14 78)" }}>{day.day}</p>
              <div className="space-y-1.5">
                {day.actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px]" style={{ color: "oklch(0.60 0.010 70)" }}>
                    <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: "oklch(0.72 0.12 75 / 0.50)" }} />
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
