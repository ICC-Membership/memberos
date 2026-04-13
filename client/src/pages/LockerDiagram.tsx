/**
 * Locker Diagram — ICC Membership OS
 * Visual locker grid — live from DB — with manual assignment panel
 * APEX (red glow), Atabey (gold), Visionary (silver), Available (dark)
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Archive, Info, X, Search, CheckCircle, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ICC_RED = "#C8102E";
const GOLD = "#D4AF37";

type LockerStatus = "apex" | "atabey" | "visionary" | "available" | "reserved";

interface LockerCell {
  number: number;
  section: string;
  sectionLabel: string;
  status: LockerStatus;
  memberId?: number;
  memberName?: string;
  memberTier?: string;
}

const STATUS_CONFIG: Record<LockerStatus, { label: string; bg: string; border: string; text: string; glow?: string }> = {
  apex: { label: "APEX", bg: "rgba(200,16,46,0.18)", border: ICC_RED, text: "#E8E4DC", glow: `0 0 8px ${ICC_RED}88` },
  atabey: { label: "Atabey", bg: "rgba(212,175,55,0.12)", border: `${GOLD}88`, text: GOLD },
  visionary: { label: "Visionary", bg: "rgba(136,153,204,0.12)", border: "rgba(136,153,204,0.55)", text: "#8899CC" },
  available: { label: "Available", bg: "#141414", border: "#1E1E1E", text: "#3A3A3A" },
  reserved: { label: "Reserved", bg: "rgba(212,175,55,0.08)", border: `${GOLD}44`, text: `${GOLD}88` },
};

const SECTIONS = [
  { key: "A", label: "Section A — APEX", start: 1, end: 20 },
  { key: "B", label: "Section B — Atabey", start: 21, end: 40 },
  { key: "C", label: "Section C — Visionary", start: 41, end: 60 },
];

function buildLockers(members: any[]): LockerCell[] {
  // Build a map from lockerNumber → member
  const lockerMap: Record<string, any> = {};
  for (const m of members) {
    if (m.lockerNumber) {
      lockerMap[String(m.lockerNumber)] = m;
    }
  }

  const cells: LockerCell[] = [];
  for (let n = 1; n <= 60; n++) {
    const section = SECTIONS.find(s => n >= s.start && n <= s.end)!;
    const member = lockerMap[String(n)];
    let status: LockerStatus = "available";
    if (member) {
      if (member.tier === "APEX") status = "apex";
      else if (member.tier === "Atabey") status = "atabey";
      else status = "visionary";
    }
    cells.push({
      number: n,
      section: section.key,
      sectionLabel: section.label,
      status,
      memberId: member?.id,
      memberName: member?.name,
      memberTier: member?.tier,
    });
  }
  return cells;
}

export default function LockerDiagram() {
  const [selectedLocker, setSelectedLocker] = useState<LockerCell | null>(null);
  const [filter, setFilter] = useState<string>("All");
  const [assignSearch, setAssignSearch] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const { data: members = [], isLoading, refetch } = trpc.members.list.useQuery();

  const lockers = useMemo(() => buildLockers(members as any[]), [members]);

  const assignMutation = trpc.members.upsert.useMutation({
    onSuccess: () => {
      toast.success("Locker assignment saved");
      refetch();
      setIsAssigning(false);
      setAssignSearch("");
      // Update selected locker display
      setSelectedLocker(null);
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });

  const stats = {
    total: lockers.length,
    occupied: lockers.filter(l => l.status !== "available").length,
    available: lockers.filter(l => l.status === "available").length,
    apex: lockers.filter(l => l.status === "apex").length,
    atabey: lockers.filter(l => l.status === "atabey").length,
    visionary: lockers.filter(l => l.status === "visionary").length,
  };

  // Members without a locker (for assignment)
  const unassignedMembers = (members as any[]).filter(m =>
    m.status === "Active" && !m.lockerNumber &&
    (assignSearch === "" || m.name?.toLowerCase().includes(assignSearch.toLowerCase()))
  );

  const handleAssign = (member: any) => {
    if (!selectedLocker) return;
    assignMutation.mutate({
      id: member.id,
      name: member.name,
      lockerNumber: String(selectedLocker.number),
      lockerSection: selectedLocker.section,
    });
  };

  const handleUnassign = () => {
    if (!selectedLocker?.memberId) return;
    const member = (members as any[]).find(m => m.id === selectedLocker.memberId);
    if (!member) return;
    assignMutation.mutate({
      id: member.id,
      name: member.name,
      lockerNumber: "",
      lockerSection: "",
    });
  };

  return (
    <div className="p-6 space-y-5" style={{ color: "#E8E4DC" }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: "0.05em", color: "#E8E4DC", lineHeight: 1 }}>
            LOCKER DIAGRAM
          </h1>
          <p style={{ fontSize: "0.78rem", color: "#6B6560", marginTop: "0.25rem" }}>
            {stats.occupied} occupied · {stats.available} available · Click any locker to assign or view
          </p>
        </div>
        <div style={{ fontSize: "0.72rem", color: "#3A3A3A" }}>
          {isLoading ? "Loading..." : `${(members as any[]).length} members synced`}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Total", value: stats.total, color: "#6B6560" },
          { label: "Occupied", value: stats.occupied, color: "#E8E4DC" },
          { label: "Available", value: stats.available, color: "#22C55E" },
          { label: "APEX", value: stats.apex, color: ICC_RED },
          { label: "Atabey", value: stats.atabey, color: GOLD },
          { label: "Visionary", value: stats.visionary, color: "#8899CC" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg p-3 text-center" style={{ background: "#141414", border: "1px solid #1E1E1E" }}>
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", color, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: "0.65rem", color: "#6B6560", marginTop: "0.2rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Legend / filter */}
      <div className="flex flex-wrap gap-2 items-center">
        {(["All", ...Object.keys(STATUS_CONFIG)] as const).map((key) => {
          const cfg = key === "All" ? null : STATUS_CONFIG[key as LockerStatus];
          return (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? "All" : key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-all"
              style={{
                fontSize: "0.68rem",
                background: filter === key ? (cfg?.bg ?? "#1C1C1C") : "transparent",
                border: `1px solid ${filter === key ? (cfg?.border ?? "#2A2A2A") : "#2A2A2A"}`,
                color: filter === key ? (cfg?.text ?? "#E8E4DC") : "#6B6560",
              }}
            >
              {cfg && <div className="w-2 h-2 rounded-sm" style={{ background: cfg.border }} />}
              {key === "All" ? "All" : cfg?.label}
            </button>
          );
        })}
      </div>

      {/* Locker grid by section */}
      <div className="space-y-5">
        {SECTIONS.map((section) => {
          const sectionLockers = lockers.filter(l => l.section === section.key);
          const occupied = sectionLockers.filter(l => l.status !== "available").length;

          return (
            <div key={section.key} className="rounded-lg p-4" style={{ background: "#141414", border: "1px solid #1E1E1E" }}>
              <div className="flex items-center gap-2 mb-4">
                <Key size={13} style={{ color: ICC_RED }} />
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem", letterSpacing: "0.08em", color: "#E8E4DC" }}>
                  {section.label}
                </h3>
                <span style={{ fontSize: "0.65rem", color: "#6B6560", marginLeft: "auto" }}>
                  {occupied} / {sectionLockers.length} occupied
                </span>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {sectionLockers.map((locker) => {
                  const cfg = STATUS_CONFIG[locker.status];
                  const isSelected = selectedLocker?.number === locker.number;
                  const dimmed = filter !== "All" && locker.status !== filter;
                  return (
                    <button
                      key={locker.number}
                      onClick={() => {
                        setSelectedLocker(isSelected ? null : locker);
                        setIsAssigning(false);
                        setAssignSearch("");
                      }}
                      className="flex flex-col items-center justify-center rounded transition-all"
                      style={{
                        background: isSelected ? `${ICC_RED}22` : cfg.bg,
                        border: `1px solid ${isSelected ? ICC_RED : cfg.border}`,
                        color: cfg.text,
                        boxShadow: isSelected ? `0 0 12px ${ICC_RED}66` : (locker.status === "apex" ? cfg.glow : undefined),
                        opacity: dimmed ? 0.2 : 1,
                        minHeight: "52px",
                        padding: "6px 4px",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, fontFamily: "'Bebas Neue', sans-serif" }}>{locker.number}</span>
                      {locker.memberName ? (
                        <span style={{ fontSize: "0.55rem", lineHeight: 1.2, textAlign: "center", opacity: 0.85, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {locker.memberName.split(" ")[0]}
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.55rem", opacity: 0.3 }}>—</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected locker panel */}
      {selectedLocker && (
        <div
          className="fixed bottom-6 right-6 rounded-xl shadow-2xl z-50"
          style={{
            background: "#161616",
            border: `1px solid ${ICC_RED}66`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            width: "280px",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #1E1E1E" }}>
            <div className="flex items-center gap-2">
              <Key size={13} style={{ color: ICC_RED }} />
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", color: ICC_RED, letterSpacing: "0.08em" }}>
                LOCKER {selectedLocker.number}
              </span>
            </div>
            <button
              onClick={() => { setSelectedLocker(null); setIsAssigning(false); }}
              style={{ color: "#3A3A3A", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem" }}
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-4">
            {/* Current occupant */}
            {selectedLocker.memberName ? (
              <div className="mb-3">
                <p style={{ fontSize: "0.65rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>Assigned To</p>
                <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "#E8E4DC" }}>{selectedLocker.memberName}</p>
                <p style={{ fontSize: "0.72rem", color: "#6B6560" }}>{selectedLocker.memberTier} · {selectedLocker.sectionLabel}</p>
              </div>
            ) : (
              <div className="mb-3">
                <p style={{ fontSize: "0.65rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>Status</p>
                <p style={{ fontSize: "0.85rem", color: "#22C55E", fontWeight: 600 }}>Available</p>
                <p style={{ fontSize: "0.72rem", color: "#6B6560" }}>{selectedLocker.sectionLabel}</p>
              </div>
            )}

            {/* Actions */}
            {!isAssigning ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsAssigning(true)}
                  className="flex-1"
                  style={{ background: ICC_RED, color: "white", fontSize: "0.72rem", border: "none" }}
                >
                  {selectedLocker.memberName ? "Reassign" : "Assign Member"}
                </Button>
                {selectedLocker.memberName && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleUnassign}
                    disabled={assignMutation.isPending}
                    style={{ fontSize: "0.72rem", borderColor: "#2A2A2A", color: "#6B6560", background: "transparent" }}
                  >
                    Unassign
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p style={{ fontSize: "0.65rem", color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Assign Active Member
                </p>
                <div className="relative">
                  <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#3A3A3A" }} />
                  <Input
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                    placeholder="Search members..."
                    className="pl-7"
                    style={{ background: "#0A0A0A", border: "1px solid #2A2A2A", color: "#E8E4DC", fontSize: "0.75rem", height: "32px" }}
                  />
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {unassignedMembers.slice(0, 8).map((m: any) => (
                    <button
                      key={m.id}
                      onClick={() => handleAssign(m)}
                      disabled={assignMutation.isPending}
                      className="w-full text-left px-3 py-2 rounded transition-all"
                      style={{
                        background: "#0A0A0A",
                        border: "1px solid #1E1E1E",
                        color: "#E8E4DC",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = ICC_RED)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "#1E1E1E")}
                    >
                      <span style={{ fontWeight: 600 }}>{m.name}</span>
                      <span style={{ color: "#6B6560", marginLeft: "0.5rem", fontSize: "0.68rem" }}>{m.tier}</span>
                    </button>
                  ))}
                  {unassignedMembers.length === 0 && (
                    <p style={{ fontSize: "0.72rem", color: "#3A3A3A", textAlign: "center", padding: "0.75rem 0" }}>
                      {assignSearch ? "No matches" : "All active members have lockers"}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => { setIsAssigning(false); setAssignSearch(""); }}
                  style={{ fontSize: "0.68rem", color: "#6B6560", background: "none", border: "none", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
