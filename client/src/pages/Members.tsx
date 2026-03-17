/*
 * Members — ICC Membership OS
 * Full member list with tier filters, search, status badges, renewal dates
 * Links to Appstle for live data
 */
import { useState } from "react";
import { Search, ExternalLink, Filter } from "lucide-react";

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
    Active: { bg: "oklch(0.35 0.10 145 / 0.20)", text: "oklch(0.65 0.15 145)" },
    Paused: { bg: "oklch(0.55 0.10 75 / 0.20)", text: "oklch(0.72 0.12 75)" },
    Cancelled: { bg: "oklch(0.55 0.15 25 / 0.20)", text: "oklch(0.70 0.15 30)" },
  };
  const c = colors[status] || colors.Active;
  return (
    <span className="text-xs px-2 py-0.5 rounded-sm font-medium" style={{ background: c.bg, color: c.text }}>
      {status}
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.92 0.012 75)" }}>
            Members
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "oklch(0.55 0.008 65)" }}>
            135 active members · Showing {filtered.length} results
          </p>
        </div>
        <a
          href="https://admin.shopify.com/store/08bcdd/apps/appstle-memberships/dashboards/subscriptions"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs px-4 py-2 rounded-md font-medium transition-all duration-180"
          style={{ background: "linear-gradient(135deg, oklch(0.72 0.12 75), oklch(0.80 0.14 78))", color: "oklch(0.10 0.008 55)" }}
        >
          <ExternalLink size={12} />
          Open Appstle
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "oklch(0.50 0.008 65)" }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-md border outline-none transition-all duration-180"
            style={{
              background: "oklch(0.14 0.008 55)",
              border: "1px solid oklch(0.22 0.008 55)",
              color: "oklch(0.85 0.010 75)",
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={12} style={{ color: "oklch(0.50 0.008 65)" }} />
          {["All", "APEX", "Atabey", "Visionary"].map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className="text-xs px-3 py-2 rounded-md border transition-all duration-180"
              style={{
                background: tierFilter === t ? "oklch(0.72 0.12 75 / 0.15)" : "transparent",
                borderColor: tierFilter === t ? "oklch(0.72 0.12 75 / 0.5)" : "oklch(0.22 0.008 55)",
                color: tierFilter === t ? "oklch(0.80 0.14 78)" : "oklch(0.55 0.008 65)",
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
              className="text-xs px-3 py-2 rounded-md border transition-all duration-180"
              style={{
                background: statusFilter === s ? "oklch(0.18 0.008 55)" : "transparent",
                borderColor: statusFilter === s ? "oklch(0.35 0.008 55)" : "oklch(0.22 0.008 55)",
                color: statusFilter === s ? "oklch(0.85 0.010 75)" : "oklch(0.50 0.008 65)",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg overflow-hidden border" style={{ borderColor: "oklch(0.22 0.008 55)" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "oklch(0.13 0.008 55)", borderBottom: "1px solid oklch(0.22 0.008 55)" }}>
              {["Member", "Tier", "Status", "Joined", "Next Renewal", "Locker", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "oklch(0.50 0.008 65)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr
                key={m.id}
                className="border-b transition-colors duration-150"
                style={{
                  borderColor: "oklch(0.18 0.006 55)",
                  background: i % 2 === 0 ? "oklch(0.12 0.008 55)" : "oklch(0.10 0.008 55)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0.16 0.008 55)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "oklch(0.12 0.008 55)" : "oklch(0.10 0.008 55)")}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "oklch(0.20 0.008 55)", color: "oklch(0.72 0.12 75)" }}
                    >
                      {m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: "oklch(0.85 0.010 75)" }}>{m.name}</p>
                      <p style={{ color: "oklch(0.45 0.006 60)" }}>{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><TierBadge tier={m.tier} /></td>
                <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                <td className="px-4 py-3" style={{ color: "oklch(0.55 0.008 65)" }}>{m.joined}</td>
                <td className="px-4 py-3">
                  <span style={{ color: "oklch(0.72 0.12 75)" }}>{m.renewal}</span>
                </td>
                <td className="px-4 py-3">
                  {m.locker ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "oklch(0.72 0.12 75 / 0.15)", color: "oklch(0.72 0.12 75)" }}>Yes</span>
                  ) : (
                    <span style={{ color: "oklch(0.35 0.006 55)" }}>—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`https://admin.shopify.com/store/08bcdd/apps/appstle-memberships/dashboards/subscriptions`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors duration-150"
                    style={{ color: "oklch(0.50 0.008 65)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.72 0.12 75)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.50 0.008 65)")}
                  >
                    <ExternalLink size={12} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-center" style={{ color: "oklch(0.40 0.006 55)" }}>
        Showing sample data. Connect to Appstle for live member records.
      </p>
    </div>
  );
}
