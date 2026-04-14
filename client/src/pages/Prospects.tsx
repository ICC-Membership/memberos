import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Users, Plus, Edit2, Phone, Mail, ChevronRight, Zap, UserCheck, AlertTriangle, Filter, Star, Calendar, DollarSign, X } from "lucide-react";

const STATUSES = ["New", "Contacted", "Tour Scheduled", "Proposal Sent", "Closed Won", "Closed Lost"] as const;
const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  "New": { color: "#6B6560", bg: "rgba(107,101,96,0.12)" },
  "Contacted": { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  "Tour Scheduled": { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  "Proposal Sent": { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  "Closed Won": { color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  "Closed Lost": { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};
const TIERS = ["Visionary", "Atabey", "APEX"] as const;
const PRIORITY_COLORS: Record<string, { color: string; bg: string }> = {
  "High":   { color: "#C8102E", bg: "rgba(200,16,46,0.15)" },
  "Medium": { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  "Low":    { color: "#6B6560", bg: "rgba(107,101,96,0.12)" },
};
const SOURCES = ["Walk-in", "Referral", "Event", "Typeform", "Lightspeed", "Social Media", "Other"];

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#6B6560";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ flex: 1, height: 6, background: "rgba(245,240,235,0.08)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: "0.72rem", color, fontWeight: 700, minWidth: 28 }}>{score}</span>
    </div>
  );
}

const defaultForm = {
  id: undefined as number | undefined,
  name: "",
  email: "",
  phone: "",
  source: "Walk-in",
  interestedTier: "Visionary" as typeof TIERS[number],
  status: "New" as typeof STATUSES[number],
  referredBy: "",
  notes: "",
};

export default function Prospects() {
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState<any>(null);
  const [minVisits, setMinVisits] = useState(3);

  const { data: prospects = [], refetch } = trpc.prospects.list.useQuery();
  const { data: staffList = [] } = trpc.staff.list.useQuery();
  const { data: lsStatus } = trpc.lightspeed.status.useQuery();

  const importFromLightspeed = trpc.prospects.importFromLightspeed.useMutation({
    onSuccess: (r) => {
      refetch();
      if ("error" in r && r.error) toast.error(`Import failed: ${r.error}`);
      else toast.success(`Imported ${r.imported} new prospects (${r.skipped} skipped)`);
    },
    onError: () => toast.error("Import failed"),
  });

  const assignStaff = trpc.prospects.assignStaff.useMutation({
    onSuccess: () => { refetch(); setShowAssignModal(false); setAssignTarget(null); toast.success("Prospect assigned"); },
    onError: () => toast.error("Failed to assign"),
  });

  const bookTour = trpc.prospects.bookTour.useMutation({
    onSuccess: () => { refetch(); setSelectedProspect(null); toast.success("Tour booked — email draft queued"); },
  });

  const convertToMember = trpc.prospects.convertToMember.useMutation({
    onSuccess: (r) => {
      refetch(); setSelectedProspect(null); toast.success("Conversion email queued");
      if ("subscriptionUrl" in r) window.open(r.subscriptionUrl as string, "_blank");
    },
  });

  const advanceStatus = trpc.prospects.advanceStatus.useMutation({
    onSuccess: () => { refetch(); setSelectedProspect(null); toast.success("Status updated"); },
  });

  const upsertProspect = trpc.prospects.upsert.useMutation({
    onSuccess: () => { refetch(); setShowForm(false); setForm({ ...defaultForm }); toast.success("Prospect saved"); },
    onError: () => toast.error("Failed to save prospect"),
  });

  const openEdit = (p: any) => {
    setForm({ id: p.id, name: p.name, email: p.email || "", phone: p.phone || "", source: p.source || "Walk-in", interestedTier: p.interestedTier || "Visionary", status: p.status, referredBy: p.referredBy || "", notes: p.notes || "" });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertProspect.mutate(form as any);
  };

  let filtered = [...prospects];
  if (filterStatus !== "all") filtered = filtered.filter((p: any) => p.status === filterStatus);
  if (filterSource !== "all") filtered = filtered.filter((p: any) => p.source === filterSource);
  if (filterPriority !== "all") filtered = filtered.filter((p: any) => p.priority === filterPriority);
  filtered.sort((a: any, b: any) => {
    const pOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
    const pDiff = (pOrder[a.priority || "Medium"] ?? 1) - (pOrder[b.priority || "Medium"] ?? 1);
    if (pDiff !== 0) return pDiff;
    return (b.prospectScore || 0) - (a.prospectScore || 0);
  });

  const pipeline = STATUSES.reduce((acc, s) => {
    acc[s] = prospects.filter((p: any) => p.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const highPriority = prospects.filter((p: any) => p.priority === "High" && !["Closed Won", "Closed Lost"].includes(p.status));
  const unassigned = prospects.filter((p: any) => !p.assignedStaffId && !["Closed Won", "Closed Lost"].includes(p.status));
  const S = { color: "#F5F0EB" };
  const DIM = { color: "#6B6560" };
  const CARD = { background: "rgba(245,240,235,0.04)", border: "1px solid rgba(245,240,235,0.08)", borderRadius: "0.5rem", padding: "1rem" };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Users size={28} color="#C8102E" />
          <div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", color: "#F5F0EB", letterSpacing: "0.04em", margin: 0 }}>PROSPECT PIPELINE</h1>
            <p style={{ color: "#6B6560", fontSize: "0.82rem", margin: 0 }}>Ranked by visits/month + spend/visit · Threshold: 3+ visits/mo &amp; $50+/visit</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {isAuthenticated && (
            <button
              onClick={() => importFromLightspeed.mutate({ minVisitsPerMonth: minVisits, minSpendPerVisitCents: 5000 })}
              disabled={importFromLightspeed.isPending}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "0.25rem", background: "rgba(196,163,90,0.12)", color: "#C4A35A", border: "1px solid rgba(196,163,90,0.3)", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}
            >
              <Zap size={14} /> {importFromLightspeed.isPending ? "Scanning..." : "Import from Lightspeed"}
            </button>
          )}
          {isAuthenticated && (
            <button onClick={() => { setForm({ ...defaultForm }); setShowForm(true); }} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "0.25rem", background: "#C8102E", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.82rem" }}>
              <Plus size={14} /> Add Prospect
            </button>
          )}
        </div>
      </div>

      {/* Alert Banners */}
      {highPriority.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: "rgba(200,16,46,0.08)", border: "1px solid rgba(200,16,46,0.2)", borderRadius: "0.5rem", marginBottom: "1rem" }}>
          <AlertTriangle size={16} color="#C8102E" />
          <span style={{ color: "#F5F0EB", fontSize: "0.82rem" }}><strong style={{ color: "#C8102E" }}>{highPriority.length} high-priority</strong> prospects need follow-up</span>
        </div>
      )}
      {unassigned.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "0.5rem", marginBottom: "1rem" }}>
          <UserCheck size={16} color="#f59e0b" />
          <span style={{ color: "#F5F0EB", fontSize: "0.82rem" }}><strong style={{ color: "#f59e0b" }}>{unassigned.length} prospects</strong> not yet assigned to a staff member</span>
        </div>
      )}

      {/* Pipeline Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "0.5rem", marginBottom: "2rem" }}>
        {STATUSES.map(s => {
          const cfg = STATUS_COLORS[s];
          return (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? "all" : s)} style={{ padding: "0.75rem 0.5rem", borderRadius: "0.375rem", background: filterStatus === s ? cfg.bg : "rgba(245,240,235,0.03)", border: `1px solid ${filterStatus === s ? cfg.color : "rgba(245,240,235,0.08)"}`, cursor: "pointer", textAlign: "center" }}>
              <div style={{ color: cfg.color, fontSize: "1.4rem", fontWeight: 800 }}>{pipeline[s] || 0}</div>
              <div style={{ color: "#6B6560", fontSize: "0.65rem", lineHeight: 1.2 }}>{s}</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "0.4rem 0.75rem", background: "#1A1614", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.25rem", color: filterStatus !== "all" ? "#F5F0EB" : "#6B6560", fontSize: "0.78rem", cursor: "pointer" }}>
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={{ padding: "0.4rem 0.75rem", background: "#1A1614", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.25rem", color: filterSource !== "all" ? "#F5F0EB" : "#6B6560", fontSize: "0.78rem", cursor: "pointer" }}>
          <option value="all">All Sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ padding: "0.4rem 0.75rem", background: "#1A1614", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.25rem", color: filterPriority !== "all" ? "#F5F0EB" : "#6B6560", fontSize: "0.78rem", cursor: "pointer" }}>
          <option value="all">All Priorities</option>
          <option value="High">🔴 High</option>
          <option value="Medium">🟡 Medium</option>
          <option value="Low">⚪ Low</option>
        </select>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", color: "#6B6560", fontSize: "0.75rem" }}>{filtered.length} prospect{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Ranked Prospect Cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#6B6560" }}>
          <Users size={48} style={{ marginBottom: "1rem", opacity: 0.3 }} />
          <p style={{ fontSize: "1rem" }}>No prospects {filterStatus !== "all" ? `with status "${filterStatus}"` : "yet"}.</p>
          {filterSource === "all" && filterStatus === "all" && (
            <p style={{ fontSize: "0.82rem" }}>Click “Import from Lightspeed” to auto-pull frequent visitors (3+/mo, $50+/visit) or add prospects manually.</p>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {filtered.map((p: any, idx: number) => {
            const cfg = STATUS_COLORS[p.status] || STATUS_COLORS["New"];
            const pCfg = PRIORITY_COLORS[p.priority || "Medium"];
            const spendPerVisit = p.visitCount > 0 ? Math.round((p.totalSpend || 0) / p.visitCount / 100) : 0;
            const isLightspeed = p.source === "Lightspeed";
            return (
              <div
                key={p.id}
                onClick={() => setSelectedProspect(p)}
                style={{ background: "#1A1614", border: `1px solid ${p.priority === "High" ? "rgba(200,16,46,0.2)" : "rgba(245,240,235,0.08)"}`, borderRadius: "0.5rem", padding: "1rem 1.25rem", cursor: "pointer", transition: "border-color 0.15s" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  {/* Rank badge */}
                  <div style={{ minWidth: 32, textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "#6B6560", letterSpacing: "0.08em" }}>#{idx + 1}</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: (p.prospectScore || 0) >= 70 ? "#22c55e" : (p.prospectScore || 0) >= 45 ? "#f59e0b" : "#6B6560" }}>{p.prospectScore || 0}</div>
                  </div>
                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                      <span style={{ color: "#F5F0EB", fontSize: "0.95rem", fontWeight: 700 }}>{p.name}</span>
                      <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", borderRadius: "0.2rem", background: pCfg.bg, color: pCfg.color, fontWeight: 700 }}>{p.priority || "Medium"}</span>
                      <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", borderRadius: "0.2rem", background: cfg.bg, color: cfg.color, fontWeight: 600 }}>{p.status}</span>
                      {isLightspeed && <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", borderRadius: "0.2rem", background: "rgba(196,163,90,0.12)", color: "#C4A35A" }}>Lightspeed</span>}
                      {p.source && !isLightspeed && <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", borderRadius: "0.2rem", background: "rgba(245,240,235,0.06)", color: "#6B6560" }}>{p.source}</span>}
                    </div>
                    {/* Contact info row */}
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
                      {p.phone && (
                        <a href={`tel:${p.phone}`} onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#A09890", fontSize: "0.78rem", textDecoration: "none" }}>
                          <Phone size={11} color="#C8102E" /> {p.phone}
                        </a>
                      )}
                      {p.email && (
                        <a href={`mailto:${p.email}`} onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#A09890", fontSize: "0.78rem", textDecoration: "none" }}>
                          <Mail size={11} color="#C8102E" /> {p.email}
                        </a>
                      )}
                      {!p.phone && !p.email && <span style={{ color: "#6B6560", fontSize: "0.75rem", fontStyle: "italic" }}>No contact info</span>}
                    </div>
                    {/* Lightspeed stats */}
                    {isLightspeed && p.visitCount > 0 && (
                      <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.75rem", color: "#6B6560" }}>
                          <span style={{ color: "#C4A35A", fontWeight: 700 }}>{p.visitCount}</span> visits/mo
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#6B6560" }}>
                          <span style={{ color: "#22c55e", fontWeight: 700 }}>${spendPerVisit}</span>/visit avg
                        </span>
                        {p.totalSpend > 0 && (
                          <span style={{ fontSize: "0.75rem", color: "#6B6560" }}>
                            90-day total: <span style={{ color: "#F5F0EB" }}>${(p.totalSpend / 100).toFixed(0)}</span>
                          </span>
                        )}
                      </div>
                    )}
                    {p.assignedStaffName && (
                      <div style={{ marginTop: "0.3rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <UserCheck size={11} color="#3b82f6" />
                        <span style={{ fontSize: "0.72rem", color: "#3b82f6" }}>Assigned: {p.assignedStaffName}</span>
                      </div>
                    )}
                  </div>
                  {/* Score bar (right side) */}
                  <div style={{ minWidth: 100 }}>
                    <ScoreBar score={p.prospectScore || 0} />
                    <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.5rem", justifyContent: "flex-end" }}>
                      {isAuthenticated && p.status !== "Tour Scheduled" && p.status !== "Closed Won" && (
                        <button onClick={e => { e.stopPropagation(); bookTour.mutate({ id: p.id, name: p.name, email: p.email || undefined, phone: p.phone || undefined, tier: p.interestedTier || undefined }); }} disabled={bookTour.isPending} style={{ padding: "0.2rem 0.45rem", borderRadius: "0.2rem", background: "rgba(196,163,90,0.15)", color: "#C4A35A", border: "1px solid rgba(196,163,90,0.3)", cursor: "pointer", fontSize: "0.65rem", fontWeight: 600 }}>Tour</button>
                      )}
                      {isAuthenticated && (
                        <button onClick={e => { e.stopPropagation(); openEdit(p); }} style={{ background: "none", border: "none", color: "#6B6560", cursor: "pointer", padding: "0.2rem" }}><Edit2 size={12} /></button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedProspect && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }} onClick={() => setSelectedProspect(null)}>
          <div style={{ background: "#1A1614", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.75rem", padding: "1.5rem", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: "#F5F0EB", margin: 0, letterSpacing: "0.04em" }}>{selectedProspect.name}</h2>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.72rem", padding: "0.15rem 0.5rem", borderRadius: "0.2rem", background: PRIORITY_COLORS[selectedProspect.priority || "Medium"].bg, color: PRIORITY_COLORS[selectedProspect.priority || "Medium"].color, fontWeight: 700 }}>{selectedProspect.priority || "Medium"} Priority</span>
                  <span style={{ fontSize: "0.72rem", padding: "0.15rem 0.5rem", borderRadius: "0.2rem", background: STATUS_COLORS[selectedProspect.status].bg, color: STATUS_COLORS[selectedProspect.status].color, fontWeight: 600 }}>{selectedProspect.status}</span>
                  {selectedProspect.source && <span style={{ fontSize: "0.72rem", padding: "0.15rem 0.5rem", borderRadius: "0.2rem", background: "rgba(245,240,235,0.06)", color: "#6B6560" }}>{selectedProspect.source}</span>}
                </div>
              </div>
              <button onClick={() => setSelectedProspect(null)} style={{ background: "transparent", border: "none", color: "#6B6560", cursor: "pointer", padding: "0.25rem" }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.72rem", color: "#6B6560", letterSpacing: "0.08em" }}>PROSPECT SCORE</span>
                <span style={{ fontSize: "0.72rem", color: "#6B6560" }}>{(selectedProspect.prospectScore || 0) >= 70 ? "🔥 Hot" : (selectedProspect.prospectScore || 0) >= 40 ? "⚡ Warm" : "❄️ Cold"}</span>
              </div>
              <ScoreBar score={selectedProspect.prospectScore || 0} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              {selectedProspect.email && (
                <a href={`mailto:${selectedProspect.email}`} style={{ background: "rgba(245,240,235,0.04)", border: "1px solid rgba(245,240,235,0.08)", borderRadius: "0.5rem", padding: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
                  <Mail size={14} color="#C8102E" />
                  <span style={{ fontSize: "0.78rem", color: "#F5F0EB", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedProspect.email}</span>
                </a>
              )}
              {selectedProspect.phone && (
                <a href={`tel:${selectedProspect.phone}`} style={{ background: "rgba(245,240,235,0.04)", border: "1px solid rgba(245,240,235,0.08)", borderRadius: "0.5rem", padding: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
                  <Phone size={14} color="#C8102E" />
                  <span style={{ fontSize: "0.78rem", color: "#F5F0EB" }}>{selectedProspect.phone}</span>
                </a>
              )}
            </div>
            {(selectedProspect.visitCount > 0 || selectedProspect.totalSpend > 0) && (
              <div style={{ background: "rgba(245,240,235,0.04)", border: "1px solid rgba(245,240,235,0.08)", borderRadius: "0.5rem", padding: "1rem", marginBottom: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.68rem", color: "#6B6560", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>VISITS (90 DAYS)</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#F5F0EB" }}>{selectedProspect.visitCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.68rem", color: "#6B6560", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>TOTAL SPEND</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#22c55e" }}>${((selectedProspect.totalSpend || 0) / 100).toFixed(0)}</div>
                </div>
              </div>
            )}
            {selectedProspect.assignedStaffName && (
              <div style={{ background: "rgba(245,240,235,0.04)", border: "1px solid rgba(245,240,235,0.08)", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <UserCheck size={14} color="#3b82f6" />
                <span style={{ fontSize: "0.82rem", color: "#F5F0EB" }}>Assigned to <strong>{selectedProspect.assignedStaffName}</strong></span>
              </div>
            )}
            {selectedProspect.notes && (
              <div style={{ background: "rgba(245,240,235,0.04)", border: "1px solid rgba(245,240,235,0.08)", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.68rem", color: "#6B6560", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>NOTES</div>
                <p style={{ fontSize: "0.82rem", color: "#F5F0EB", margin: 0, lineHeight: 1.5 }}>{selectedProspect.notes}</p>
              </div>
            )}
            {isAuthenticated && (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {selectedProspect.status !== "Tour Scheduled" && selectedProspect.status !== "Closed Won" && (
                  <button onClick={() => bookTour.mutate({ id: selectedProspect.id, name: selectedProspect.name, email: selectedProspect.email, phone: selectedProspect.phone, tier: selectedProspect.interestedTier })} disabled={bookTour.isPending} style={{ flex: 1, padding: "0.6rem", background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                    <Calendar size={14} /> Book Tour
                  </button>
                )}
                {selectedProspect.status !== "Closed Won" && (
                  <button onClick={() => convertToMember.mutate({ id: selectedProspect.id, name: selectedProspect.name, email: selectedProspect.email, tier: selectedProspect.interestedTier })} disabled={convertToMember.isPending} style={{ flex: 1, padding: "0.6rem", background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                    <Star size={14} /> Convert to Member
                  </button>
                )}
                <button onClick={() => { setAssignTarget(selectedProspect); setShowAssignModal(true); setSelectedProspect(null); }} style={{ padding: "0.6rem 1rem", background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <UserCheck size={14} /> Assign Staff
                </button>
                <button onClick={() => { openEdit(selectedProspect); setSelectedProspect(null); }} style={{ padding: "0.6rem 1rem", background: "rgba(245,240,235,0.06)", color: "#6B6560", border: "1px solid rgba(245,240,235,0.1)", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Edit2 size={14} /> Edit
                </button>
              </div>
            )}
            {isAuthenticated && !["Closed Won", "Closed Lost"].includes(selectedProspect.status) && (
              <div style={{ marginTop: "1rem", borderTop: "1px solid rgba(245,240,235,0.08)", paddingTop: "1rem" }}>
                <div style={{ fontSize: "0.68rem", color: "#6B6560", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>ADVANCE STATUS</div>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {STATUSES.filter(s => s !== selectedProspect.status).map(s => (
                    <button key={s} onClick={() => advanceStatus.mutate({ id: selectedProspect.id, status: s })} style={{ padding: "0.3rem 0.6rem", background: STATUS_COLORS[s].bg, color: STATUS_COLORS[s].color, border: `1px solid ${STATUS_COLORS[s].color}30`, borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600 }}>
                      → {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showAssignModal && assignTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem" }} onClick={() => { setShowAssignModal(false); setAssignTarget(null); }}>
          <div style={{ background: "#1A1614", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.75rem", padding: "1.5rem", width: "100%", maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.25rem", color: "#F5F0EB", margin: "0 0 0.25rem", letterSpacing: "0.04em" }}>ASSIGN STAFF</h3>
            <p style={{ color: "#6B6560", fontSize: "0.82rem", margin: "0 0 1.25rem" }}>Assign <strong style={{ color: "#F5F0EB" }}>{assignTarget.name}</strong> to a staff member for follow-up</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {(staffList as any[]).filter((s: any) => s.isActive).map((s: any) => (
                <button key={s.id} onClick={() => assignStaff.mutate({ id: assignTarget.id, staffId: s.id, staffName: s.name })} disabled={assignStaff.isPending} style={{ padding: "0.75rem 1rem", background: "rgba(245,240,235,0.04)", border: "1px solid rgba(245,240,235,0.1)", borderRadius: "0.4rem", color: "#F5F0EB", cursor: "pointer", textAlign: "left", fontSize: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{s.name}</span>
                  <span style={{ fontSize: "0.72rem", color: "#6B6560" }}>{s.role || "Staff"}</span>
                </button>
              ))}
              {(staffList as any[]).filter((s: any) => s.isActive).length === 0 && (
                <p style={{ color: "#6B6560", fontSize: "0.82rem", textAlign: "center" }}>No active staff found. Add staff in the Commission page.</p>
              )}
            </div>
            <button onClick={() => { setShowAssignModal(false); setAssignTarget(null); }} style={{ marginTop: "1rem", width: "100%", padding: "0.5rem", background: "transparent", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.25rem", color: "#6B6560", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }} onClick={() => setShowForm(false)}>
          <div style={{ background: "#1A1614", border: "1px solid rgba(200,16,46,0.25)", borderRadius: "0.75rem", padding: "2rem", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: "#F5F0EB", margin: 0 }}>{form.id ? "EDIT PROSPECT" : "ADD PROSPECT"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "transparent", border: "none", color: "#6B6560", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ color: "#6B6560", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>FULL NAME *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required style={{ width: "100%", padding: "0.6rem 0.75rem", background: "rgba(245,240,235,0.05)", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.25rem", color: "#F5F0EB", fontSize: "0.9rem", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ color: "#6B6560", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>EMAIL</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={{ width: "100%", padding: "0.6rem 0.75rem", background: "rgba(245,240,235,0.05)", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.25rem", color: "#F5F0EB", fontSize: "0.85rem", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ color: "#6B6560", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>PHONE</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={{ width: "100%", padding: "0.6rem 0.75rem", background: "rgba(245,240,235,0.05)", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.25rem", color: "#F5F0EB", fontSize: "0.85rem", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ color: "#6B6560", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>TIER INTEREST</label>
                  <select value={form.interestedTier} onChange={e => setForm(f => ({ ...f, interestedTier: e.target.value as any }))} style={{ width: "100%", padding: "0.6rem 0.75rem", background: "#1A1614", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.25rem", color: "#F5F0EB", fontSize: "0.85rem" }}>
                    {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: "#6B6560", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>SOURCE</label>
                  <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} style={{ width: "100%", padding: "0.6rem 0.75rem", background: "#1A1614", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.25rem", color: "#F5F0EB", fontSize: "0.85rem" }}>
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ color: "#6B6560", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>STATUS</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))} style={{ width: "100%", padding: "0.6rem 0.75rem", background: "#1A1614", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.25rem", color: "#F5F0EB", fontSize: "0.85rem" }}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: "#6B6560", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>REFERRED BY</label>
                  <input value={form.referredBy} onChange={e => setForm(f => ({ ...f, referredBy: e.target.value }))} style={{ width: "100%", padding: "0.6rem 0.75rem", background: "rgba(245,240,235,0.05)", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.25rem", color: "#F5F0EB", fontSize: "0.85rem", boxSizing: "border-box" }} />
                </div>
              </div>
              <div>
                <label style={{ color: "#6B6560", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>NOTES</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ width: "100%", padding: "0.6rem 0.75rem", background: "rgba(245,240,235,0.05)", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.25rem", color: "#F5F0EB", fontSize: "0.85rem", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.25rem", background: "transparent", color: "#6B6560", border: "1px solid rgba(245,240,235,0.12)", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={upsertProspect.isPending} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.25rem", background: "#C8102E", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>
                  {upsertProspect.isPending ? "Saving..." : "Save Prospect"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
