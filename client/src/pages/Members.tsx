/**
 * Members — ICC Membership OS
 * Live data from Appstle via tRPC — active, paused, cancelled, dunning flags
 */
import { useState } from "react";
import { Search, ExternalLink, Filter, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const ICC_RED = "#C8102E";
const SURFACE = "#1C1C1C";
const BORDER = "#2A2A2A";
const TEXT = "#E8E4DC";
const TEXT_DIM = "#6B6560";
const MUTED = "#3A3A3A";

function TierBadge({ tier }: { tier: string }) {
  if (tier === "APEX") return <span className="tier-badge-apex">{tier}</span>;
  if (tier === "Atabey") return <span className="tier-badge-atabey">{tier}</span>;
  return <span className="tier-badge-visionary">{tier}</span>;
}

function StatusBadge({ status, dunning }: { status: string; dunning?: boolean }) {
  if (dunning) {
    return (
      <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em", padding: "0.15rem 0.5rem", borderRadius: "0.2rem", background: "rgba(234,179,8,0.15)", color: "#EAB308" }}>
        ⚠ DUNNING
      </span>
    );
  }
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

  // DB members (synced from Appstle)
  const { data: members = [], isLoading, refetch } = trpc.members.list.useQuery();
  // Live Appstle health stats (always fresh from API)
  const { data: appstleStats } = trpc.shopify.liveStats.useQuery();

  const syncMutation = trpc.shopify.syncMembers.useMutation({
    onSuccess: (data) => {
      toast.success(`Synced ${data.synced} members from Appstle`);
      refetch();
    },
    onError: (err) => toast.error(`Sync failed: ${err.message}`),
  });

  const filtered = members.filter((m: any) => {
    const matchSearch = m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === "All" || m.tier === tierFilter;
    const matchStatus = statusFilter === "All" || m.status === statusFilter;
    return matchSearch && matchTier && matchStatus;
  });

  const activeCount = members.filter((m: any) => m.status === "Active").length;
  const dunningCount = members.filter((m: any) => m.notes?.includes("dunning")).length;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.75rem", letterSpacing: "0.04em", color: TEXT, lineHeight: 1 }}>
            MEMBERS
          </h1>
          <p style={{ fontSize: "0.78rem", marginTop: "0.25rem", color: TEXT_DIM }}>
            {isLoading ? "Loading..." : `${activeCount} active · Showing ${filtered.length} results`}
            {appstleStats && (
              <span style={{ marginLeft: "0.75rem", color: "#22C55E" }}>
                ● Live: {appstleStats.active} active · {appstleStats.paused} paused · ${appstleStats.mrr.toLocaleString()}/mo MRR
              </span>
            )}
            {dunningCount > 0 && (
              <span style={{ marginLeft: "0.75rem", color: "#EAB308" }}>
                ⚠ {dunningCount} payment issues
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2"
            style={{
              background: syncMutation.isPending ? "#2A2A2A" : "rgba(200,16,46,0.15)",
              color: syncMutation.isPending ? TEXT_DIM : ICC_RED,
              border: `1px solid rgba(200,16,46,0.30)`,
              fontSize: "0.75rem", fontWeight: 600,
              padding: "0.5rem 1rem", borderRadius: "0.25rem",
              cursor: syncMutation.isPending ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw size={12} className={syncMutation.isPending ? "animate-spin" : ""} />
            {syncMutation.isPending ? "Syncing..." : "Sync from Appstle"}
          </button>
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
      </div>

      {/* Appstle Connected Banner */}
      {appstleStats && (
        <div className="flex items-center gap-2 px-4 py-2 rounded" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.20)" }}>
          <CheckCircle size={13} style={{ color: "#22C55E" }} />
          <span style={{ fontSize: "0.72rem", color: "#22C55E" }}>
            Appstle connected — {appstleStats.active} active · {appstleStats.paused} paused · {appstleStats.cancelled} cancelled · {appstleStats.dunning} dunning · ${appstleStats.mrr.toLocaleString()}/mo MRR
          </span>
        </div>
      )}

      {/* Dunning Alert */}
      {appstleStats && appstleStats.dunning > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 rounded" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)" }}>
          <AlertTriangle size={13} style={{ color: "#EAB308" }} />
          <span style={{ fontSize: "0.72rem", color: "#EAB308" }}>
            {appstleStats.dunning} member{appstleStats.dunning > 1 ? "s" : ""} in dunning — payment failed, Appstle is retrying. Click "Sync from Appstle" to see who.
          </span>
        </div>
      )}

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
        {isLoading ? (
          <div className="flex items-center justify-center py-16" style={{ color: TEXT_DIM }}>
            <RefreshCw size={16} className="animate-spin mr-2" />
            Loading members...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: TEXT_DIM }}>
            <p style={{ fontSize: "0.85rem" }}>No members found</p>
            <button
              onClick={() => syncMutation.mutate()}
              style={{ background: ICC_RED, color: "white", fontSize: "0.75rem", fontWeight: 600, padding: "0.5rem 1.25rem", borderRadius: "0.25rem" }}
            >
              Sync from Appstle to import members
            </button>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "#161616", borderBottom: `1px solid ${BORDER}` }}>
                {["Member", "Tier", "Status", "Rate/mo", "Joined", "Next Renewal", "Locker", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3" style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: MUTED }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m: any, i: number) => {
                const isDunning = m.notes?.includes("dunning");
                return (
                  <tr
                    key={m.id}
                    className="border-b transition-colors"
                    style={{ borderColor: "#1E1E1E", background: isDunning ? "rgba(234,179,8,0.04)" : i % 2 === 0 ? "#1C1C1C" : "#161616" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#222222")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = isDunning ? "rgba(234,179,8,0.04)" : i % 2 === 0 ? "#1C1C1C" : "#161616")}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: "#1E1E1E", color: ICC_RED, border: `1px solid #2A2A2A` }}
                        >
                          {(m.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: TEXT }}>{m.name}</p>
                          <p style={{ color: MUTED, fontSize: "0.7rem" }}>{m.email || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><TierBadge tier={m.tier || "Visionary"} /></td>
                    <td className="px-4 py-3"><StatusBadge status={m.status || "Active"} dunning={isDunning} /></td>
                    <td className="px-4 py-3">
                      <span style={{ color: m.monthlyRate ? "#C4A35A" : TEXT_DIM, fontWeight: 600 }}>
                        {m.monthlyRate ? `$${m.monthlyRate.toFixed(0)}` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: TEXT_DIM }}>
                      {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ color: "#C4A35A", fontWeight: 600 }}>
                        {m.renewalDate ? new Date(m.renewalDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.lockerNumber ? (
                        <span style={{ fontSize: "0.7rem", color: "#C4A35A", fontWeight: 600 }}>#{m.lockerNumber}</span>
                      ) : (
                        <span style={{ color: MUTED }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://admin.shopify.com/store/08bcdd/customers/${m.externalId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: ICC_RED, fontSize: "0.7rem" }}
                      >
                        <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
