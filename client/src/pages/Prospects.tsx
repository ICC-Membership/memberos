import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Users, Plus, Edit2, Phone, Mail, ChevronRight, Zap, UserPlus, RefreshCw } from "lucide-react";

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
const SOURCES = ["Walk-in", "Referral", "Event", "Typeform", "Social Media", "Other"];

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

  const [showLightspeed, setShowLightspeed] = useState(false);
  const { data: prospects = [], refetch } = trpc.prospects.list.useQuery();
  const { data: lsStatus } = trpc.lightspeed.status.useQuery();
  const { data: lsProspects, isLoading: lsLoading, refetch: refetchLs } = trpc.lightspeed.prospects.useQuery(
    { minVisits: 3 },
    { enabled: showLightspeed && !!lsStatus?.connected }
  );
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

  const filtered = filterStatus === "all" ? prospects : prospects.filter((p: any) => p.status === filterStatus);

  // Pipeline counts
  const pipeline = STATUSES.reduce((acc, s) => {
    acc[s] = prospects.filter((p: any) => p.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ padding: "2rem", maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Users size={28} color="#C8102E" />
          <div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", color: "#F5F0EB", letterSpacing: "0.04em", margin: 0 }}>PROSPECT PIPELINE</h1>
            <p style={{ color: "#6B6560", fontSize: "0.82rem", margin: 0 }}>Track every lead from inquiry to membership close</p>
          </div>
        </div>
        {isAuthenticated && (
          <button onClick={() => { setForm({ ...defaultForm }); setShowForm(true); }} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "0.25rem", background: "#C8102E", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.82rem" }}>
            <Plus size={14} /> Add Prospect
          </button>
        )}
      </div>

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

      {/* Prospects Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#6B6560" }}>
          <Users size={48} style={{ marginBottom: "1rem", opacity: 0.3 }} />
          <p style={{ fontSize: "1rem" }}>No prospects {filterStatus !== "all" ? `with status "${filterStatus}"` : "yet"}.</p>
          <p style={{ fontSize: "0.82rem" }}>Add prospects from Typeform inquiries, walk-ins, or referrals.</p>
        </div>
      ) : (
        <div style={{ background: "#1A1614", border: "1px solid rgba(245,240,235,0.08)", borderRadius: "0.5rem", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(245,240,235,0.08)" }}>
                {["Name", "Contact", "Tier Interest", "Source", "Referred By", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#6B6560", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => {
                const cfg = STATUS_COLORS[p.status] || STATUS_COLORS["New"];
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid rgba(245,240,235,0.05)" }}>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <div style={{ color: "#F5F0EB", fontSize: "0.9rem", fontWeight: 600 }}>{p.name}</div>
                      {p.notes && <div style={{ color: "#6B6560", fontSize: "0.75rem", marginTop: 2 }}>{p.notes.slice(0, 40)}{p.notes.length > 40 ? "…" : ""}</div>}
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      {p.email && <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#6B6560", fontSize: "0.78rem" }}><Mail size={11} />{p.email}</div>}
                      {p.phone && <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#6B6560", fontSize: "0.78rem" }}><Phone size={11} />{p.phone}</div>}
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <span style={{ padding: "0.2rem 0.5rem", borderRadius: "0.2rem", background: p.interestedTier === "APEX" ? "rgba(200,16,46,0.15)" : "rgba(245,240,235,0.06)", color: p.interestedTier === "APEX" ? "#C8102E" : "#A09890", fontSize: "0.75rem", fontWeight: 600 }}>
                        {p.interestedTier || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "0.875rem 1rem", color: "#6B6560", fontSize: "0.82rem" }}>{p.source || "—"}</td>
                    <td style={{ padding: "0.875rem 1rem", color: "#6B6560", fontSize: "0.82rem" }}>{p.referredBy || "—"}</td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <span style={{ padding: "0.2rem 0.6rem", borderRadius: "0.2rem", background: cfg.bg, color: cfg.color, fontSize: "0.72rem", fontWeight: 600 }}>{p.status}</span>
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      {isAuthenticated && (
                        <button onClick={() => openEdit(p)} style={{ background: "none", border: "none", color: "#6B6560", cursor: "pointer", padding: "0.25rem" }}><Edit2 size={14} /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Lightspeed Prospect Finder */}
      <div style={{ marginTop: "2rem", borderTop: "1px solid rgba(245,240,235,0.08)", paddingTop: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Zap size={16} color="#C4A35A" />
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", letterSpacing: "0.08em", color: "#E8E4DC" }}>LIGHTSPEED PROSPECT FINDER</span>
            {lsStatus?.connected && <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", borderRadius: "0.2rem", background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>CONNECTED</span>}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {lsStatus?.connected && showLightspeed && (
              <button onClick={() => refetchLs()} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.35rem 0.75rem", borderRadius: "0.25rem", background: "transparent", color: "#6B6560", border: "1px solid rgba(245,240,235,0.12)", cursor: "pointer", fontSize: "0.75rem" }}>
                <RefreshCw size={12} /> Refresh
              </button>
            )}
            <button
              onClick={() => setShowLightspeed(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.35rem 0.75rem", borderRadius: "0.25rem", background: showLightspeed ? "rgba(196,163,90,0.15)" : "transparent", color: "#C4A35A", border: "1px solid rgba(196,163,90,0.3)", cursor: "pointer", fontSize: "0.75rem" }}
            >
              {showLightspeed ? "Hide" : "Find Prospects from POS"}
            </button>
          </div>
        </div>
        {showLightspeed && (
          !lsStatus?.connected ? (
            <div style={{ padding: "2rem", textAlign: "center", background: "rgba(245,240,235,0.03)", borderRadius: "0.5rem", border: "1px dashed rgba(196,163,90,0.25)" }}>
              <Zap size={24} style={{ color: "#C4A35A", marginBottom: "0.75rem", opacity: 0.5 }} />
              <p style={{ color: "#6B6560", fontSize: "0.85rem", marginBottom: "0.75rem" }}>Connect Lightspeed to automatically identify frequent POS visitors who aren't members yet.</p>
              <a href="/api/lightspeed/connect" style={{ padding: "0.5rem 1.25rem", borderRadius: "0.25rem", background: "#C4A35A", color: "#0A0A0A", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" }}>Connect Lightspeed →</a>
            </div>
          ) : lsLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", gap: "0.75rem", color: "#6B6560" }}>
              <RefreshCw size={16} className="animate-spin" />
              <span style={{ fontSize: "0.82rem" }}>Scanning POS data for frequent visitors not yet members...</span>
            </div>
          ) : (lsProspects?.prospects || []).length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#6B6560", fontSize: "0.82rem" }}>No frequent visitors found who aren't already members. Try lowering the minimum visits threshold.</div>
          ) : (
            <div style={{ background: "#1A1614", border: "1px solid rgba(196,163,90,0.2)", borderRadius: "0.5rem", overflow: "hidden" }}>
              <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(245,240,235,0.06)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: "#C4A35A", fontSize: "0.78rem", fontWeight: 600 }}>{(lsProspects?.prospects || []).length} frequent visitors found — not yet members</span>
                <span style={{ color: "#6B6560", fontSize: "0.72rem" }}>(3+ visits in last 90 days)</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(245,240,235,0.06)" }}>
                    {["Name", "Email", "Visits (90d)", "Spend (90d)", "Last Visit", ""].map(h => (
                      <th key={h} style={{ padding: "0.6rem 1rem", textAlign: "left", color: "#6B6560", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(lsProspects?.prospects || []).map((p: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(245,240,235,0.04)" }}>
                      <td style={{ padding: "0.75rem 1rem", color: "#E8E4DC", fontSize: "0.85rem", fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: "0.75rem 1rem", color: "#6B6560", fontSize: "0.78rem" }}>{p.email || "—"}</td>
                      <td style={{ padding: "0.75rem 1rem" }}><span style={{ color: "#C4A35A", fontWeight: 700, fontSize: "0.9rem" }}>{p.visits}</span></td>
                      <td style={{ padding: "0.75rem 1rem", color: "#22c55e", fontSize: "0.82rem" }}>${p.spend.toFixed(0)}</td>
                      <td style={{ padding: "0.75rem 1rem", color: "#6B6560", fontSize: "0.75rem" }}>{new Date(p.lastVisit).toLocaleDateString()}</td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <button
                          onClick={() => {
                            setForm({ ...defaultForm, name: p.name, email: p.email || "", phone: p.phone || "", source: "Walk-in", notes: `${p.visits} visits in last 90 days · $${p.spend.toFixed(0)} spend` });
                            setShowForm(true);
                          }}
                          style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.3rem 0.6rem", borderRadius: "0.2rem", background: "rgba(200,16,46,0.12)", color: "#C8102E", border: "1px solid rgba(200,16,46,0.25)", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600 }}
                        >
                          <UserPlus size={11} /> Add to Pipeline
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div style={{ background: "#1A1614", border: "1px solid rgba(200,16,46,0.25)", borderRadius: "0.75rem", padding: "2rem", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: "#F5F0EB", marginBottom: "1.5rem" }}>{form.id ? "EDIT PROSPECT" : "ADD PROSPECT"}</h2>
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
