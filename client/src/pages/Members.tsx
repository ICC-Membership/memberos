/*
 * Members — ICC Membership OS Wave 2
 * ICC brand: near-black, #C8102E red, Bebas Neue headings
 */
import { useState } from "react";
import { Search, ExternalLink, Filter } from "lucide-react";

const ICC_RED = "#C8102E";
const SURFACE = "#1C1C1C";
const BORDER = "#2A2A2A";
const TEXT = "#E8E4DC";
const TEXT_DIM = "#6B6560";
const MUTED = "#3A3A3A";

const MEMBERS = [
  { id: "#33050165568", name: "Matt Miller", email: "utpilot@gmail.com", tier: "Visionary", status: "Active", joined: "Mar 02, 2026", renewal: "Apr 02, 2026", locker: false },
  { id: "#32517849408", name: "Harold Bishop Jr.", email: "lsiu_tigers86@icloud.com", tier: "APEX", status: "Active", joined: "Feb 23, 2026", renewal: "Mar 23, 2026", locker: true },
  { id: "#32340934976", name: "Caden Posey", email: "cadenposey11@gmail.com", tier: "Atabey", status: "Active", joined: "Feb 21, 2026", renewal: "Mar 21, 2026", locker: false },
  { id: "#31698583872", name: "Robert DiMarco", email: "rdimarco@novarra.vc", tier: "APEX", status: "Active", joined: "Feb 11, 2026", renewal: "Apr 11, 2026", locker: true },
  { id: "#28781019456", name: "Norris Washington", email: "nwashington3.nw@gmail.com", tier: "Visionary", status: "Active", joined: "Dec 24, 2025", renewal: "Mar 24, 2026", locker: false },
  { id: "#28720038208", name: "Jason Passwaters", email: "yana.mccormick@passwaters.com", tier: "Atabey", status: "Active", joined: "Dec 23, 2025", renewal: "Mar 23, 2026", locker: true },
  { id: "#28675244352", name: "Derrick Coleman", email: "a.derrickcoleman@gmail.com", tier: "Visionary", status: "Active", joined: "Dec 22, 2025", renewal: "Mar 22, 2026", locker: false },
  { id: "#28285305152", name: "Sterling Mott", email: "sterling.mott@gmail.com", tier: "APEX", status: "Active", joined: "Dec 16, 2025", renewal: "Jun 20, 2026", locker: true },
  { id: "#27955986752", name: "Chris Williams", email: "ccprep2020@gmail.com", tier: "Atabey", status: "Active", joined: "Dec 11, 2025", renewal: "Apr 11, 2026", locker: false },
  { id: "#25463521600", name: "Howard Stokes", email: "howard0685@gmail.com", tier: "Visionary", status: "Active", joined: "Nov 08, 2025", renewal: "Apr 08, 2026", locker: false },
  { id: "#25227788608", name: "Dack Lowery", email: "dack300z@yahoo.com", tier: "Atabey", status: "Active", joined: "Nov 01, 2025", renewal: "Apr 01, 2026", locker: true },
  { id: "#24100000001", name: "James Thornton", email: "j.thornton@email.com", tier: "APEX", status: "Active", joined: "Oct 15, 2025", renewal: "Apr 15, 2026", locker: true },
  { id: "#24100000002", name: "Marcus Reed", email: "mreed@gmail.com", tier: "Visionary", status: "Paused", joined: "Sep 20, 2025", renewal: "Mar 20, 2026", locker: false },
  { id: "#24100000003", name: "David Chen", email: "dchen@outlook.com", tier: "Atabey", status: "Active", joined: "Sep 05, 2025", renewal: "Apr 05, 2026", locker: true },
  { id: "#24100000004", name: "Tyler Brooks", email: "tbrooks@gmail.com", tier: "Visionary", status: "Active", joined: "Aug 12, 2025", renewal: "Apr 12, 2026", locker: false },
];

