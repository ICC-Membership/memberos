/*
 * Power Rankings — ICC Membership OS
 * Member scoring system for APEX lounge invitation eligibility
 * Based on: visits, spend, referrals, tenure, event attendance
 */
import { useState } from "react";
import { Trophy, Star, TrendingUp, ExternalLink } from "lucide-react";

const SCORING_CRITERIA = [
  { category: "Visits", max: 30, description: "Monthly lounge visits (3 pts each, max 10 visits)" },
  { category: "Spend", max: 25, description: "Monthly F&B + retail spend ($50 = 1pt, max 25pts)" },
  { category: "Referrals", max: 20, description: "Active member referrals (5 pts each)" },
  { category: "Tenure", max: 15, description: "Membership length (1pt/month, max 15)" },
  { category: "Events", max: 10, description: "Event attendance (2 pts each, max 5 events)" },
];

const MEMBERS_RANKED = [
  { rank: 1, name: "Sterling Mott", tier: "APEX", visits: 28, spend: 24, referrals: 20, tenure: 15, events: 10, total: 97, apexEligible: true },
  { rank: 2, name: "Robert DiMarco", tier: "APEX", visits: 27, spend: 22, referrals: 15, tenure: 12, events: 10, total: 86, apexEligible: true },
  { rank: 3, name: "Harold Bishop Jr.", tier: "APEX", visits: 24, spend: 20, referrals: 20, tenure: 10, events: 8, total: 82, apexEligible: true },
  { rank: 4, name: "Jason Passwaters", tier: "Atabey", visits: 21, spend: 18, referrals: 15, tenure: 12, events: 8, total: 74, apexEligible: true },
  { rank: 5, name: "David Chen", tier: "Atabey", visits: 20, spend: 20, referrals: 10, tenure: 14, events: 8, total: 72, apexEligible: true },
  { rank: 6, name: "Dack Lowery", tier: "Atabey", visits: 18, spend: 17, referrals: 15, tenure: 11, events: 8, total: 69, apexEligible: true },
  { rank: 7, name: "James Thornton", tier: "APEX", visits: 22, spend: 19, referrals: 10, tenure: 10, events: 6, total: 67, apexEligible: false },
  { rank: 8, name: "Chris Williams", tier: "Atabey", visits: 16, spend: 15, referrals: 10, tenure: 12, events: 8, total: 61, apexEligible: false },
  { rank: 9, name: "Caden Posey", tier: "Atabey", visits: 15, spend: 14, referrals: 10, tenure: 8, events: 6, total: 53, apexEligible: false },
  { rank: 10, name: "Norris Washington", tier: "Visionary", visits: 14, spend: 12, referrals: 10, tenure: 12, events: 4, total: 52, apexEligible: false },
  { rank: 11, name: "Derrick Coleman", tier: "Visionary", visits: 12, spend: 11, referrals: 5, tenure: 12, events: 6, total: 46, apexEligible: false },
  { rank: 12, name: "Howard Stokes", tier: "Visionary", visits: 10, spend: 10, referrals: 5, tenure: 14, events: 4, total: 43, apexEligible: false },
  { rank: 13, name: "Matt Miller", tier: "Visionary", visits: 9, spend: 8, referrals: 5, tenure: 2, events: 4, total: 28, apexEligible: false },
  { rank: 14, name: "Tyler Brooks", tier: "Visionary", visits: 8, spend: 7, referrals: 0, tenure: 12, events: 0, total: 27, apexEligible: false },
  { rank: 15, name: "Marcus Reed", tier: "Visionary", visits: 5, spend: 5, referrals: 0, tenure: 10, events: 2, total: 22, apexEligible: false },
];

const APEX_THRESHOLD = 70;

function TierBadge({ tier }: { tier: string }) {
  if (tier === "APEX") return <span className="tier-badge-apex">{tier}</span>;
  if (tier === "Atabey") return <span className="tier-badge-atabey">{tier}</span>;
  return <span className="tier-badge-visionary">{tier}</span>;
}

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#2A2A2A" }}>
        <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
      <span className="text-xs w-6 text-right" style={{ color: "#A09A94" }}>{value}</span>
    </div>
  );
}

