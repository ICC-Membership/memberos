/*
 * Locker Diagram — ICC Membership OS
 * Visual locker grid showing occupied/available lockers by tier
 * APEX (gold glow), Atabey (bronze), Visionary (silver), Available (dark)
 */
import { useState } from "react";
import { Archive, Info } from "lucide-react";

type LockerStatus = "apex" | "atabey" | "visionary" | "available" | "reserved";

interface Locker {
  id: string;
  number: number;
  status: LockerStatus;
  member?: string;
  tier?: string;
  section: string;
}

// Generate locker data — 60 total lockers across 3 sections
const generateLockers = (): Locker[] => {
  const assignments: Record<number, { member: string; status: LockerStatus; tier: string }> = {
    1: { member: "Sterling Mott", status: "apex", tier: "APEX" },
    2: { member: "Robert DiMarco", status: "apex", tier: "APEX" },
    3: { member: "Harold Bishop Jr.", status: "apex", tier: "APEX" },
    4: { member: "James Thornton", status: "apex", tier: "APEX" },
    5: { member: "Jason Passwaters", status: "atabey", tier: "Atabey" },
    6: { member: "David Chen", status: "atabey", tier: "Atabey" },
    7: { member: "Dack Lowery", status: "atabey", tier: "Atabey" },
    8: { member: "Chris Williams", status: "atabey", tier: "Atabey" },
    9: { member: "Caden Posey", status: "atabey", tier: "Atabey" },
    10: { member: "Norris Washington", status: "visionary", tier: "Visionary" },
    11: { member: "Derrick Coleman", status: "visionary", tier: "Visionary" },
    12: { member: "Howard Stokes", status: "visionary", tier: "Visionary" },
    13: { member: "Matt Miller", status: "visionary", tier: "Visionary" },
    14: { member: "Tyler Brooks", status: "visionary", tier: "Visionary" },
    15: { member: "Marcus Reed", status: "visionary", tier: "Visionary" },
    20: { member: "Reserved", status: "reserved", tier: "APEX" },
    21: { member: "Reserved", status: "reserved", tier: "APEX" },
  };

  const lockers: Locker[] = [];
  const sections = ["Section A — APEX", "Section B — Atabey", "Section C — Visionary"];

  for (let i = 1; i <= 60; i++) {
    const section = i <= 20 ? sections[0] : i <= 40 ? sections[1] : sections[2];
    const assignment = assignments[i];
    lockers.push({
      id: `L${String(i).padStart(3, "0")}`,
      number: i,
      status: assignment?.status || "available",
      member: assignment?.member,
      tier: assignment?.tier,
      section,
    });
  }
  return lockers;
};

const ALL_LOCKERS = generateLockers();

const STATUS_CONFIG: Record<LockerStatus, { label: string; bg: string; border: string; text: string; glow?: string }> = {
  apex: { label: "APEX", bg: "#C8102E", border: "#C8102E", text: "#E8E4DC", glow: "0 0 8px #C8102E" },
  atabey: { label: "Atabey", bg: "rgba(196,163,90,0.15)", border: "rgba(196,163,90,0.60)", text: "#C4A35A" },
  visionary: { label: "Visionary", bg: "rgba(136,153,204,0.15)", border: "rgba(136,153,204,0.60)", text: "#8899CC" },
  available: { label: "Available", bg: "#161616", border: "#2A2A2A", text: "#3A3A3A" },
  reserved: { label: "Reserved", bg: "rgba(196,163,90,0.10)", border: "#C8102E", text: "#C4A35A" },
};

