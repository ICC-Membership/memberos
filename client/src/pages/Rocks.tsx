import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Target, Plus, Edit2, Trash2, ExternalLink, CheckCircle, AlertCircle, Clock, XCircle } from "lucide-react";

const STATUS_CONFIG = {
  "On Track": { color: "#22c55e", icon: CheckCircle, bg: "rgba(34,197,94,0.12)" },
  "Off Track": { color: "#ef4444", icon: AlertCircle, bg: "rgba(239,68,68,0.12)" },
  "Done": { color: "#C8102E", icon: CheckCircle, bg: "rgba(200,16,46,0.12)" },
  "Not Started": { color: "#6B6560", icon: Clock, bg: "rgba(107,101,96,0.12)" },
};

const QUARTERS = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"];

const defaultForm = {
  id: undefined as number | undefined,
  title: "",
  description: "",
  owner: "Andrew Frakes",
  quarter: "Q1 2026",
  status: "Not Started" as "On Track" | "Off Track" | "Done" | "Not Started",
  progressPct: 0,
  ninetyUrl: "",
};

export default function Rocks() {
  const { isAuthenticated } = useAuth();
  const [selectedQuarter, setSelectedQuarter] = useState("Q1 2026");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });

  const { data: rocks = [], refetch } = trpc.rocks.list.useQuery({ quarter: selectedQuarter });
  const upsertRock = trpc.rocks.upsert.useMutation({
    onSuccess: () => { refetch(); setShowForm(false); setForm({ ...defaultForm }); toast.success("Rock saved"); },
    onError: () => toast.error("Failed to save rock"),
  });
  const deleteRock = trpc.rocks.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Rock deleted"); },
    onError: () => toast.error("Failed to delete rock"),
  });

  const openEdit = (rock: any) => {
    setForm({
      id: rock.id,
      title: rock.title,
      description: rock.description || "",
      owner: rock.owner || "Andrew Frakes",
      quarter: rock.quarter || "Q1 2026",
      status: rock.status,
      progressPct: rock.progressPct || 0,
      ninetyUrl: rock.ninetyUrl || "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertRock.mutate(form as any);
  };

  // Seed Q1 Rocks if none exist
  const seedRocks = () => {
    const q1Rocks = [
      { title: "Grow membership from 135 → 150 members", description: "Execute prospect outreach, staff referral program, and event-driven acquisition to reach 150 active members by April 1, 2026.", owner: "Andrew Frakes", quarter: "Q1 2026", status: "On Track" as const, progressPct: 45, ninetyUrl: "" },
      { title: "Fully define and document the membership program with visuals and internal training", description: "Complete the membership program documentation including tier benefits, visual assets, onboarding materials, and staff training guide.", owner: "Andrew Frakes", quarter: "Q1 2026", status: "Not Started" as const, progressPct: 20, ninetyUrl: "" },
      { title: "Complete membership ecosystem training and roll out commission plan", description: "Train all staff on the full membership ecosystem, finalize the 2026 commission plan, and ensure all team members understand attribution and payout structure.", owner: "Andrew Frakes", quarter: "Q1 2026", status: "Not Started" as const, progressPct: 10, ninetyUrl: "" },
    ];
    q1Rocks.forEach(r => upsertRock.mutate(r));
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Target size={28} color="#C8102E" />
          <div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", color: "#F5F0EB", letterSpacing: "0.04em", margin: 0 }}>EOS ROCKS</h1>
            <p style={{ color: "#6B6560", fontSize: "0.82rem", margin: 0 }}>Quarterly priorities — synced with Ninety.io</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {rocks.length === 0 && (
            <button onClick={seedRocks} style={{ padding: "0.5rem 1rem", borderRadius: "0.25rem", background: "rgba(200,16,46,0.08)", color: "#C8102E", border: "1px solid rgba(200,16,46,0.25)", cursor: "pointer", fontSize: "0.8rem" }}>
              Load Q1 Rocks
            </button>
          )}
          {isAuthenticated && (
            <button onClick={() => { setForm({ ...defaultForm }); setShowForm(true); }} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "0.25rem", background: "#C8102E", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.82rem" }}>
              <Plus size={14} /> Add Rock
            </button>
          )}
        </div>
      </div>

      {/* Quarter Selector */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
        {QUARTERS.map(q => (
          <button key={q} onClick={() => setSelectedQuarter(q)} style={{ padding: "0.4rem 1rem", borderRadius: "0.25rem", background: selectedQuarter === q ? "#C8102E" : "rgba(200,16,46,0.08)", color: selectedQuarter === q ? "#fff" : "#C8102E", border: `1px solid ${selectedQuarter === q ? "#C8102E" : "rgba(200,16,46,0.25)"}`, cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
            {q}
          </button>
        ))}
      </div>

      {/* Annual Target Banner */}
      <div style={{ background: "rgba(200,16,46,0.06)", border: "1px solid rgba(200,16,46,0.20)", borderRadius: "0.5rem", padding: "1rem 1.5rem", marginBottom: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ color: "#C8102E", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", letterSpacing: "0.08em", margin: 0 }}>ANNUAL TARGET</p>
          <p style={{ color: "#F5F0EB", fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>200 Members by December 31, 2026</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: "#6B6560", fontSize: "0.75rem", margin: 0 }}>Current</p>
          <p style={{ color: "#F5F0EB", fontSize: "2rem", fontWeight: 800, margin: 0 }}>135 <span style={{ color: "#6B6560", fontSize: "1rem" }}>/ 200</span></p>
        </div>
      </div>

      {/* Rocks List */}
      {rocks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#6B6560" }}>
          <Target size={48} style={{ marginBottom: "1rem", opacity: 0.3 }} />
          <p style={{ fontSize: "1rem" }}>No rocks for {selectedQuarter} yet.</p>
          <p style={{ fontSize: "0.82rem" }}>Click "Load Q1 Rocks" to seed your Q1 2026 goals, or add a new rock.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {rocks.map((rock: any, i: number) => {
            const cfg = STATUS_CONFIG[rock.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG["Not Started"];
            const Icon = cfg.icon;
            return (
              <div key={rock.id} style={{ background: "#1A1614", border: "1px solid rgba(245,240,235,0.08)", borderRadius: "0.5rem", padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", flex: 1 }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: "#C8102E", minWidth: 28 }}>R{i + 1}</span>
                    <div>
                      <h3 style={{ color: "#F5F0EB", fontSize: "1rem", fontWeight: 600, margin: "0 0 0.25rem" }}>{rock.title}</h3>
                      {rock.description && <p style={{ color: "#6B6560", fontSize: "0.82rem", margin: 0 }}>{rock.description}</p>}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "1rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.6rem", borderRadius: "0.25rem", background: cfg.bg, color: cfg.color, fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                      <Icon size={12} /> {rock.status}
                    </span>
                    {rock.ninetyUrl && (
                      <a href={rock.ninetyUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#6B6560", padding: "0.25rem" }}>
                        <ExternalLink size={14} />
                      </a>
                    )}
                    {isAuthenticated && (
                      <>
                        <button onClick={() => openEdit(rock)} style={{ background: "none", border: "none", color: "#6B6560", cursor: "pointer", padding: "0.25rem" }}><Edit2 size={14} /></button>
                        <button onClick={() => deleteRock.mutate({ id: rock.id })} style={{ background: "none", border: "none", color: "#6B6560", cursor: "pointer", padding: "0.25rem" }}><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                </div>
                {/* Progress Bar */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ flex: 1, height: 6, background: "rgba(245,240,235,0.08)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${rock.progressPct || 0}%`, background: "#C8102E", borderRadius: 3, transition: "width 0.3s" }} />
                  </div>
                  <span style={{ color: "#C8102E", fontSize: "0.78rem", fontWeight: 700, minWidth: 36 }}>{rock.progressPct || 0}%</span>
                  <span style={{ color: "#6B6560", fontSize: "0.75rem" }}>{rock.owner}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#1A1614", border: "1px solid rgba(200,16,46,0.25)", borderRadius: "0.75rem", padding: "2rem", width: "100%", maxWidth: 520 }}>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: "#F5F0EB", marginBottom: "1.5rem" }}>{form.id ? "EDIT ROCK" : "ADD ROCK"}</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ color: "#6B6560", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>ROCK TITLE *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required style={{ width: "100%", padding: "0.6rem 0.75rem", background: "rgba(245,240,235,0.05)", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.25rem", color: "#F5F0EB", fontSize: "0.9rem", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ color: "#6B6560", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>DESCRIPTION</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ width: "100%", padding: "0.6rem 0.75rem", background: "rgba(245,240,235,0.05)", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.25rem", color: "#F5F0EB", fontSize: "0.85rem", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ color: "#6B6560", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>QUARTER</label>
                  <select value={form.quarter} onChange={e => setForm(f => ({ ...f, quarter: e.target.value }))} style={{ width: "100%", padding: "0.6rem 0.75rem", background: "#1A1614", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.25rem", color: "#F5F0EB", fontSize: "0.85rem" }}>
                    {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: "#6B6560", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>STATUS</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))} style={{ width: "100%", padding: "0.6rem 0.75rem", background: "#1A1614", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.25rem", color: "#F5F0EB", fontSize: "0.85rem" }}>
                    {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ color: "#6B6560", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>PROGRESS: {form.progressPct}%</label>
                <input type="range" min={0} max={100} value={form.progressPct} onChange={e => setForm(f => ({ ...f, progressPct: Number(e.target.value) }))} style={{ width: "100%", accentColor: "#C8102E" }} />
              </div>
              <div>
                <label style={{ color: "#6B6560", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>NINETY.IO LINK (optional)</label>
                <input value={form.ninetyUrl} onChange={e => setForm(f => ({ ...f, ninetyUrl: e.target.value }))} placeholder="https://app.ninety.io/..." style={{ width: "100%", padding: "0.6rem 0.75rem", background: "rgba(245,240,235,0.05)", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.25rem", color: "#F5F0EB", fontSize: "0.85rem", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.25rem", background: "transparent", color: "#6B6560", border: "1px solid rgba(245,240,235,0.12)", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={upsertRock.isPending} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.25rem", background: "#C8102E", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>
                  {upsertRock.isPending ? "Saving..." : "Save Rock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
