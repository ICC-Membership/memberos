/**
 * Members — ICC Membership OS
 * Live data from Appstle via tRPC — active, paused, cancelled, dunning flags
 * Bulk actions: select members, queue emails, export CSV
 */
import { useState } from "react";
import { Search, ExternalLink, Filter, RefreshCw, CheckCircle, AlertTriangle, Mail, Download, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const ICC_RED = "#C8102E";
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkEmailType, setBulkEmailType] = useState<"payment_reminder" | "win_back" | "general">("payment_reminder");

  const { data: members = [], isLoading, refetch } = trpc.members.list.useQuery();
  const { data: appstleStats } = trpc.shopify.liveStats.useQuery();

  const syncMutation = trpc.shopify.syncMembers.useMutation({
    onSuccess: (data) => { toast.success(`Synced ${data.synced} members from Appstle`); refetch(); },
    onError: (err) => toast.error(`Sync failed: ${err.message}`),
  });

  const bulkQueueEmails = trpc.members.bulkQueueEmails.useMutation({
    onSuccess: (d: any) => { setSelectedIds(new Set()); toast.success(`${d.queued} emails queued to Email Hub`); },
    onError: () => toast.error("Failed to queue emails"),
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

  const toggleSelect = (id: number) => setSelectedIds(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const toggleAll = () => {
    const allIds = filtered.map((m: any) => m.id);
    setSelectedIds(prev => prev.size === allIds.length ? new Set() : new Set(allIds));
  };

  const exportCSV = () => {
    const rows = filtered.filter((m: any) => selectedIds.size === 0 || selectedIds.has(m.id));
    const headers = ["Name", "Email", "Tier", "Status", "Monthly Rate", "Joined", "Renewal Date", "Locker"];
    const csv = [
      headers.join(","),
      ...rows.map((m: any) => [
        m.name, m.email || "", m.tier || "", m.status || "",
        m.monthlyRate || "", m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "",
        m.renewalDate ? new Date(m.renewalDate).toLocaleDateString() : "",
        m.lockerNumber || ""
      ].join(","))
    ].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "icc-members.csv";
    a.click();
    toast.success(`Exported ${rows.length} members`);
  };

  const handleBulkEmail = () => {
    if (selectedIds.size === 0) { toast.error("Select at least one member"); return; }
    bulkQueueEmails.mutate({ memberIds: Array.from(selectedIds), emailType: bulkEmailType });
  };

  return (
    <div className="space-y-5">
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
            onClick={exportCSV}
            className="flex items-center gap-2"
            style={{ background: "transparent", color: TEXT_DIM, border: `1px solid ${BORDER}`, fontSize: "0.75rem", fontWeight: 600, padding: "0.5rem 1rem", borderRadius: "0.25rem", cursor: "pointer" }}
          >
            <Download size={12} />
            Export CSV
          </button>
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

      {/* Bulk Action Toolbar — appears when members are selected */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded" style={{ background: "rgba(200,16,46,0.10)", border: "1px solid rgba(200,16,46,0.30)" }}>
          <span style={{ fontSize: "0.78rem", color: ICC_RED, fontWeight: 700 }}>{selectedIds.size} selected</span>
          <div className="flex items-center gap-2 ml-2">
            <select
              value={bulkEmailType}
              onChange={e => setBulkEmailType(e.target.value as any)}
              style={{ background: "#161616", border: `1px solid ${BORDER}`, color: TEXT, fontSize: "0.72rem", padding: "0.25rem 0.5rem", borderRadius: "0.2rem" }}
            >
              <option value="payment_reminder">Payment Reminder</option>
              <option value="win_back">Win-Back Email</option>
              <option value="general">General Outreach</option>
            </select>
            <button
              onClick={handleBulkEmail}
              disabled={bulkQueueEmails.isPending}
              className="flex items-center gap-1.5"
              style={{ background: ICC_RED, color: "white", fontSize: "0.72rem", fontWeight: 600, padding: "0.3rem 0.75rem", borderRadius: "0.2rem", border: "none", cursor: "pointer" }}
            >
              <Mail size={11} />
              {bulkQueueEmails.isPending ? "Queuing..." : "Queue Emails"}
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5"
              style={{ background: "transparent", color: TEXT_DIM, fontSize: "0.72rem", fontWeight: 600, padding: "0.3rem 0.75rem", borderRadius: "0.2rem", border: `1px solid ${BORDER}`, cursor: "pointer" }}
            >
              <Download size={11} />
              Export Selected
            </button>
          </div>
          <button onClick={() => setSelectedIds(new Set())} style={{ marginLeft: "auto", background: "none", border: "none", color: TEXT_DIM, cursor: "pointer", padding: "0.2rem" }}>
            <X size={14} />
          </button>
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
      <div className="rounded overflow-hidden table-scroll" style={{ border: `1px solid ${BORDER}` }}>
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
                <th className="px-4 py-3" style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    style={{ cursor: "pointer", accentColor: ICC_RED }}
                  />
                </th>
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
                const isSelected = selectedIds.has(m.id);
                return (
                  <tr
                    key={m.id}
                    className="border-b transition-colors"
                    style={{ borderColor: "#1E1E1E", background: isSelected ? "rgba(200,16,46,0.07)" : isDunning ? "rgba(234,179,8,0.04)" : i % 2 === 0 ? "#1C1C1C" : "#161616" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#222222")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = isSelected ? "rgba(200,16,46,0.07)" : isDunning ? "rgba(234,179,8,0.04)" : i % 2 === 0 ? "#1C1C1C" : "#161616")}
                  >
                    <td className="px-4 py-3" style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(m.id)}
                        style={{ cursor: "pointer", accentColor: ICC_RED }}
                      />
                    </td>
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
