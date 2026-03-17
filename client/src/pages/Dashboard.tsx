/*
 * Dashboard — ICC Membership OS Command Center
 * Design: Refined Dark Luxury — deep warm-dark, gold accents, Playfair headings
 * Shows: KPI cards, Rock progress, member growth chart, upcoming renewals, recent activity
 */
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Users, TrendingUp, AlertCircle, Calendar, Star, Award } from "lucide-react";

const GROWTH_DATA = [
  { month: "Aug", members: 98 },
  { month: "Sep", members: 105 },
  { month: "Oct", members: 112 },
  { month: "Nov", members: 118 },
  { month: "Dec", members: 124 },
  { month: "Jan", members: 128 },
  { month: "Feb", members: 132 },
  { month: "Mar", members: 135 },
];

const TIER_DATA = [
  { tier: "Visionary", count: 72, color: "oklch(0.55 0.06 250)" },
  { tier: "Atabey", count: 43, color: "oklch(0.60 0.08 55)" },
  { tier: "APEX", count: 20, color: "oklch(0.72 0.12 75)" },
];

const UPCOMING_RENEWALS = [
  { name: "Harold Bishop Jr.", tier: "APEX", date: "Mar 23", daysLeft: 6 },
  { name: "Caden Posey", tier: "Atabey", date: "Mar 21", daysLeft: 4 },
  { name: "Norris Washington", tier: "Visionary", date: "Mar 24", daysLeft: 7 },
  { name: "Jason Passwaters", tier: "Atabey", date: "Mar 23", daysLeft: 6 },
  { name: "Derrick Coleman", tier: "Visionary", date: "Mar 22", daysLeft: 5 },
];

const RECENT_ACTIVITY = [
  { action: "New member joined", name: "Matt Miller", tier: "Visionary", time: "2 days ago" },
  { action: "Renewal processed", name: "Sterling Mott", tier: "APEX", time: "3 days ago" },
  { action: "Upgrade to Atabey", name: "Chris Williams", tier: "Atabey", time: "5 days ago" },
  { action: "New member joined", name: "Howard Stokes", tier: "Visionary", time: "1 week ago" },
];

const ROCKS = [
  { id: 1, title: "Grow to 150 Members", current: 135, target: 150, deadline: "April 1, 2026", pct: Math.round((135 / 150) * 100) },
  { id: 2, title: "Define Membership Program + Visuals + Training", current: 40, target: 100, deadline: "April 1, 2026", pct: 40 },
  { id: 3, title: "Ecosystem Training + Commission Plan Rollout", current: 25, target: 100, deadline: "April 1, 2026", pct: 25 },
];

function TierBadge({ tier }: { tier: string }) {
  if (tier === "APEX") return <span className="tier-badge-apex">{tier}</span>;
  if (tier === "Atabey") return <span className="tier-badge-atabey">{tier}</span>;
  return <span className="tier-badge-visionary">{tier}</span>;
}

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663388846002/JxsvGXqZ8SL52kxCjJkGqG/icc-hero-bg-JrkCAL8Bfb4U4fT7zNxwBL.webp";