function TierBadge({ tier }: { tier: string }) {
  if (tier === "APEX") return <span className="tier-badge-apex">{tier}</span>;
  if (tier === "Atabey") return <span className="tier-badge-atabey">{tier}</span>;
  return <span className="tier-badge-visionary">{tier}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    Active: { bg: "rgba(34,197,94,0.12)", text: "#22C55E" },
    Paused: { bg: "rgba(196,163,90,0.15)", text: "#C4A35A" },
    Cancelled: { bg: "rgba(200,16,46,0.12)", text: ICC_RED },
  };
  const c = colors[status] || colors.Active;
  return (
    <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em", padding: "0.15rem 0.5rem", borderRadius: "0.2rem", background: c.bg, color: c.text }}>
      {status.toUpperCase()}
    </span>
  );
}

export default function Members() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = MEMBERS.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === "All" || m.tier === tierFilter;
    const matchStatus = statusFilter === "All" || m.status === statusFilter;
    return matchSearch && matchTier && matchStatus;
  });

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.75rem", letterSpacing: "0.04em", color: TEXT, lineHeight: 1 }}>
            MEMBERS
          </h1>
          <p style={{ fontSize: "0.78rem", marginTop: "0.25rem", color: TEXT_DIM }}>
            135 active members · Showing {filtered.length} results
          </p>
        </div>
        <a
          href="https://admin.shopify.com/store/08bcdd/apps/appstle-memberships/dashboards/subscriptions"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2"
          style={{ background: ICC_RED, color: "white", fontSize: "0.75rem", fontWeight: 600, padding: "0.5rem 1rem", borderRadius: "0.25rem" }}
        >
          <ExternalLink size={12} />
          Open Appstle
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded outline-none"
            style={{ background: "#161616", border: `1px solid ${BORDER}`, color: TEXT }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={12} style={{ color: MUTED }} />
          {["All", "APEX", "Atabey", "Visionary"].map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className="text-xs px-3 py-1.5 rounded border transition-all"
              style={{
                background: tierFilter === t ? "rgba(200,16,46,0.15)" : "transparent",
                borderColor: tierFilter === t ? "rgba(200,16,46,0.50)" : BORDER,
                color: tierFilter === t ? ICC_RED : TEXT_DIM,
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {["All", "Active", "Paused", "Cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="text-xs px-3 py-1.5 rounded border transition-all"
              style={{
                background: statusFilter === s ? "#1C1C1C" : "transparent",
                borderColor: statusFilter === s ? "#3A3A3A" : BORDER,
                color: statusFilter === s ? TEXT : TEXT_DIM,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "#161616", borderBottom: `1px solid ${BORDER}` }}>
              {["Member", "Tier", "Status", "Joined", "Next Renewal", "Locker", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3" style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: MUTED }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr
                key={m.id}
                className="border-b transition-colors"
                style={{
                  borderColor: "#1E1E1E",
                  background: i % 2 === 0 ? "#1C1C1C" : "#161616",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#222222")}
                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#1C1C1C" : "#161616")}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "#1E1E1E", color: ICC_RED, border: `1px solid #2A2A2A` }}
                    >
                      {m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: TEXT }}>{m.name}</p>
                      <p style={{ color: MUTED, fontSize: "0.7rem" }}>{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><TierBadge tier={m.tier} /></td>
                <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                <td className="px-4 py-3" style={{ color: TEXT_DIM }}>{m.joined}</td>
                <td className="px-4 py-3">
                  <span style={{ color: "#C4A35A", fontWeight: 600 }}>{m.renewal}</span>
                </td>
                <td className="px-4 py-3">
                  {m.locker ? (
                    <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "0.2rem", background: "rgba(196,163,90,0.12)", color: "#C4A35A" }}>YES</span>
                  ) : (
                    <span style={{ color: MUTED }}>—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <a
                    href="https://admin.shopify.com/store/08bcdd/apps/appstle-memberships/dashboards/subscriptions"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: MUTED, transition: "color 0.15s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = ICC_RED)}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = MUTED)}
                  >
                    <ExternalLink size={12} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: "0.7rem", textAlign: "center", color: MUTED }}>
        Showing sample data · Connect to Appstle for live member records
      </p>
    </div>
  );
}
