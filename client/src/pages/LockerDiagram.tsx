/**
 * Locker Diagram — ICC Membership OS
 * Three separate locker banks: APEX / Atabey / Visionary
 * Data seeded from V3 Locker Diagram Google Sheet
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Search, X, Key, Users, Lock, Unlock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ICC_RED = "#C8102E";
const GOLD = "#D4AF37";
const SILVER = "#8899CC";

// ─── Static locker seed data from V3 Locker Diagram ─────────────────────────

interface LockerSeed {
  id: string;           // unique ID like "APEX-C1", "AT-1A", "VIS-1A"
  number: string;       // display number
  bank: "APEX" | "Atabey" | "Visionary";
  row: string;
  memberName: string | null;
  isAvailable: boolean;
  notes: string | null;
}

// APEX Bank — 4 rows: C1/1-10/C2, 11-18/37, C3/19-26/C4, 27-36
const APEX_LOCKERS: LockerSeed[] = [
  // Row 1: C1, 1-10, C2
  { id: "APEX-C1", number: "C1", bank: "APEX", row: "1", memberName: "Kevin Owens / Anthony Hoskin / James Collins", isAvailable: false, notes: "Corner cabinet — 3 members" },
  { id: "APEX-1",  number: "1",  bank: "APEX", row: "1", memberName: "Mark McClurkan", isAvailable: false, notes: null },
  { id: "APEX-2",  number: "2",  bank: "APEX", row: "1", memberName: "Eric Hall", isAvailable: false, notes: null },
  { id: "APEX-3",  number: "3",  bank: "APEX", row: "1", memberName: "Ben Dailey / Chris Ayon", isAvailable: false, notes: null },
  { id: "APEX-4",  number: "4",  bank: "APEX", row: "1", memberName: "Lee Osteguin", isAvailable: false, notes: null },
  { id: "APEX-5",  number: "5",  bank: "APEX", row: "1", memberName: "Mark Rogers / Misty Rogers", isAvailable: false, notes: null },
  { id: "APEX-6",  number: "6",  bank: "APEX", row: "1", memberName: "Jim Russell", isAvailable: false, notes: null },
  { id: "APEX-7",  number: "7",  bank: "APEX", row: "1", memberName: "Lathan Hendricks / Jim Stevens", isAvailable: false, notes: null },
  { id: "APEX-8",  number: "8",  bank: "APEX", row: "1", memberName: "Jonathan Scott", isAvailable: false, notes: null },
  { id: "APEX-9",  number: "9",  bank: "APEX", row: "1", memberName: "Albert Cooksey / Joe Akers", isAvailable: false, notes: null },
  { id: "APEX-10", number: "10", bank: "APEX", row: "1", memberName: "Jay Bass / Mike Ledo", isAvailable: false, notes: null },
  { id: "APEX-C2", number: "C2", bank: "APEX", row: "1", memberName: null, isAvailable: true, notes: "Corner cabinet" },
  // Row 2: 11-18, 37
  { id: "APEX-11", number: "11", bank: "APEX", row: "2", memberName: "Matt Sapaula", isAvailable: false, notes: null },
  { id: "APEX-12", number: "12", bank: "APEX", row: "2", memberName: "Willie Turpin", isAvailable: false, notes: null },
  { id: "APEX-13", number: "13", bank: "APEX", row: "2", memberName: "Johnnie Goodner", isAvailable: false, notes: null },
  { id: "APEX-14", number: "14", bank: "APEX", row: "2", memberName: "Craig & Nichole Allridge", isAvailable: false, notes: null },
  { id: "APEX-37", number: "37", bank: "APEX", row: "2", memberName: "Eliot Hamerman", isAvailable: false, notes: "Lucky 13 — custom membership" },
  { id: "APEX-15", number: "15", bank: "APEX", row: "2", memberName: "Aaron Klause / Keisha Klause", isAvailable: false, notes: null },
  { id: "APEX-16", number: "16", bank: "APEX", row: "2", memberName: "AJ Faulk / Anthony Jones", isAvailable: false, notes: null },
  { id: "APEX-17", number: "17", bank: "APEX", row: "2", memberName: "Grady Yates", isAvailable: false, notes: "Pending move" },
  { id: "APEX-18", number: "18", bank: "APEX", row: "2", memberName: "Grady Yates", isAvailable: false, notes: null },
  // Row 3: C3, 19-26, C4
  { id: "APEX-C3", number: "C3", bank: "APEX", row: "3", memberName: null, isAvailable: true, notes: "Corner cabinet" },
  { id: "APEX-19", number: "19", bank: "APEX", row: "3", memberName: "Daniel Himel / Carey Himel", isAvailable: false, notes: null },
  { id: "APEX-20", number: "20", bank: "APEX", row: "3", memberName: "Kelly Haney / Jana Waddle", isAvailable: false, notes: null },
  { id: "APEX-21", number: "21", bank: "APEX", row: "3", memberName: "Duane Okinaka", isAvailable: false, notes: "Pending move from Jim Russell" },
  { id: "APEX-22", number: "22", bank: "APEX", row: "3", memberName: "Duane Okinaka", isAvailable: false, notes: null },
  { id: "APEX-23", number: "23", bank: "APEX", row: "3", memberName: "William Traylor", isAvailable: false, notes: null },
  { id: "APEX-24", number: "24", bank: "APEX", row: "3", memberName: "Garrett Reed", isAvailable: false, notes: null },
  { id: "APEX-25", number: "25", bank: "APEX", row: "3", memberName: "Mario D", isAvailable: false, notes: null },
  { id: "APEX-26", number: "26", bank: "APEX", row: "3", memberName: "Bob Matthews", isAvailable: false, notes: null },
  { id: "APEX-C4", number: "C4", bank: "APEX", row: "3", memberName: "Maurice Sauls / Ty Demery / Adrian Borunda", isAvailable: false, notes: "Corner cabinet — 3 members" },
  // Row 4: 27-36
  { id: "APEX-27", number: "27", bank: "APEX", row: "4", memberName: "Chris Pennington", isAvailable: false, notes: null },
  { id: "APEX-28", number: "28", bank: "APEX", row: "4", memberName: "Jason Wayne", isAvailable: false, notes: null },
  { id: "APEX-29", number: "29", bank: "APEX", row: "4", memberName: "DJ Collins", isAvailable: false, notes: null },
  { id: "APEX-30", number: "30", bank: "APEX", row: "4", memberName: "Mario Avilia", isAvailable: false, notes: null },
  { id: "APEX-31", number: "31", bank: "APEX", row: "4", memberName: "Victor Garcia", isAvailable: false, notes: null },
  { id: "APEX-32", number: "32", bank: "APEX", row: "4", memberName: "Chris Hockenberry / Oliver Pratt", isAvailable: false, notes: null },
  { id: "APEX-33", number: "33", bank: "APEX", row: "4", memberName: null, isAvailable: true, notes: null },
  { id: "APEX-34", number: "34", bank: "APEX", row: "4", memberName: "Jamond Hackley", isAvailable: false, notes: null },
  { id: "APEX-35", number: "35", bank: "APEX", row: "4", memberName: "Bizzy B McCain", isAvailable: false, notes: null },
  { id: "APEX-36", number: "36", bank: "APEX", row: "4", memberName: "Ed Faulkner", isAvailable: false, notes: null },
];

// Atabey Bank — 6 rows × 16 cols (1A–6P), row 6 = Bottle Concierge
const ATABEY_COLS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'];
const ATABEY_ASSIGNMENTS: Record<string, { name: string; notes?: string }> = {
  "1A": { name: "Scott Bates" },
  "1B": { name: "Ed Eaton" },
  "1C": { name: "Robert Bell" },
  "1D": { name: "Omer Sohail", notes: "Needs key" },
  "1E": { name: "Norris Washington", notes: "Needs key" },
  "1F": { name: "Marc Sherron" },
  "1G": { name: "Larry Brantley" },
  "1H": { name: "Chef Chris" },
  "1I": { name: "Edward Warren" },
  "1K": { name: "Justen Franklin", notes: "Needs key" },
  "1L": { name: "Rene Salias" },
  "1M": { name: "Stephen Fly" },
  "1N": { name: "Scott Bakelman", notes: "No membership on file" },
  "1O": { name: "Moises Perezcid" },
  "1P": { name: "Mr. Wilson" },
  "2A": { name: "Al Brodie" },
  "2B": { name: "Bent Williams" },
  "2D": { name: "Joe Tellez" },
  "2E": { name: "Michael Gurley (NexSolve)" },
  "2F": { name: "Davie Buyanga" },
  "2G": { name: "Jason Wayne" },
  "2H": { name: "Emerson Funes" },
  "2I": { name: "Rhonda Torres" },
  "2J": { name: "Ironroot" },
  "2K": { name: "Brian Pennington" },
  "2L": { name: "Geoffery Clark", notes: "Needs key" },
  "2M": { name: "Sean Durham" },
  "2N": { name: "Derrick Coleman" },
  "2O": { name: "Antuan Wilbon" },
  "2P": { name: "Chris Kirby" },
  "3A": { name: "Ajit 'AJ' Samuel" },
  "3B": { name: "Cruce Brooks" },
  "3E": { name: "John Soliz", notes: "Needs key" },
  "3F": { name: "Susan Edmonds" },
  "3H": { name: "Chris Ocker" },
  "3J": { name: "Scott Powell" },
  "3K": { name: "Damon Marra" },
  "3L": { name: "Jim Stanco" },
  "3M": { name: "Jobin Mathai" },
  "3O": { name: "Jasmine Mininni" },
  "3P": { name: "Daniel Joiner", notes: "Needs key" },
  "4A": { name: "Ed Faulkner" },
  "4B": { name: "Dayshoun Richard" },
  "4C": { name: "Eric Curly", notes: "Not paying — reapplied online" },
  "4D": { name: "Bryan Ramsey" },
  "4E": { name: "Dustin Carter" },
  "4F": { name: "Alex Krueger" },
  "4G": { name: "Maurice Bean", notes: "Update card needed" },
  "4H": { name: "Wayne Ferguson" },
  "4I": { name: "Emerson Funes", notes: "Move to 2H" },
  "4K": { name: "Simon Villarreal" },
  "4L": { name: "Wade Candor" },
  "4P": { name: "Brian Smith", notes: "Comp 1 yr — 3/19/24" },
  "5E": { name: "Dustin Carter" },
  "5O": { name: "Alden De Armas", notes: "Move to 1E" },
  "5P": { name: "Jim Trader" },
  "6M": { name: "Jobin #2", notes: "Bottle Concierge" },
  "6N": { name: "Jim Trader", notes: "Bottle Concierge" },
};

function buildAtabeyLockers(): LockerSeed[] {
  const lockers: LockerSeed[] = [];
  for (let row = 1; row <= 6; row++) {
    for (const col of ATABEY_COLS) {
      const id = `${row}${col}`;
      const assignment = ATABEY_ASSIGNMENTS[id];
      const isBottleConcierge = row === 6;
      lockers.push({
        id: `AT-${id}`,
        number: id,
        bank: "Atabey",
        row: String(row),
        memberName: assignment?.name ?? null,
        isAvailable: !assignment,
        notes: assignment?.notes ?? (isBottleConcierge && !assignment ? "Bottle Concierge slot" : null),
      });
    }
  }
  return lockers;
}

const ATABEY_LOCKERS = buildAtabeyLockers();

// Visionary Bank — 5 rows × 16 cols (1A–5P), mostly open
const VISIONARY_ASSIGNMENTS: Record<string, { name: string; notes?: string }> = {
  "1A": { name: "Jerrod Henderson" },
  "2A": { name: "Jeff Axelrod" },
  "4A": { name: "Anthony White" },
  "2B": { name: "Michael Rubin" },
  "3B": { name: "Eric Medcalf" },
  "2C": { name: "Jerrod Henderson" },
  "1E": { name: "Kevin Guthrie" },
  "2E": { name: "Kevin Guthrie" },
  "3E": { name: "Clark Griffith" },
  "4E": { name: "Greg Taylor" },
  "5E": { name: "Shannon Garson" },
  "3A": { name: "Thaddus" },
};

function buildVisionaryLockers(): LockerSeed[] {
  const lockers: LockerSeed[] = [];
  for (let row = 1; row <= 5; row++) {
    for (const col of ATABEY_COLS) {
      const id = `${row}${col}`;
      const assignment = VISIONARY_ASSIGNMENTS[id];
      lockers.push({
        id: `VIS-${id}`,
        number: id,
        bank: "Visionary",
        row: String(row),
        memberName: assignment?.name ?? null,
        isAvailable: !assignment,
        notes: assignment?.notes ?? null,
      });
    }
  }
  return lockers;
}

const VISIONARY_LOCKERS = buildVisionaryLockers();

// ─── Component ───────────────────────────────────────────────────────────────

type BankKey = "APEX" | "Atabey" | "Visionary";

const BANK_CONFIG: Record<BankKey, { color: string; glow: string; border: string; bg: string; occupiedBg: string }> = {
  APEX:      { color: ICC_RED,  glow: `0 0 10px ${ICC_RED}66`, border: ICC_RED,  bg: "rgba(200,16,46,0.08)",  occupiedBg: "rgba(200,16,46,0.18)" },
  Atabey:    { color: GOLD,     glow: `0 0 8px ${GOLD}55`,     border: `${GOLD}88`, bg: "rgba(212,175,55,0.05)", occupiedBg: "rgba(212,175,55,0.14)" },
  Visionary: { color: SILVER,   glow: `0 0 8px ${SILVER}44`,   border: `${SILVER}55`, bg: "rgba(136,153,204,0.05)", occupiedBg: "rgba(136,153,204,0.13)" },
};

interface LockerCellProps {
  locker: LockerSeed;
  bank: BankKey;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
}

function LockerCell({ locker, bank, isSelected, isHighlighted, onClick }: LockerCellProps) {
  const cfg = BANK_CONFIG[bank];
  const occupied = !locker.isAvailable;

  const bg = isSelected
    ? cfg.occupiedBg
    : occupied
    ? cfg.occupiedBg
    : "rgba(10,10,10,0.9)";

  const border = isSelected
    ? cfg.color
    : isHighlighted
    ? cfg.color
    : occupied
    ? `${cfg.color}55`
    : "#1a1a1a";

  const boxShadow = isSelected ? cfg.glow : isHighlighted ? cfg.glow : "none";

  // Corner cabinets are wider
  const isCorner = locker.number.startsWith("C");

  return (
    <div
      onClick={onClick}
      title={locker.memberName ?? "Available"}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        boxShadow,
        borderRadius: "4px",
        padding: isCorner ? "6px 8px" : "4px 3px",
        cursor: "pointer",
        minHeight: isCorner ? "56px" : "48px",
        minWidth: isCorner ? "72px" : "44px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2px",
        transition: "all 0.15s ease",
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* Locker number */}
      <span style={{
        fontSize: "9px",
        fontFamily: "'Bebas Neue', sans-serif",
        letterSpacing: "0.05em",
        color: occupied ? cfg.color : "#333",
        lineHeight: 1,
      }}>
        {locker.number}
      </span>

      {/* Member name */}
      {occupied && locker.memberName && (
        <span style={{
          fontSize: "7px",
          color: "#aaa",
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: isCorner ? "68px" : "40px",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}>
          {locker.memberName.split(" / ")[0]}
        </span>
      )}

      {/* Available indicator */}
      {locker.isAvailable && (
        <span style={{ fontSize: "8px", color: "#2a2a2a", lineHeight: 1 }}>OPEN</span>
      )}

      {/* Note dot */}
      {locker.notes && (
        <div style={{
          position: "absolute",
          top: "3px",
          right: "3px",
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: "#D4AF37",
        }} />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LockerDiagram() {
  const [activeBank, setActiveBank] = useState<BankKey>("APEX");
  const [selectedLocker, setSelectedLocker] = useState<LockerSeed | null>(null);
  const [search, setSearch] = useState("");

  // Live member list from DB for assignment panel
  const { data: membersRaw } = trpc.members.list.useQuery();
  const members = membersRaw ?? [];

  const bankLockers: Record<BankKey, LockerSeed[]> = {
    APEX: APEX_LOCKERS,
    Atabey: ATABEY_LOCKERS,
    Visionary: VISIONARY_LOCKERS,
  };

  const currentLockers = bankLockers[activeBank];

  // Search highlight
  const searchLower = search.toLowerCase();
  const highlightedIds = search.length > 1
    ? new Set(currentLockers.filter(l =>
        l.memberName?.toLowerCase().includes(searchLower) ||
        l.number.toLowerCase().includes(searchLower)
      ).map(l => l.id))
    : new Set<string>();

  // Stats
  const occupied = currentLockers.filter(l => !l.isAvailable).length;
  const available = currentLockers.filter(l => l.isAvailable).length;
  const withNotes = currentLockers.filter(l => l.notes).length;

  // Group by row
  const rowGroups: Record<string, LockerSeed[]> = {};
  for (const l of currentLockers) {
    if (!rowGroups[l.row]) rowGroups[l.row] = [];
    rowGroups[l.row].push(l);
  }

  const cfg = BANK_CONFIG[activeBank];

  return (
    <div style={{ background: "#080808", minHeight: "100vh", padding: "24px", fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
          <Lock size={20} color={ICC_RED} />
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", color: "#E8E4DC", letterSpacing: "0.08em", margin: 0 }}>
            LOCKER DIAGRAM
          </h1>
        </div>
        <p style={{ fontSize: "0.75rem", color: "#4A4540", margin: 0 }}>
          207 total lockers across 3 banks — seeded from V3 Locker Diagram
        </p>
      </div>

      {/* Bank Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {(["APEX", "Atabey", "Visionary"] as BankKey[]).map(bank => {
          const bc = BANK_CONFIG[bank];
          const bl = bankLockers[bank];
          const occ = bl.filter(l => !l.isAvailable).length;
          const tot = bl.length;
          const isActive = activeBank === bank;
          return (
            <button
              key={bank}
              onClick={() => { setActiveBank(bank); setSelectedLocker(null); setSearch(""); }}
              style={{
                background: isActive ? bc.occupiedBg : "rgba(20,20,20,0.8)",
                border: `1px solid ${isActive ? bc.color : "#1a1a1a"}`,
                borderRadius: "6px",
                padding: "10px 20px",
                cursor: "pointer",
                color: isActive ? bc.color : "#555",
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1rem",
                letterSpacing: "0.08em",
                boxShadow: isActive ? bc.glow : "none",
                transition: "all 0.2s ease",
              }}
            >
              {bank}
              <span style={{ marginLeft: "8px", fontSize: "0.7rem", opacity: 0.7 }}>
                {occ}/{tot}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stats Row */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { label: "Occupied", value: occupied, color: cfg.color },
          { label: "Available", value: available, color: "#2a6a2a" },
          { label: "With Notes", value: withNotes, color: GOLD },
          { label: "Total", value: currentLockers.length, color: "#555" },
        ].map(stat => (
          <div key={stat.label} style={{
            background: "#0d0d0d",
            border: "1px solid #1a1a1a",
            borderRadius: "6px",
            padding: "8px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}>
            <span style={{ fontSize: "1.2rem", fontFamily: "'Bebas Neue', sans-serif", color: stat.color }}>{stat.value}</span>
            <span style={{ fontSize: "0.65rem", color: "#444", letterSpacing: "0.05em" }}>{stat.label.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: "280px", marginBottom: "20px" }}>
        <Search size={14} color="#444" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search member or locker #..."
          style={{
            width: "100%",
            background: "#0d0d0d",
            border: "1px solid #1a1a1a",
            borderRadius: "6px",
            padding: "8px 10px 8px 32px",
            color: "#E8E4DC",
            fontSize: "0.8rem",
            outline: "none",
          }}
        />
      </div>

      {/* Main layout: grid + detail panel */}
      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>

        {/* Locker Grid */}
        <div style={{ flex: 1, overflowX: "auto" }}>
          {Object.entries(rowGroups).map(([rowKey, rowLockers]) => (
            <div key={rowKey} style={{ marginBottom: "8px" }}>
              {/* Row label */}
              <div style={{ fontSize: "9px", color: "#333", letterSpacing: "0.1em", marginBottom: "4px", fontFamily: "'Bebas Neue', sans-serif" }}>
                {activeBank === "APEX" ? `ROW ${rowKey}` : `ROW ${rowKey}`}
              </div>
              <div style={{ display: "flex", gap: "4px", flexWrap: "nowrap" }}>
                {rowLockers.map(locker => (
                  <LockerCell
                    key={locker.id}
                    locker={locker}
                    bank={activeBank}
                    isSelected={selectedLocker?.id === locker.id}
                    isHighlighted={highlightedIds.has(locker.id)}
                    onClick={() => setSelectedLocker(prev => prev?.id === locker.id ? null : locker)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div style={{ display: "flex", gap: "16px", marginTop: "20px", flexWrap: "wrap" }}>
            {[
              { label: "Occupied", color: cfg.color },
              { label: "Available", color: "#2a2a2a" },
              { label: "Note ●", color: GOLD },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: item.color }} />
                <span style={{ fontSize: "0.7rem", color: "#444" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedLocker && (
          <div style={{
            width: "280px",
            flexShrink: 0,
            background: "#0d0d0d",
            border: `1px solid ${cfg.color}44`,
            borderRadius: "8px",
            padding: "16px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", color: cfg.color, letterSpacing: "0.08em" }}>
                LOCKER {selectedLocker.number}
              </span>
              <button onClick={() => setSelectedLocker(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#444" }}>
                <X size={16} />
              </button>
            </div>

            {/* Status badge */}
            <div style={{ marginBottom: "12px" }}>
              <span style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: "4px",
                fontSize: "0.7rem",
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: "0.05em",
                background: selectedLocker.isAvailable ? "rgba(42,106,42,0.2)" : cfg.occupiedBg,
                color: selectedLocker.isAvailable ? "#4CAF50" : cfg.color,
                border: `1px solid ${selectedLocker.isAvailable ? "#4CAF50" : cfg.color}44`,
              }}>
                {selectedLocker.isAvailable ? "AVAILABLE" : "OCCUPIED"}
              </span>
            </div>

            {/* Current occupant */}
            {!selectedLocker.isAvailable && selectedLocker.memberName && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "0.65rem", color: "#444", letterSpacing: "0.08em", marginBottom: "4px" }}>CURRENT MEMBER(S)</div>
                <div style={{ fontSize: "0.85rem", color: "#E8E4DC", lineHeight: 1.5 }}>
                  {selectedLocker.memberName.split(" / ").map((name, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Users size={10} color={cfg.color} />
                      <span>{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedLocker.notes && (
              <div style={{
                background: "rgba(212,175,55,0.06)",
                border: "1px solid rgba(212,175,55,0.2)",
                borderRadius: "4px",
                padding: "8px",
                marginBottom: "12px",
              }}>
                <div style={{ fontSize: "0.65rem", color: GOLD, letterSpacing: "0.08em", marginBottom: "4px" }}>NOTE</div>
                <div style={{ fontSize: "0.78rem", color: "#aaa", lineHeight: 1.4 }}>{selectedLocker.notes}</div>
              </div>
            )}

            {/* Bank info */}
            <div style={{ fontSize: "0.65rem", color: "#333", marginTop: "8px" }}>
              Bank: {selectedLocker.bank} · Row {selectedLocker.row}
            </div>

            {/* Action buttons */}
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {selectedLocker.isAvailable ? (
                <button
                  onClick={() => toast.info("Assignment coming soon — connect to Appstle member sync first")}
                  style={{
                    background: cfg.occupiedBg,
                    border: `1px solid ${cfg.color}55`,
                    borderRadius: "4px",
                    padding: "8px",
                    color: cfg.color,
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontFamily: "'Bebas Neue', sans-serif",
                    letterSpacing: "0.05em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Unlock size={12} />
                  ASSIGN MEMBER
                </button>
              ) : (
                <button
                  onClick={() => toast.info("Unassign coming soon — connect to Appstle member sync first")}
                  style={{
                    background: "rgba(200,16,46,0.08)",
                    border: "1px solid rgba(200,16,46,0.3)",
                    borderRadius: "4px",
                    padding: "8px",
                    color: "#C8102E",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontFamily: "'Bebas Neue', sans-serif",
                    letterSpacing: "0.05em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Lock size={12} />
                  UNASSIGN
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
