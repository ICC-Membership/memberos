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
  { tier: "Visionary", count: 72, color: "#8899CC" },
  { tier: "Atabey", count: 43, color: "#C4A35A" },
  { tier: "APEX", count: 20, color: "#C8102E" },
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
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(13,13,13,0.92) 0%, rgba(13,13,13,0.65) 60%, transparent 100%)" }} />
        <div className="relative z-10 p-6 flex flex-col justify-between h-full" style={{ minHeight: "160px" }}>
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "#C8102E" }}>
              {today}
            </p>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em", color: "#E8E4DC" }}>
              Good morning, Andrew
            </h1>
            <p style={{ fontSize: "0.82rem", marginTop: "0.25rem", color: "#A09A94" }}>
              You're 15 members away from your April 1st Rock. Here's your command center.
            </p>
          </div>
          <div className="flex gap-4 mt-4">
            <a href="/email" className="text-xs px-4 py-2 rounded-md font-medium transition-all duration-180"
              style={{ background: "#C8102E", color: "white" }}>
              Check Email Hub
            </a>
            <a href="/members" className="text-xs px-4 py-2 rounded-md font-medium border transition-all duration-180"
              style={{ color: "#E8E4DC", borderColor: "rgba(232,228,220,0.35)", background: "transparent" }}>
              View Members
            </a>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: "135", sub: "+3 this month", icon: Users, color: "#C8102E" },
          { label: "Active APEX", value: "20", sub: "Private lounge access", icon: Award, color: "#C4A35A" },
          { label: "Renewals This Week", value: "7", sub: "Next 7 days", icon: Calendar, color: "#8899CC" },
          { label: "To April 1 Goal", value: "15", sub: "Members needed", icon: TrendingUp, color: "#22C55E" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="icc-card" style={{ padding: "1rem" }}>
            <div className="flex items-start justify-between mb-3">
              <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#3A3A3A" }}>{label}</p>
              <Icon size={14} style={{ color }} />
            </div>
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", color: "#E8E4DC", lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: "0.7rem", marginTop: "0.25rem", color: "#3A3A3A" }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Q1 Rocks */}
      <div className="icc-card" style={{ padding: "1.25rem" }}>
        <div className="flex items-center gap-2 mb-4">
          <Star size={14} style={{ color: "#C8102E" }} />
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem", letterSpacing: "0.08em", color: "#E8E4DC" }}>
            Q1 2026 Rocks
          </h2>
          <span style={{ fontSize: "0.68rem", color: "#3A3A3A", marginLeft: "auto" }}>Due April 1, 2026</span>
        </div>
        <div className="space-y-4">
          {ROCKS.map((rock) => (
            <div key={rock.id}>
              <div className="flex items-center justify-between mb-1.5">
                <p style={{ fontSize: "0.82rem", fontWeight: 500, color: "#E8E4DC" }}>
                  <span style={{ fontSize: "0.68rem", color: "#3A3A3A", marginRight: "0.5rem" }}>Rock {rock.id}</span>
                  {rock.title}
                </p>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: rock.pct >= 80 ? "#C8102E" : "#C4A35A" }}>
                  {rock.pct}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#1E1E1E" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${rock.pct}%`,
                    background: rock.pct >= 80
                      ? "#C8102E"
                      : rock.pct >= 50
                      ? "#C4A35A"
                      : "#8899CC",
                  }}
                />
              </div>
              {rock.id === 1 && (
                <p style={{ fontSize: "0.68rem", marginTop: "0.25rem", color: "#3A3A3A" }}>
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
        <div className="icc-card" style={{ padding: "1.25rem", gridColumn: "span 2 / span 2" }}>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem", letterSpacing: "0.08em", color: "#E8E4DC", marginBottom: "1rem" }}>
            MEMBER GROWTH
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={GROWTH_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C8102E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C8102E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" />
              <XAxis dataKey="month" tick={{ fill: "#3A3A3A", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#3A3A3A", fontSize: 11 }} axisLine={false} tickLine={false} domain={[90, 160]} />
              <Tooltip
                contentStyle={{ background: "#1C1C1C", border: "1px solid #2A2A2A", borderRadius: "4px", color: "#E8E4DC" }}
                labelStyle={{ color: "#C8102E" }}
              />
              <Area type="monotone" dataKey="members" stroke="#C8102E" strokeWidth={2} fill="url(#redGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tier breakdown */}
        <div className="icc-card" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem", letterSpacing: "0.08em", color: "#E8E4DC", marginBottom: "1rem" }}>
            BY TIER
          </h3>
          <div className="space-y-3">
            {TIER_DATA.map(({ tier, count, color }) => (
              <div key={tier}>
                <div className="flex justify-between items-center mb-1">
                  <TierBadge tier={tier} />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#E8E4DC" }}>{count}</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#1E1E1E" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(count / 135) * 100}%`, background: color, transition: "width 0.5s ease" }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="red-rule mt-4 pt-4">
            <p style={{ fontSize: "0.72rem", color: "#3A3A3A" }}>Annual target: <span style={{ color: "#C8102E", fontWeight: 700 }}>200 members</span></p>
          </div>
        </div>
      </div>

      {/* Bottom row: Renewals + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming renewals */}
        <div className="icc-card" style={{ padding: "1.25rem" }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={14} style={{ color: "#C8102E" }} />
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem", letterSpacing: "0.08em", color: "#E8E4DC" }}>
              UPCOMING RENEWALS
            </h3>
          </div>
          <div className="space-y-2">
            {UPCOMING_RENEWALS.map((r) => (
              <div key={r.name} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "#1E1E1E" }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "#1E1E1E", color: "#C8102E" }}
                  >
                    {r.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#E8E4DC" }}>{r.name}</p>
                    <TierBadge tier={r.tier} />
                  </div>
                </div>
                <div className="text-right">
                  <p style={{ fontSize: "0.78rem", fontWeight: 700, color: r.daysLeft <= 5 ? "#C8102E" : "#C4A35A" }}>
                    {r.date}
                  </p>
                  <p style={{ fontSize: "0.65rem", color: "#3A3A3A" }}>{r.daysLeft}d left</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="icc-card" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem", letterSpacing: "0.08em", color: "#E8E4DC", marginBottom: "1rem" }}>
            RECENT ACTIVITY
          </h3>
          <div className="space-y-3">
            {RECENT_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: "#C8102E" }}
                />
                <div>
                  <p style={{ fontSize: "0.78rem", fontWeight: 500, color: "#E8E4DC" }}>
                    {a.action} — <span style={{ color: "#C8102E" }}>{a.name}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <TierBadge tier={a.tier} />
                    <span style={{ fontSize: "0.65rem", color: "#3A3A3A" }}>{a.time}</span>
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