export default function PowerRankings() {
  const [quarter, setQuarter] = useState("Q1 2026");
  const apexEligible = MEMBERS_RANKED.filter(m => m.total >= APEX_THRESHOLD);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#E8E4DC" }}>
            Power Rankings
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B6560" }}>
            Member scoring for APEX Lounge invitation eligibility — {quarter}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {["Q1 2026", "Q4 2025", "Q3 2025"].map(q => (
            <button
              key={q}
              onClick={() => setQuarter(q)}
              className="text-xs px-3 py-2 rounded-md border transition-all duration-180"
              style={{
                background: quarter === q ? "#C8102E" : "transparent",
                borderColor: quarter === q ? "#C8102E" : "#2A2A2A",
                color: quarter === q ? "#E8E4DC" : "#6B6560",
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Scoring key */}
      <div className="icc-card">
        <div className="flex items-center gap-2 mb-3">
          <Star size={13} style={{ color: "#C8102E" }} />
          <h3 className="text-xs font-semibold tracking-wide uppercase" style={{ color: "#C8102E" }}>
            Scoring Criteria — 100 Points Total
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {SCORING_CRITERIA.map(c => (
            <div key={c.category} className="p-3 rounded-md" style={{ background: "#161616" }}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold" style={{ color: "#E8E4DC" }}>{c.category}</span>
                <span className="text-xs" style={{ color: "#C8102E" }}>/{c.max}</span>
              </div>
              <p className="text-[10px]" style={{ color: "#3A3A3A" }}>{c.description}</p>
            </div>
          ))}
        </div>
        <div className="red-rule mt-3 pt-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: "#C8102E" }} />
          <p className="text-xs" style={{ color: "#A09A94" }}>
            APEX Lounge invitation threshold: <span style={{ color: "#E8E4DC", fontWeight: 600 }}>70+ points</span> — {apexEligible.length} members qualify this quarter
          </p>
        </div>
      </div>

      {/* APEX Eligible highlight */}
      <div className="p-4 rounded-lg border" style={{ background: "#C8102E", borderColor: "#C8102E" }}>
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={14} style={{ color: "#E8E4DC" }} />
          <h3 className="text-sm font-semibold" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#E8E4DC" }}>
            APEX Lounge Invitations — {quarter}
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-sm ml-auto" style={{ background: "#C8102E", color: "#E8E4DC" }}>
            {apexEligible.length} Eligible
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {apexEligible.map(m => (
            <div key={m.name} className="flex items-center gap-2 px-3 py-1.5 rounded-md" style={{ background: "#161616", border: "1px solid #C8102E" }}>
              <span className="text-xs font-medium" style={{ color: "#E8E4DC" }}>{m.name}</span>
              <span className="text-xs font-bold" style={{ color: "#E8E4DC" }}>{m.total}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Full rankings table */}
      <div className="rounded-lg overflow-hidden border" style={{ borderColor: "#2A2A2A" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "#141414", borderBottom: "1px solid #2A2A2A" }}>
              <th className="text-left px-4 py-3 font-medium tracking-wide uppercase w-10" style={{ color: "#6B6560" }}>#</th>
              <th className="text-left px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>Member</th>
              <th className="text-left px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>Tier</th>
              <th className="text-left px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>Visits</th>
              <th className="text-left px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>Spend</th>
              <th className="text-left px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>Referrals</th>
              <th className="text-left px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>Tenure</th>
              <th className="text-left px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>Events</th>
              <th className="text-center px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>Total</th>
              <th className="text-center px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>APEX</th>
            </tr>
          </thead>
          <tbody>
            {MEMBERS_RANKED.map((m, i) => (
              <tr
                key={m.name}
                className="border-b transition-colors duration-150"
                style={{
                  borderColor: "#1E1E1E",
                  background: m.apexEligible ? "#C8102E" : (i % 2 === 0 ? "#1C1C1C" : "#161616"),
                }}
              >
                <td className="px-4 py-3">
                  <span className="font-bold" style={{ color: m.rank <= 3 ? "#E8E4DC" : "#3A3A3A" }}>
                    {m.rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "#1E1E1E", color: "#C8102E" }}>
                      {m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <span className="font-medium" style={{ color: "#E8E4DC" }}>{m.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><TierBadge tier={m.tier} /></td>
                <td className="px-4 py-3 w-24"><ScoreBar value={m.visits} max={30} color="#8899CC" /></td>
                <td className="px-4 py-3 w-24"><ScoreBar value={m.spend} max={25} color="#22C55E" /></td>
                <td className="px-4 py-3 w-24"><ScoreBar value={m.referrals} max={20} color="#C4A35A" /></td>
                <td className="px-4 py-3 w-24"><ScoreBar value={m.tenure} max={15} color="#9B7FC7" /></td>
                <td className="px-4 py-3 w-24"><ScoreBar value={m.events} max={10} color="#C8102E" /></td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-bold" style={{ color: m.total >= APEX_THRESHOLD ? "#E8E4DC" : "#A09A94" }}>
                    {m.total}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {m.total >= APEX_THRESHOLD ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#C8102E", color: "#E8E4DC" }}>
                      Invited
                    </span>
                  ) : (
                    <span style={{ color: "#3A3A3A" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-center" style={{ color: "#3A3A3A" }}>
        Power Rankings are updated quarterly. Connect your Google Sheets for live scoring data.{" "}
        <a href="https://docs.google.com/spreadsheets/d/1_aB7FswtK24TBhdJ0Rk0WyTcZcxX76lV2MEGkrDe23w" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1" style={{ color: "#C8102E" }}>
          Open Spreadsheet <ExternalLink size={10} />
        </a>
      </p>
    </div>
  );
}
