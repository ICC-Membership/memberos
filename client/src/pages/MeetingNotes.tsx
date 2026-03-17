import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { FileText, Upload, ChevronDown, ChevronUp, AlertCircle, CheckSquare, Sparkles } from "lucide-react";

export default function MeetingNotes() {
  const { isAuthenticated } = useAuth();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: "", meetingDate: "", rawTranscript: "" });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: notes = [], refetch } = trpc.meetingNotes.list.useQuery();
  const uploadNote = trpc.meetingNotes.upload.useMutation({
    onSuccess: () => {
      refetch();
      setShowUpload(false);
      setUploadForm({ title: "", meetingDate: "", rawTranscript: "" });
      setIsAnalyzing(false);
      toast.success("Meeting notes analyzed and saved");
    },
    onError: () => { setIsAnalyzing(false); toast.error("Failed to analyze notes"); },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setUploadForm(f => ({ ...f, rawTranscript: text, title: f.title || file.name.replace(/\.[^/.]+$/, "") }));
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.rawTranscript.trim()) { toast.error("Please paste or upload a transcript"); return; }
    setIsAnalyzing(true);
    uploadNote.mutate({
      title: uploadForm.title || "L10 Meeting",
      meetingDate: uploadForm.meetingDate ? new Date(uploadForm.meetingDate) : undefined,
      rawTranscript: uploadForm.rawTranscript,
    });
  };

  const parseMentions = (raw: string | null): string[] => {
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <FileText size={28} color="#C8102E" />
          <div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", color: "#F5F0EB", letterSpacing: "0.04em", margin: 0 }}>L10 MEETING NOTES</h1>
            <p style={{ color: "#6B6560", fontSize: "0.82rem", margin: 0 }}>Upload Otter.ai transcripts — AI extracts membership mentions and action items</p>
          </div>
        </div>
        {isAuthenticated && (
          <button onClick={() => setShowUpload(true)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "0.25rem", background: "#C8102E", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.82rem" }}>
            <Upload size={14} /> Upload Notes
          </button>
        )}
      </div>

      {/* Info Banner */}
      <div style={{ background: "rgba(200,16,46,0.06)", border: "1px solid rgba(200,16,46,0.15)", borderRadius: "0.5rem", padding: "1rem 1.5rem", marginBottom: "2rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
        <Sparkles size={18} color="#C8102E" style={{ marginTop: 2, flexShrink: 0 }} />
        <div>
          <p style={{ color: "#F5F0EB", fontSize: "0.85rem", fontWeight: 600, margin: "0 0 0.25rem" }}>How it works</p>
          <p style={{ color: "#6B6560", fontSize: "0.8rem", margin: 0 }}>
            Export your Monday L10 meeting transcript from Otter.ai as a .txt file, then upload it here. The AI will automatically extract every mention of "membership", "member", or your name — plus all action items assigned to you. No more reading through 2-hour transcripts.
          </p>
        </div>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#6B6560" }}>
          <FileText size={48} style={{ marginBottom: "1rem", opacity: 0.3 }} />
          <p style={{ fontSize: "1rem" }}>No meeting notes yet.</p>
          <p style={{ fontSize: "0.82rem" }}>Upload your first Otter.ai transcript to get started.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {notes.map((note: any) => {
            const mentions = parseMentions(note.membershipMentions);
            const actions = parseMentions(note.actionItems);
            const isExpanded = expandedId === note.id;
            return (
              <div key={note.id} style={{ background: "#1A1614", border: "1px solid rgba(245,240,235,0.08)", borderRadius: "0.5rem", overflow: "hidden" }}>
                <div onClick={() => setExpandedId(isExpanded ? null : note.id)} style={{ padding: "1.25rem 1.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ color: "#F5F0EB", fontSize: "0.95rem", fontWeight: 600, margin: "0 0 0.25rem" }}>{note.title}</h3>
                    <div style={{ display: "flex", gap: "1rem" }}>
                      {note.meetingDate && <span style={{ color: "#6B6560", fontSize: "0.78rem" }}>{new Date(note.meetingDate).toLocaleDateString()}</span>}
                      <span style={{ color: "#C8102E", fontSize: "0.78rem", fontWeight: 600 }}>{mentions.length} membership mentions</span>
                      <span style={{ color: "#22c55e", fontSize: "0.78rem", fontWeight: 600 }}>{actions.length} action items</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={16} color="#6B6560" /> : <ChevronDown size={16} color="#6B6560" />}
                </div>

                {isExpanded && (
                  <div style={{ padding: "0 1.5rem 1.5rem", borderTop: "1px solid rgba(245,240,235,0.06)" }}>
                    {/* AI Summary */}
                    {note.aiSummary && (
                      <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(200,16,46,0.06)", borderRadius: "0.375rem", borderLeft: "3px solid #C8102E" }}>
                        <p style={{ color: "#C8102E", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", margin: "0 0 0.5rem" }}>AI SUMMARY</p>
                        <p style={{ color: "#F5F0EB", fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>{note.aiSummary}</p>
                      </div>
                    )}

                    {/* Action Items */}
                    {actions.length > 0 && (
                      <div style={{ marginTop: "1.25rem" }}>
                        <p style={{ color: "#22c55e", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", margin: "0 0 0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <CheckSquare size={12} /> YOUR ACTION ITEMS ({actions.length})
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {actions.map((action: string, i: number) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.6rem 0.75rem", background: "rgba(34,197,94,0.06)", borderRadius: "0.25rem" }}>
                              <CheckSquare size={14} color="#22c55e" style={{ marginTop: 2, flexShrink: 0 }} />
                              <span style={{ color: "#F5F0EB", fontSize: "0.85rem" }}>{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Membership Mentions */}
                    {mentions.length > 0 && (
                      <div style={{ marginTop: "1.25rem" }}>
                        <p style={{ color: "#C8102E", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", margin: "0 0 0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <AlertCircle size={12} /> MEMBERSHIP MENTIONS ({mentions.length})
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          {mentions.map((mention: string, i: number) => (
                            <div key={i} style={{ padding: "0.5rem 0.75rem", background: "rgba(200,16,46,0.06)", borderRadius: "0.25rem", borderLeft: "2px solid rgba(200,16,46,0.4)" }}>
                              <span style={{ color: "#A09890", fontSize: "0.82rem", fontStyle: "italic" }}>"{mention}"</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div style={{ background: "#1A1614", border: "1px solid rgba(200,16,46,0.25)", borderRadius: "0.75rem", padding: "2rem", width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: "#F5F0EB", marginBottom: "1.5rem" }}>UPLOAD L10 MEETING NOTES</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ color: "#6B6560", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>MEETING TITLE</label>
                <input value={uploadForm.title} onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))} placeholder="Monday L10 — March 17, 2026" style={{ width: "100%", padding: "0.6rem 0.75rem", background: "rgba(245,240,235,0.05)", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.25rem", color: "#F5F0EB", fontSize: "0.9rem", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ color: "#6B6560", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>MEETING DATE</label>
                <input type="date" value={uploadForm.meetingDate} onChange={e => setUploadForm(f => ({ ...f, meetingDate: e.target.value }))} style={{ padding: "0.6rem 0.75rem", background: "rgba(245,240,235,0.05)", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.25rem", color: "#F5F0EB", fontSize: "0.85rem" }} />
              </div>
              <div>
                <label style={{ color: "#6B6560", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>UPLOAD .TXT FILE (from Otter.ai)</label>
                <input type="file" accept=".txt,.md,.text" onChange={handleFileUpload} style={{ color: "#F5F0EB", fontSize: "0.82rem" }} />
              </div>
              <div>
                <label style={{ color: "#6B6560", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>OR PASTE TRANSCRIPT</label>
                <textarea value={uploadForm.rawTranscript} onChange={e => setUploadForm(f => ({ ...f, rawTranscript: e.target.value }))} rows={8} placeholder="Paste your Otter.ai transcript here..." style={{ width: "100%", padding: "0.6rem 0.75rem", background: "rgba(245,240,235,0.05)", border: "1px solid rgba(245,240,235,0.12)", borderRadius: "0.25rem", color: "#F5F0EB", fontSize: "0.82rem", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowUpload(false)} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.25rem", background: "transparent", color: "#6B6560", border: "1px solid rgba(245,240,235,0.12)", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={isAnalyzing} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1.25rem", borderRadius: "0.25rem", background: "#C8102E", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>
                  <Sparkles size={14} /> {isAnalyzing ? "Analyzing with AI..." : "Analyze & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