export default function Dashboard() {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{ minHeight: "160px" }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, oklch(0.08 0.010 52 / 0.92) 0%, oklch(0.08 0.010 52 / 0.65) 60%, transparent 100%)" }} />
        <div className="relative z-10 p-6 flex flex-col justify-between h-full" style={{ minHeight: "160px" }}>
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "oklch(0.72 0.12 75)" }}>
              {today}
            </p>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.95 0.012 75)" }}>
              Good morning, Andrew
            </h1>
            <p className="text-sm mt-1" style={{ color: "oklch(0.70 0.010 72)" }}>
              You're 15 members away from your April 1st Rock. Here's your command center.
            </p>
          </div>
          <div className="flex gap-4 mt-4">
            <a href="/email" className="text-xs px-4 py-2 rounded-md font-medium transition-all duration-180"
              style={{ background: "linear-gradient(135deg, oklch(0.72 0.12 75), oklch(0.80 0.14 78))", color: "oklch(0.10 0.008 55)" }}>
              Check Email Hub
            </a>
            <a href="/members" className="text-xs px-4 py-2 rounded-md font-medium border transition-all duration-180"
              style={{ color: "oklch(0.85 0.012 75)", borderColor: "oklch(0.85 0.012 75 / 0.4)", background: "transparent" }}>
              View Members
            </a>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: "135", sub: "+3 this month", icon: Users, color: "oklch(0.72 0.12 75)" },
          { label: "Active APEX", value: "20", sub: "Private lounge access", icon: Award, color: "oklch(0.72 0.12 75)" },
          { label: "Renewals This Week", value: "7", sub: "Next 7 days", icon: Calendar, color: "oklch(0.65 0.10 55)" },
          { label: "To April 1 Goal", value: "15", sub: "Members needed", icon: TrendingUp, color: "oklch(0.65 0.15 145)" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium tracking-wide uppercase" style={{ color: "oklch(0.55 0.008 65)" }}>{label}</p>
              <Icon size={14} style={{ color }} />
            </div>
            <p className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.92 0.012 75)" }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.008 65)" }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Q1 Rocks */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-4">
          <Star size={14} style={{ color: "oklch(0.72 0.12 75)" }} />
          <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: "oklch(0.72 0.12 75)" }}>
            Q1 2026 Rocks
          </h2>
          <span className="text-xs ml-auto" style={{ color: "oklch(0.50 0.008 65)" }}>Due April 1, 2026</span>
        </div>
        <div className="space-y-4">
          {ROCKS.map((rock) => (
            <div key={rock.id}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-medium" style={{ color: "oklch(0.85 0.010 75)" }}>
                  <span className="text-xs mr-2" style={{ color: "oklch(0.55 0.008 65)" }}>Rock {rock.id}</span>
                  {rock.title}
                </p>
                <span className="text-xs font-semibold" style={{ color: rock.pct >= 80 ? "oklch(0.72 0.12 75)" : "oklch(0.65 0.010 70)" }}>
                  {rock.pct}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.22 0.008 55)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${rock.pct}%`,
                    background: rock.pct >= 80
                      ? "linear-gradient(90deg, oklch(0.72 0.12 75), oklch(0.80 0.14 78))"
                      : rock.pct >= 50
                      ? "linear-gradient(90deg, oklch(0.65 0.10 55), oklch(0.72 0.12 65))"
                      : "linear-gradient(90deg, oklch(0.55 0.08 35), oklch(0.65 0.10 45))",
                  }}
                />
              </div>
              {rock.id === 1 && (
                <p className="text-xs mt-1" style={{ color: "oklch(0.50 0.008 65)" }}>
                  {rock.current} of {rock.target} members — {rock.target - rock.current} remaining
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Growth chart */}
        <div className="stat-card lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.85 0.010 75)" }}>
            Member Growth
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={GROWTH_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.72 0.12 75)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.72 0.12 75)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.008 55)" />
              <XAxis dataKey="month" tick={{ fill: "oklch(0.50 0.008 65)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "oklch(0.50 0.008 65)", fontSize: 11 }} axisLine={false} tickLine={false} domain={[90, 160]} />
              <Tooltip
                contentStyle={{ background: "oklch(0.14 0.008 55)", border: "1px solid oklch(0.25 0.008 55)", borderRadius: "6px", color: "oklch(0.85 0.010 75)" }}
                labelStyle={{ color: "oklch(0.72 0.12 75)" }}
              />
              <Area type="monotone" dataKey="members" stroke="oklch(0.72 0.12 75)" strokeWidth={2} fill="url(#goldGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tier breakdown */}
        <div className="stat-card">
          <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.85 0.010 75)" }}>
            By Tier
          </h3>
          <div className="space-y-3">
            {TIER_DATA.map(({ tier, count, color }) => (
              <div key={tier}>
                <div className="flex justify-between items-center mb-1">
                  <TierBadge tier={tier} />
                  <span className="text-sm font-semibold" style={{ color: "oklch(0.85 0.010 75)" }}>{count}</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.22 0.008 55)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(count / 135) * 100}%`, background: color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="gold-rule mt-4 pt-4">
            <p className="text-xs" style={{ color: "oklch(0.50 0.008 65)" }}>Annual target: <span style={{ color: "oklch(0.72 0.12 75)" }}>200 members</span></p>
          </div>
        </div>
      </div>

      {/* Bottom row: Renewals + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming renewals */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={14} style={{ color: "oklch(0.72 0.12 75)" }} />
            <h3 className="text-sm font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.85 0.010 75)" }}>
              Upcoming Renewals
            </h3>
          </div>
          <div className="space-y-2">
            {UPCOMING_RENEWALS.map((r) => (
              <div key={r.name} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "oklch(0.20 0.008 55)" }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "oklch(0.20 0.008 55)", color: "oklch(0.72 0.12 75)" }}
                  >
                    {r.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "oklch(0.85 0.010 75)" }}>{r.name}</p>
                    <TierBadge tier={r.tier} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold" style={{ color: r.daysLeft <= 5 ? "oklch(0.70 0.15 30)" : "oklch(0.72 0.12 75)" }}>
                    {r.date}
                  </p>
                  <p className="text-[10px]" style={{ color: "oklch(0.50 0.008 65)" }}>{r.daysLeft}d left</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="stat-card">
          <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.85 0.010 75)" }}>
            Recent Activity
          </h3>
          <div className="space-y-3">
            {RECENT_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: "oklch(0.72 0.12 75)" }}
                />
                <div>
                  <p className="text-xs font-medium" style={{ color: "oklch(0.85 0.010 75)" }}>
                    {a.action} — <span style={{ color: "oklch(0.72 0.12 75)" }}>{a.name}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <TierBadge tier={a.tier} />
                    <span className="text-[10px]" style={{ color: "oklch(0.45 0.006 60)" }}>{a.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