export default function LockerDiagram() {
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null);
  const [filter, setFilter] = useState<string>("All");

  const sections = ["Section A — APEX", "Section B — Atabey", "Section C — Visionary"];

  const stats = {
    total: ALL_LOCKERS.length,
    occupied: ALL_LOCKERS.filter(l => l.status !== "available").length,
    available: ALL_LOCKERS.filter(l => l.status === "available").length,
    apex: ALL_LOCKERS.filter(l => l.status === "apex").length,
    atabey: ALL_LOCKERS.filter(l => l.status === "atabey").length,
    visionary: ALL_LOCKERS.filter(l => l.status === "visionary").length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#E8E4DC" }}>
            Locker Diagram
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B6560" }}>
            Visual locker assignment — {stats.occupied} occupied, {stats.available} available
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Lockers", value: stats.total, color: "#A09A94" },
          { label: "Occupied", value: stats.occupied, color: "#A09A94" },
          { label: "APEX", value: stats.apex, color: "#E8E4DC" },
          { label: "Atabey", value: stats.atabey, color: "#C4A35A" },
          { label: "Visionary", value: stats.visionary, color: "#8899CC" },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card text-center py-3">
            <p className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", color }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: "#6B6560" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 items-center">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilter(filter === key ? "All" : key)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs transition-all duration-180"
            style={{
              background: filter === key || filter === "All" ? cfg.bg : "transparent",
              borderColor: cfg.border,
              color: cfg.text,
              opacity: filter !== "All" && filter !== key ? 0.4 : 1,
            }}
          >
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: cfg.border }} />
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Locker grid by section */}
      <div className="space-y-6">
        {sections.map((section) => {
          const sectionLockers = ALL_LOCKERS.filter(l => l.section === section);
          const filtered = filter === "All" ? sectionLockers : sectionLockers.filter(l => l.status === filter);

          return (
            <div key={section} className="icc-card">
              <div className="flex items-center gap-2 mb-4">
                <Archive size={13} style={{ color: "#C8102E" }} />
                <h3 className="text-sm font-semibold" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#E8E4DC" }}>
                  {section}
                </h3>
                <span className="text-xs ml-auto" style={{ color: "#6B6560" }}>
                  {sectionLockers.filter(l => l.status !== "available").length} / {sectionLockers.length} occupied
                </span>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {sectionLockers.map((locker) => {
                  const cfg = STATUS_CONFIG[locker.status];
                  const isSelected = selectedLocker?.id === locker.id;
                  const dimmed = filter !== "All" && locker.status !== filter;
                  return (
                    <button
                      key={locker.id}
                      onClick={() => setSelectedLocker(isSelected ? null : locker)}
                      className="locker-cell flex flex-col items-center justify-center gap-0.5 transition-all duration-180"
                      style={{
                        background: cfg.bg,
                        borderColor: isSelected ? "#E8E4DC" : cfg.border,
                        color: cfg.text,
                        boxShadow: isSelected ? `0 0 12px #C8102E` : (locker.status === "apex" ? cfg.glow : undefined),
                        opacity: dimmed ? 0.25 : 1,
                        minHeight: "52px",
                        padding: "6px 4px",
                      }}
                    >
                      <span className="text-[10px] font-bold">{locker.number}</span>
                      {locker.member && locker.status !== "available" ? (
                        <span className="text-[8px] leading-tight text-center opacity-80 truncate w-full">
                          {locker.member.split(" ")[0]}
                        </span>
                      ) : (
                        <span className="text-[8px] opacity-40">—</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected locker detail */}
      {selectedLocker && (
        <div
          className="fixed bottom-6 right-6 p-4 rounded-xl border shadow-2xl z-50 min-w-[240px]"
          style={{
            background: "#161616",
            borderColor: "#C8102E",
            boxShadow: "0 8px 32px rgba(0,0,0,0.50)",
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Info size={13} style={{ color: "#C8102E" }} />
              <span className="text-xs font-semibold" style={{ color: "#C8102E" }}>
                Locker {selectedLocker.number}
              </span>
            </div>
            <button onClick={() => setSelectedLocker(null)} style={{ color: "#3A3A3A" }} className="text-xs">✕</button>
          </div>
          <p className="text-sm font-medium" style={{ color: "#E8E4DC" }}>
            {selectedLocker.member || "Available"}
          </p>
          {selectedLocker.tier && (
            <p className="text-xs mt-1" style={{ color: "#A09A94" }}>{selectedLocker.tier} Member</p>
          )}
          <p className="text-xs mt-1" style={{ color: "#6B6560" }}>{selectedLocker.section}</p>
          <div className="mt-2 pt-2 border-t" style={{ borderColor: "#2A2A2A" }}>
            <span
              className="text-[10px] px-2 py-0.5 rounded-sm capitalize"
              style={{ background: STATUS_CONFIG[selectedLocker.status].bg, color: STATUS_CONFIG[selectedLocker.status].text }}
            >
              {STATUS_CONFIG[selectedLocker.status].label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
