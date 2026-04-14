/**
 * Locker Diagram — ICC Membership OS
 *
 * APEX Bank physical layout:
 *   Row 1 (Top):  [C1 Enterprise] [1-10 Corporate] [C2 Enterprise]
 *   Row 2 (Mid):  [11-14 Individual] [37 Eliot 4x Oversized] [15-18 Individual]
 *   Row 3 (Mid):  [C3 Enterprise] [19-26 Individual] [C4 Enterprise]
 *   Row 4 (Bot):  [27-36 Individual]
 *
 * Locker type legend:
 *   Enterprise  (C1/C2/C3/C4) — corner cabinets, 3 members each
 *   Corporate   (Row 1 #1-10) — 2 members each
 *   Oversized   (#37 Eliot)   — physically 4 lockers wide, 1 member
 *   Individual  (all others)  — 1 member
 *
 * Color coding:
 *   Available      → bright green glow
 *   Payment overdue → red highlight
 *   Occupied       → bank accent color
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Search, X, Key, Users, Lock, Unlock, History, ArrowRight,
  Phone, Mail, Calendar, Edit3, AlertTriangle, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ICC_RED = "#C8102E";
const GOLD = "#D4AF37";
const SILVER = "#8899CC";
const GREEN = "#22C55E";

// ─── Locker type definitions ──────────────────────────────────────────────────

type LockerType = "individual" | "corporate" | "enterprise" | "oversized";
type BankKey = "APEX" | "Atabey" | "Visionary";

interface LockerSeed {
  id: string;
  number: string;
  bank: BankKey;
  row: string;
  memberName: string | null;
  nameplateLabel: string | null;  // nameplate display name (can differ from member name)
  keyCode: string | null;         // physical key number
  lockerType: LockerType;
  isAvailable: boolean;
  paymentOverdue: boolean;
  notes: string | null;
  phone?: string | null;
  email?: string | null;
  birthdate?: string | null;
}

// ─── APEX Bank seed data ──────────────────────────────────────────────────────
// Physical layout as described:
//   4 corners = Enterprise (C1/C2/C3/C4) — 3 members each
//   Top row (#1-10) = Corporate — 2 members each
//   #37 (Eliot Hamerman) = Oversized — physically 4 lockers wide
//   All others = Individual

const APEX_LOCKERS: LockerSeed[] = [
  // ── Row 1: C1 (Enterprise), 1-10 (Corporate), C2 (Enterprise) ──
  { id: "APEX-C1", number: "C1", bank: "APEX", row: "1", lockerType: "enterprise",
    memberName: "Kevin Owens / Anthony Hoskin / James Collins",
    nameplateLabel: "Owens · Hoskin · Collins",
    keyCode: "C1", isAvailable: false, paymentOverdue: false,
    notes: "Corner enterprise — 3 members" },
  { id: "APEX-1",  number: "1",  bank: "APEX", row: "1", lockerType: "corporate",
    memberName: "Mark McClurkan",
    nameplateLabel: "McClurkan",
    keyCode: "K-001", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-2",  number: "2",  bank: "APEX", row: "1", lockerType: "corporate",
    memberName: "Eric Hall",
    nameplateLabel: "Hall",
    keyCode: "K-002", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-3",  number: "3",  bank: "APEX", row: "1", lockerType: "corporate",
    memberName: "Ben Dailey / Chris Ayon",
    nameplateLabel: "Dailey · Ayon",
    keyCode: "K-003", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-4",  number: "4",  bank: "APEX", row: "1", lockerType: "corporate",
    memberName: "Lee Osteguin",
    nameplateLabel: "Osteguin",
    keyCode: "K-004", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-5",  number: "5",  bank: "APEX", row: "1", lockerType: "corporate",
    memberName: "Mark Rogers / Misty Rogers",
    nameplateLabel: "Rogers · Rogers",
    keyCode: "K-005", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-6",  number: "6",  bank: "APEX", row: "1", lockerType: "corporate",
    memberName: "Jim Russell",
    nameplateLabel: "Russell",
    keyCode: "K-006", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-7",  number: "7",  bank: "APEX", row: "1", lockerType: "corporate",
    memberName: "Lathan Hendricks / Jim Stevens",
    nameplateLabel: "Hendricks · Stevens",
    keyCode: "K-007", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-8",  number: "8",  bank: "APEX", row: "1", lockerType: "corporate",
    memberName: "Jonathan Scott",
    nameplateLabel: "Scott",
    keyCode: "K-008", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-9",  number: "9",  bank: "APEX", row: "1", lockerType: "corporate",
    memberName: "Albert Cooksey / Joe Akers",
    nameplateLabel: "Cooksey · Akers",
    keyCode: "K-009", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-10", number: "10", bank: "APEX", row: "1", lockerType: "corporate",
    memberName: "Jay Bass / Mike Ledo",
    nameplateLabel: "Bass · Ledo",
    keyCode: "K-010", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-C2", number: "C2", bank: "APEX", row: "1", lockerType: "enterprise",
    memberName: null, nameplateLabel: null,
    keyCode: "C2", isAvailable: true, paymentOverdue: false,
    notes: "Corner enterprise — available" },

  // ── Row 2: 11-14 (Individual), 37 (Oversized), 15-18 (Individual) ──
  { id: "APEX-11", number: "11", bank: "APEX", row: "2", lockerType: "individual",
    memberName: "Matt Sapaula", nameplateLabel: "Sapaula",
    keyCode: "K-011", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-12", number: "12", bank: "APEX", row: "2", lockerType: "individual",
    memberName: "Willie Turpin", nameplateLabel: "Turpin",
    keyCode: "K-012", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-13", number: "13", bank: "APEX", row: "2", lockerType: "individual",
    memberName: "Johnnie Goodner", nameplateLabel: "Goodner",
    keyCode: "K-013", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-14", number: "14", bank: "APEX", row: "2", lockerType: "individual",
    memberName: "Craig & Nichole Allridge", nameplateLabel: "Allridge",
    keyCode: "K-014", isAvailable: false, paymentOverdue: false, notes: null },
  // Eliot's oversized locker — physically spans 4 individual locker widths
  { id: "APEX-37", number: "37", bank: "APEX", row: "2", lockerType: "oversized",
    memberName: "Eliot Hamerman", nameplateLabel: "Hamerman",
    keyCode: "K-037", isAvailable: false, paymentOverdue: false,
    notes: "Lucky 13 — custom oversized membership (4-locker width)" },
  { id: "APEX-15", number: "15", bank: "APEX", row: "2", lockerType: "individual",
    memberName: "Aaron Klause / Keisha Klause", nameplateLabel: "Klause",
    keyCode: "K-015", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-16", number: "16", bank: "APEX", row: "2", lockerType: "individual",
    memberName: "AJ Faulk / Anthony Jones", nameplateLabel: "Faulk · Jones",
    keyCode: "K-016", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-17", number: "17", bank: "APEX", row: "2", lockerType: "individual",
    memberName: "Grady Yates", nameplateLabel: "Yates",
    keyCode: "K-017", isAvailable: false, paymentOverdue: false, notes: "Pending move" },
  { id: "APEX-18", number: "18", bank: "APEX", row: "2", lockerType: "individual",
    memberName: "Grady Yates", nameplateLabel: "Yates",
    keyCode: "K-018", isAvailable: false, paymentOverdue: false, notes: null },

  // ── Row 3: C3 (Enterprise), 19-26 (Individual), C4 (Enterprise) ──
  { id: "APEX-C3", number: "C3", bank: "APEX", row: "3", lockerType: "enterprise",
    memberName: null, nameplateLabel: null,
    keyCode: "C3", isAvailable: true, paymentOverdue: false,
    notes: "Corner enterprise — available" },
  { id: "APEX-19", number: "19", bank: "APEX", row: "3", lockerType: "individual",
    memberName: "Daniel Himel / Carey Himel", nameplateLabel: "Himel",
    keyCode: "K-019", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-20", number: "20", bank: "APEX", row: "3", lockerType: "individual",
    memberName: "Kelly Haney / Jana Waddle", nameplateLabel: "Haney · Waddle",
    keyCode: "K-020", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-21", number: "21", bank: "APEX", row: "3", lockerType: "individual",
    memberName: "Duane Okinaka", nameplateLabel: "Okinaka",
    keyCode: "K-021", isAvailable: false, paymentOverdue: false, notes: "Pending move from Jim Russell" },
  { id: "APEX-22", number: "22", bank: "APEX", row: "3", lockerType: "individual",
    memberName: "Duane Okinaka", nameplateLabel: "Okinaka",
    keyCode: "K-022", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-23", number: "23", bank: "APEX", row: "3", lockerType: "individual",
    memberName: "William Traylor", nameplateLabel: "Traylor",
    keyCode: "K-023", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-24", number: "24", bank: "APEX", row: "3", lockerType: "individual",
    memberName: "Garrett Reed", nameplateLabel: "Reed",
    keyCode: "K-024", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-25", number: "25", bank: "APEX", row: "3", lockerType: "individual",
    memberName: "Mario D", nameplateLabel: "Mario D",
    keyCode: "K-025", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-26", number: "26", bank: "APEX", row: "3", lockerType: "individual",
    memberName: "Bob Matthews", nameplateLabel: "Matthews",
    keyCode: "K-026", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-C4", number: "C4", bank: "APEX", row: "3", lockerType: "enterprise",
    memberName: "Maurice Sauls / Ty Demery / Adrian Borunda",
    nameplateLabel: "Sauls · Demery · Borunda",
    keyCode: "C4", isAvailable: false, paymentOverdue: false,
    notes: "Corner enterprise — 3 members" },

  // ── Row 4: 27-36 (Individual) ──
  { id: "APEX-27", number: "27", bank: "APEX", row: "4", lockerType: "individual",
    memberName: "Chris Pennington", nameplateLabel: "Pennington",
    keyCode: "K-027", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-28", number: "28", bank: "APEX", row: "4", lockerType: "individual",
    memberName: "Jason Wayne", nameplateLabel: "Wayne",
    keyCode: "K-028", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-29", number: "29", bank: "APEX", row: "4", lockerType: "individual",
    memberName: "DJ Collins", nameplateLabel: "Collins",
    keyCode: "K-029", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-30", number: "30", bank: "APEX", row: "4", lockerType: "individual",
    memberName: "Mario Avilia", nameplateLabel: "Avilia",
    keyCode: "K-030", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-31", number: "31", bank: "APEX", row: "4", lockerType: "individual",
    memberName: "Victor Garcia", nameplateLabel: "Garcia",
    keyCode: "K-031", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-32", number: "32", bank: "APEX", row: "4", lockerType: "individual",
    memberName: "Chris Hockenberry / Oliver Pratt", nameplateLabel: "Hockenberry · Pratt",
    keyCode: "K-032", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-33", number: "33", bank: "APEX", row: "4", lockerType: "individual",
    memberName: null, nameplateLabel: null,
    keyCode: "K-033", isAvailable: true, paymentOverdue: false, notes: null },
  { id: "APEX-34", number: "34", bank: "APEX", row: "4", lockerType: "individual",
    memberName: "Jamond Hackley", nameplateLabel: "Hackley",
    keyCode: "K-034", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-35", number: "35", bank: "APEX", row: "4", lockerType: "individual",
    memberName: "Bizzy B McCain", nameplateLabel: "McCain",
    keyCode: "K-035", isAvailable: false, paymentOverdue: false, notes: null },
  { id: "APEX-36", number: "36", bank: "APEX", row: "4", lockerType: "individual",
    memberName: "Ed Faulkner", nameplateLabel: "Faulkner",
    keyCode: "K-036", isAvailable: false, paymentOverdue: false, notes: null },
];

// ─── Atabey Bank seed data ────────────────────────────────────────────────────

const ATABEY_COLS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'];
const ATABEY_ASSIGNMENTS: Record<string, { name: string; nameplate?: string; keyCode?: string; notes?: string; paymentOverdue?: boolean }> = {
  "1A": { name: "Scott Bates",          nameplate: "Bates",          keyCode: "A-1A" },
  "1B": { name: "Ed Eaton",             nameplate: "Eaton",          keyCode: "A-1B" },
  "1C": { name: "Robert Bell",          nameplate: "Bell",           keyCode: "A-1C" },
  "1D": { name: "Omer Sohail",          nameplate: "Sohail",         keyCode: "A-1D", notes: "Needs key" },
  "1E": { name: "Norris Washington",    nameplate: "Washington",     keyCode: "A-1E", notes: "Needs key" },
  "1F": { name: "Marc Sherron",         nameplate: "Sherron",        keyCode: "A-1F" },
  "1G": { name: "Larry Brantley",       nameplate: "Brantley",       keyCode: "A-1G" },
  "1H": { name: "Chef Chris",           nameplate: "Chef Chris",     keyCode: "A-1H" },
  "1I": { name: "Edward Warren",        nameplate: "Warren",         keyCode: "A-1I" },
  "1K": { name: "Justen Franklin",      nameplate: "Franklin",       keyCode: "A-1K", notes: "Needs key" },
  "1L": { name: "Rene Salias",          nameplate: "Salias",         keyCode: "A-1L" },
  "1M": { name: "Stephen Fly",          nameplate: "Fly",            keyCode: "A-1M" },
  "1N": { name: "Scott Bakelman",       nameplate: "Bakelman",       keyCode: "A-1N", notes: "No membership on file" },
  "1O": { name: "Moises Perezcid",      nameplate: "Perezcid",       keyCode: "A-1O" },
  "1P": { name: "Mr. Wilson",           nameplate: "Wilson",         keyCode: "A-1P" },
  "2A": { name: "Al Brodie",            nameplate: "Brodie",         keyCode: "A-2A" },
  "2B": { name: "Bent Williams",        nameplate: "Williams",       keyCode: "A-2B" },
  "2D": { name: "Joe Tellez",           nameplate: "Tellez",         keyCode: "A-2D" },
  "2E": { name: "Michael Gurley",       nameplate: "Gurley",         keyCode: "A-2E" },
  "2F": { name: "Davie Buyanga",        nameplate: "Buyanga",        keyCode: "A-2F" },
  "2G": { name: "Jason Wayne",          nameplate: "Wayne",          keyCode: "A-2G" },
  "2H": { name: "Emerson Funes",        nameplate: "Funes",          keyCode: "A-2H" },
  "2I": { name: "Rhonda Torres",        nameplate: "Torres",         keyCode: "A-2I" },
  "2J": { name: "Ironroot",             nameplate: "Ironroot",       keyCode: "A-2J" },
  "2K": { name: "Brian Pennington",     nameplate: "Pennington",     keyCode: "A-2K" },
  "2L": { name: "Geoffery Clark",       nameplate: "Clark",          keyCode: "A-2L", notes: "Needs key" },
  "2M": { name: "Sean Durham",          nameplate: "Durham",         keyCode: "A-2M" },
  "2N": { name: "Derrick Coleman",      nameplate: "Coleman",        keyCode: "A-2N" },
  "2O": { name: "Antuan Wilbon",        nameplate: "Wilbon",         keyCode: "A-2O" },
  "2P": { name: "Chris Kirby",          nameplate: "Kirby",          keyCode: "A-2P" },
  "3A": { name: "Ajit 'AJ' Samuel",     nameplate: "Samuel",         keyCode: "A-3A" },
  "3B": { name: "Cruce Brooks",         nameplate: "Brooks",         keyCode: "A-3B" },
  "3E": { name: "John Soliz",           nameplate: "Soliz",          keyCode: "A-3E", notes: "Needs key" },
  "3F": { name: "Susan Edmonds",        nameplate: "Edmonds",        keyCode: "A-3F" },
  "3H": { name: "Chris Ocker",          nameplate: "Ocker",          keyCode: "A-3H" },
  "3J": { name: "Scott Powell",         nameplate: "Powell",         keyCode: "A-3J" },
  "3K": { name: "Damon Marra",          nameplate: "Marra",          keyCode: "A-3K" },
  "3L": { name: "Jim Stanco",           nameplate: "Stanco",         keyCode: "A-3L" },
  "3M": { name: "Jobin Mathai",         nameplate: "Mathai",         keyCode: "A-3M" },
  "3O": { name: "Jasmine Mininni",      nameplate: "Mininni",        keyCode: "A-3O" },
  "3P": { name: "Daniel Joiner",        nameplate: "Joiner",         keyCode: "A-3P", notes: "Needs key" },
  "4A": { name: "Ed Faulkner",          nameplate: "Faulkner",       keyCode: "A-4A" },
  "4B": { name: "Dayshoun Richard",     nameplate: "Richard",        keyCode: "A-4B" },
  "4C": { name: "Eric Curly",           nameplate: "Curly",          keyCode: "A-4C", notes: "Not paying — reapplied online", paymentOverdue: true },
  "4D": { name: "Bryan Ramsey",         nameplate: "Ramsey",         keyCode: "A-4D" },
  "4E": { name: "Dustin Carter",        nameplate: "Carter",         keyCode: "A-4E" },
  "4F": { name: "Alex Krueger",         nameplate: "Krueger",        keyCode: "A-4F" },
  "4G": { name: "Maurice Bean",         nameplate: "Bean",           keyCode: "A-4G", notes: "Update card needed", paymentOverdue: true },
  "4H": { name: "Wayne Ferguson",       nameplate: "Ferguson",       keyCode: "A-4H" },
  "4I": { name: "Emerson Funes",        nameplate: "Funes",          keyCode: "A-4I", notes: "Move to 2H" },
  "4K": { name: "Simon Villarreal",     nameplate: "Villarreal",     keyCode: "A-4K" },
  "4L": { name: "Wade Candor",          nameplate: "Candor",         keyCode: "A-4L" },
  "4P": { name: "Brian Smith",          nameplate: "Smith",          keyCode: "A-4P", notes: "Comp 1 yr — 3/19/24" },
  "5E": { name: "Dustin Carter",        nameplate: "Carter",         keyCode: "A-5E" },
  "5O": { name: "Alden De Armas",       nameplate: "De Armas",       keyCode: "A-5O", notes: "Move to 1E" },
  "5P": { name: "Jim Trader",           nameplate: "Trader",         keyCode: "A-5P" },
  "6M": { name: "Jobin #2",             nameplate: "Jobin #2",       keyCode: "A-6M", notes: "Bottle Concierge" },
  "6N": { name: "Jim Trader",           nameplate: "Trader",         keyCode: "A-6N", notes: "Bottle Concierge" },
};

function buildAtabeyLockers(): LockerSeed[] {
  const lockers: LockerSeed[] = [];
  for (let row = 1; row <= 6; row++) {
    for (const col of ATABEY_COLS) {
      const id = `${row}${col}`;
      const a = ATABEY_ASSIGNMENTS[id];
      lockers.push({
        id: `AT-${id}`,
        number: id,
        bank: "Atabey",
        row: String(row),
        lockerType: "individual",
        memberName: a?.name ?? null,
        nameplateLabel: a?.nameplate ?? null,
        keyCode: a?.keyCode ?? null,
        isAvailable: !a,
        paymentOverdue: a?.paymentOverdue ?? false,
        notes: a?.notes ?? (row === 6 && !a ? "Bottle Concierge slot" : null),
      });
    }
  }
  return lockers;
}

const ATABEY_LOCKERS = buildAtabeyLockers();

// ─── Visionary Bank seed data ─────────────────────────────────────────────────

const VISIONARY_ASSIGNMENTS: Record<string, { name: string; nameplate?: string; keyCode?: string }> = {
  "1A": { name: "Jerrod Henderson",  nameplate: "Henderson",  keyCode: "V-1A" },
  "2A": { name: "Jeff Axelrod",      nameplate: "Axelrod",    keyCode: "V-2A" },
  "4A": { name: "Anthony White",     nameplate: "White",      keyCode: "V-4A" },
  "2B": { name: "Michael Rubin",     nameplate: "Rubin",      keyCode: "V-2B" },
  "3B": { name: "Eric Medcalf",      nameplate: "Medcalf",    keyCode: "V-3B" },
  "2C": { name: "Jerrod Henderson",  nameplate: "Henderson",  keyCode: "V-2C" },
  "1E": { name: "Kevin Guthrie",     nameplate: "Guthrie",    keyCode: "V-1E" },
  "2E": { name: "Kevin Guthrie",     nameplate: "Guthrie",    keyCode: "V-2E" },
  "3E": { name: "Clark Griffith",    nameplate: "Griffith",   keyCode: "V-3E" },
  "4E": { name: "Greg Taylor",       nameplate: "Taylor",     keyCode: "V-4E" },
  "5E": { name: "Shannon Garson",    nameplate: "Garson",     keyCode: "V-5E" },
  "3A": { name: "Thaddus",           nameplate: "Thaddus",    keyCode: "V-3A" },
};

function buildVisionaryLockers(): LockerSeed[] {
  const lockers: LockerSeed[] = [];
  for (let row = 1; row <= 5; row++) {
    for (const col of ATABEY_COLS) {
      const id = `${row}${col}`;
      const a = VISIONARY_ASSIGNMENTS[id];
      lockers.push({
        id: `VIS-${id}`,
        number: id,
        bank: "Visionary",
        row: String(row),
        lockerType: "individual",
        memberName: a?.name ?? null,
        nameplateLabel: a?.nameplate ?? null,
        keyCode: a?.keyCode ?? null,
        isAvailable: !a,
        paymentOverdue: false,
        notes: null,
      });
    }
  }
  return lockers;
}

const VISIONARY_LOCKERS = buildVisionaryLockers();

// ─── Bank config ──────────────────────────────────────────────────────────────

const BANK_CONFIG: Record<BankKey, { color: string; glow: string; occupiedBg: string }> = {
  APEX:      { color: ICC_RED,  glow: `0 0 8px ${ICC_RED}66`,  occupiedBg: "rgba(200,16,46,0.18)" },
  Atabey:    { color: GOLD,     glow: `0 0 8px ${GOLD}55`,     occupiedBg: "rgba(212,175,55,0.14)" },
  Visionary: { color: SILVER,   glow: `0 0 8px ${SILVER}44`,   occupiedBg: "rgba(136,153,204,0.13)" },
};

// ─── Locker Cell Component ────────────────────────────────────────────────────

interface LockerCellProps {
  locker: LockerSeed;
  bank: BankKey;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
}

function LockerCell({ locker, bank, isSelected, isHighlighted, onClick }: LockerCellProps) {
  const cfg = BANK_CONFIG[bank];
  const { isAvailable, paymentOverdue, lockerType } = locker;

  // Size based on locker type
  const isEnterprise = lockerType === "enterprise";
  const isCorporate  = lockerType === "corporate";
  const isOversized  = lockerType === "oversized";

  const minW = isEnterprise ? "80px" : isCorporate ? "68px" : isOversized ? "200px" : "58px";
  const minH = isEnterprise ? "72px" : isCorporate ? "64px" : isOversized ? "64px" : "58px";

  // Background color priority: selected > overdue > available > occupied
  const bg = isSelected
    ? (paymentOverdue ? "rgba(200,16,46,0.3)" : cfg.occupiedBg)
    : paymentOverdue
    ? "rgba(200,16,46,0.18)"
    : isAvailable
    ? "rgba(34,197,94,0.08)"
    : cfg.occupiedBg;

  const border = isSelected
    ? (paymentOverdue ? ICC_RED : cfg.color)
    : isHighlighted
    ? cfg.color
    : paymentOverdue
    ? ICC_RED
    : isAvailable
    ? `${GREEN}66`
    : `${cfg.color}55`;

  const boxShadow = isSelected
    ? (paymentOverdue ? `0 0 10px ${ICC_RED}88` : cfg.glow)
    : isHighlighted
    ? cfg.glow
    : isAvailable
    ? `0 0 6px ${GREEN}44`
    : paymentOverdue
    ? `0 0 6px ${ICC_RED}44`
    : "none";

  const labelColor = paymentOverdue ? ICC_RED : isAvailable ? GREEN : cfg.color;

  return (
    <div
      onClick={onClick}
      title={locker.memberName ?? "Available"}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        boxShadow,
        borderRadius: "5px",
        padding: "5px 6px",
        cursor: "pointer",
        minHeight: minH,
        minWidth: minW,
        maxWidth: isOversized ? "220px" : undefined,
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
        fontSize: isEnterprise ? "11px" : "10px",
        fontFamily: "'Bebas Neue', sans-serif",
        letterSpacing: "0.06em",
        color: labelColor,
        lineHeight: 1,
      }}>
        {locker.number}
      </span>

      {/* Nameplate label */}
      {locker.nameplateLabel && (
        <span style={{
          fontSize: isEnterprise ? "8px" : isCorporate ? "7.5px" : isOversized ? "9px" : "7px",
          color: "#C8C4BC",
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: isOversized ? "190px" : isEnterprise ? "74px" : "56px",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: isEnterprise ? 3 : 2,
          WebkitBoxOrient: "vertical",
          fontWeight: 500,
        }}>
          {locker.nameplateLabel}
        </span>
      )}

      {/* Key code */}
      {locker.keyCode && (
        <span style={{
          fontSize: "6.5px",
          color: "#4A4540",
          lineHeight: 1,
          fontFamily: "monospace",
        }}>
          {locker.keyCode}
        </span>
      )}

      {/* Available indicator */}
      {isAvailable && (
        <span style={{ fontSize: "7px", color: GREEN, lineHeight: 1, fontWeight: 700 }}>OPEN</span>
      )}

      {/* Payment overdue indicator */}
      {paymentOverdue && (
        <div style={{ position: "absolute", top: "3px", right: "3px" }}>
          <AlertTriangle size={8} color={ICC_RED} />
        </div>
      )}

      {/* Note dot */}
      {locker.notes && !paymentOverdue && (
        <div style={{
          position: "absolute",
          top: "3px",
          right: "3px",
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: GOLD,
        }} />
      )}

      {/* Locker type badge for enterprise/corporate/oversized */}
      {(isEnterprise || isOversized) && (
        <span style={{
          fontSize: "5.5px",
          color: isEnterprise ? "#9B7FC7" : GOLD,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          lineHeight: 1,
        }}>
          {isEnterprise ? "ENTERPRISE" : "OVERSIZED"}
        </span>
      )}
    </div>
  );
}

// ─── APEX Bank Renderer (custom physical layout) ──────────────────────────────

function ApexBankGrid({ lockers, selectedId, highlightedIds, onSelect }: {
  lockers: LockerSeed[];
  selectedId: string | null;
  highlightedIds: Set<string>;
  onSelect: (l: LockerSeed) => void;
}) {
  const byId = useMemo(() => Object.fromEntries(lockers.map(l => [l.id, l])), [lockers]);
  const get = (id: string) => byId[id];

  const rowLabels: Record<string, string> = {
    "1": "TOP ROW — Corporate Lockers (2 members each) + Enterprise Corners",
    "2": "MID ROW — Individual + Eliot's Oversized (4-locker width)",
    "3": "MID ROW — Individual + Enterprise Corners",
    "4": "BOTTOM ROW — Individual Lockers",
  };

  const rows: Array<{ key: string; ids: string[] }> = [
    { key: "1", ids: ["APEX-C1","APEX-1","APEX-2","APEX-3","APEX-4","APEX-5","APEX-6","APEX-7","APEX-8","APEX-9","APEX-10","APEX-C2"] },
    { key: "2", ids: ["APEX-11","APEX-12","APEX-13","APEX-14","APEX-37","APEX-15","APEX-16","APEX-17","APEX-18"] },
    { key: "3", ids: ["APEX-C3","APEX-19","APEX-20","APEX-21","APEX-22","APEX-23","APEX-24","APEX-25","APEX-26","APEX-C4"] },
    { key: "4", ids: ["APEX-27","APEX-28","APEX-29","APEX-30","APEX-31","APEX-32","APEX-33","APEX-34","APEX-35","APEX-36"] },
  ];

  return (
    <div className="space-y-3">
      {rows.map(({ key, ids }) => (
        <div key={key}>
          <div style={{ fontSize: "8px", color: "#3A3A3A", letterSpacing: "0.1em", marginBottom: "5px", fontFamily: "'Bebas Neue', sans-serif" }}>
            {rowLabels[key]}
          </div>
          <div style={{ display: "flex", gap: "5px", flexWrap: "nowrap", alignItems: "flex-end" }}>
            {ids.map(id => {
              const l = get(id);
              if (!l) return null;
              return (
                <LockerCell
                  key={l.id}
                  locker={l}
                  bank="APEX"
                  isSelected={selectedId === l.id}
                  isHighlighted={highlightedIds.has(l.id)}
                  onClick={() => onSelect(l)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Generic Bank Grid (Atabey / Visionary) ───────────────────────────────────

function GenericBankGrid({ lockers, bank, selectedId, highlightedIds, onSelect }: {
  lockers: LockerSeed[];
  bank: BankKey;
  selectedId: string | null;
  highlightedIds: Set<string>;
  onSelect: (l: LockerSeed) => void;
}) {
  const rowGroups: Record<string, LockerSeed[]> = {};
  for (const l of lockers) {
    if (!rowGroups[l.row]) rowGroups[l.row] = [];
    rowGroups[l.row].push(l);
  }
  return (
    <div className="space-y-2">
      {Object.entries(rowGroups).map(([rowKey, rowLockers]) => (
        <div key={rowKey}>
          <div style={{ fontSize: "8px", color: "#3A3A3A", letterSpacing: "0.1em", marginBottom: "4px", fontFamily: "'Bebas Neue', sans-serif" }}>
            ROW {rowKey}
          </div>
          <div style={{ display: "flex", gap: "4px", flexWrap: "nowrap" }}>
            {rowLockers.map(locker => (
              <LockerCell
                key={locker.id}
                locker={locker}
                bank={bank}
                isSelected={selectedId === locker.id}
                isHighlighted={highlightedIds.has(locker.id)}
                onClick={() => onSelect(locker)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LockerDiagram() {
  const { isAuthenticated } = useAuth();
  const [activeBank, setActiveBank] = useState<BankKey>("APEX");
  const [selectedLocker, setSelectedLocker] = useState<LockerSeed | null>(null);
  const [search, setSearch] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ memberName: "", notes: "", action: "assign" as "assign" | "unassign" });
  const [editForm, setEditForm] = useState({ keyCode: "", nameplateLabel: "", notes: "", paymentOverdue: false });
  const [showHistory, setShowHistory] = useState(false);

  const { data: membersRaw } = trpc.members.list.useQuery();
  const members = membersRaw ?? [];

  const { data: historyData = [], refetch: refetchHistory } = trpc.lockers.moveHistory.useQuery(
    { lockerNumber: selectedLocker?.number },
    { enabled: showHistory && !!selectedLocker }
  );

  const assignLocker = trpc.lockers.assign.useMutation({
    onSuccess: () => {
      toast.success(assignForm.action === "unassign" ? "Locker unassigned" : "Locker assigned");
      setShowAssignModal(false);
      setAssignForm({ memberName: "", notes: "", action: "assign" });
      refetchHistory();
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const updateLocker = trpc.lockers.updateLocker.useMutation({
    onSuccess: () => {
      toast.success("Locker details updated");
      setShowEditModal(false);
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const bankLockers: Record<BankKey, LockerSeed[]> = {
    APEX: APEX_LOCKERS,
    Atabey: ATABEY_LOCKERS,
    Visionary: VISIONARY_LOCKERS,
  };

  const currentLockers = bankLockers[activeBank];
  const searchLower = search.toLowerCase();
  const highlightedIds = search.length > 1
    ? new Set(currentLockers.filter(l =>
        l.memberName?.toLowerCase().includes(searchLower) ||
        l.nameplateLabel?.toLowerCase().includes(searchLower) ||
        l.number.toLowerCase().includes(searchLower) ||
        l.keyCode?.toLowerCase().includes(searchLower)
      ).map(l => l.id))
    : new Set<string>();

  const occupied = currentLockers.filter(l => !l.isAvailable).length;
  const available = currentLockers.filter(l => l.isAvailable).length;
  const overdue = currentLockers.filter(l => l.paymentOverdue).length;
  const cfg = BANK_CONFIG[activeBank];

  function handleSelectLocker(lockerOrFn: LockerSeed | ((prev: LockerSeed | null) => LockerSeed | null)) {
    if (typeof lockerOrFn === "function") {
      setSelectedLocker(lockerOrFn);
    } else {
      setSelectedLocker(prev => prev?.id === lockerOrFn.id ? null : lockerOrFn);
    }
    setShowHistory(false);
  }

  return (
    <div style={{ background: "#080808", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
          <Lock size={20} color={ICC_RED} />
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", color: "#E8E4DC", letterSpacing: "0.08em", margin: 0 }}>
            LOCKER DIAGRAM
          </h1>
        </div>
        <p style={{ fontSize: "0.72rem", color: "#4A4540", margin: 0 }}>
          207 total lockers across 3 banks · Click any locker to view details, assign, or edit key code
        </p>
        {/* Google Sheet sync note */}
        <div style={{ marginTop: "8px", padding: "8px 12px", borderRadius: "6px", background: "rgba(136,153,204,0.06)", border: "1px solid rgba(136,153,204,0.15)", fontSize: "0.7rem", color: "#6B6560" }}>
          <span style={{ color: SILVER, fontWeight: 600 }}>Google Sheet Sync: </span>
          The locker data is currently seeded from the V3 Locker Diagram sheet. Once Lightspeed is connected, member payment status will auto-sync.
          To push changes back to Google Sheets, use the "Export to Sheet" button (coming with Sheets integration). Until then, this diagram is the source of truth — update it here and copy changes to the sheet manually.
        </div>
      </div>

      {/* Bank Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
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
              <span style={{ marginLeft: "8px", fontSize: "0.7rem", opacity: 0.7 }}>{occ}/{tot}</span>
            </button>
          );
        })}
      </div>

      {/* Stats Row */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        {[
          { label: "Occupied",  value: occupied, color: cfg.color },
          { label: "Available", value: available, color: GREEN },
          { label: "Overdue",   value: overdue,   color: ICC_RED },
          { label: "Total",     value: currentLockers.length, color: "#555" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "8px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: "1.2rem", fontFamily: "'Bebas Neue', sans-serif", color: stat.color }}>{stat.value}</span>
            <span style={{ fontSize: "0.62rem", color: "#444", letterSpacing: "0.05em" }}>{stat.label.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "14px", flexWrap: "wrap" }}>
        {[
          { label: "Occupied",         color: cfg.color,  border: `${cfg.color}55` },
          { label: "Available",        color: GREEN,       border: `${GREEN}66` },
          { label: "Payment Overdue",  color: ICC_RED,     border: ICC_RED },
          { label: "Note ●",           color: GOLD,        border: `${GOLD}55` },
          { label: "Enterprise",       color: "#9B7FC7",   border: "#9B7FC744" },
          { label: "Oversized",        color: GOLD,        border: `${GOLD}55` },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: `${item.color}22`, border: `1px solid ${item.border}` }} />
            <span style={{ fontSize: "0.68rem", color: "#444" }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: "300px", marginBottom: "16px" }}>
        <Search size={13} color="#444" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, locker #, or key code..."
          style={{ width: "100%", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "8px 10px 8px 32px", color: "#E8E4DC", fontSize: "0.78rem", outline: "none" }}
        />
      </div>

      {/* Main layout: grid + detail panel */}
      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>

        {/* Locker Grid */}
        <div style={{ flex: 1, overflowX: "auto" }}>
          {activeBank === "APEX" ? (
            <ApexBankGrid
              lockers={currentLockers}
              selectedId={selectedLocker?.id ?? null}
              highlightedIds={highlightedIds}
              onSelect={handleSelectLocker}
            />
          ) : (
            <GenericBankGrid
              lockers={currentLockers}
              bank={activeBank}
              selectedId={selectedLocker?.id ?? null}
              highlightedIds={highlightedIds}
              onSelect={handleSelectLocker}
            />
          )}
        </div>

        {/* Detail Panel */}
        {selectedLocker && (
          <div style={{ width: "300px", flexShrink: 0, background: "#0d0d0d", border: `1px solid ${cfg.color}44`, borderRadius: "8px", padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", color: cfg.color, letterSpacing: "0.08em" }}>
                LOCKER {selectedLocker.number}
              </span>
              <button onClick={() => setSelectedLocker(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#444" }}>
                <X size={16} />
              </button>
            </div>

            {/* Status badges */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
              <span style={{
                display: "inline-block", padding: "3px 10px", borderRadius: "4px", fontSize: "0.68rem",
                fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em",
                background: selectedLocker.isAvailable ? "rgba(34,197,94,0.12)" : cfg.occupiedBg,
                color: selectedLocker.isAvailable ? GREEN : cfg.color,
                border: `1px solid ${selectedLocker.isAvailable ? GREEN : cfg.color}44`,
              }}>
                {selectedLocker.isAvailable ? "AVAILABLE" : "OCCUPIED"}
              </span>
              {selectedLocker.paymentOverdue && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "4px", fontSize: "0.68rem", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em", background: "rgba(200,16,46,0.15)", color: ICC_RED, border: "1px solid rgba(200,16,46,0.3)" }}>
                  <AlertTriangle size={9} /> PAYMENT OVERDUE
                </span>
              )}
              <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "4px", fontSize: "0.68rem", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em", background: "#111", color: "#555", border: "1px solid #1a1a1a" }}>
                {selectedLocker.lockerType.toUpperCase()}
              </span>
            </div>

            {/* Key Code */}
            {selectedLocker.keyCode && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", padding: "8px", background: "#111", borderRadius: "4px", border: "1px solid #1a1a1a" }}>
                <Key size={12} color={GOLD} />
                <div>
                  <div style={{ fontSize: "0.6rem", color: "#444", letterSpacing: "0.08em" }}>KEY CODE</div>
                  <div style={{ fontSize: "0.82rem", color: "#E8E4DC", fontFamily: "monospace", fontWeight: 600 }}>{selectedLocker.keyCode}</div>
                </div>
              </div>
            )}

            {/* Nameplate */}
            {selectedLocker.nameplateLabel && (
              <div style={{ marginBottom: "10px" }}>
                <div style={{ fontSize: "0.6rem", color: "#444", letterSpacing: "0.08em", marginBottom: "3px" }}>NAMEPLATE</div>
                <div style={{ fontSize: "0.88rem", color: "#E8E4DC", fontWeight: 600 }}>{selectedLocker.nameplateLabel}</div>
              </div>
            )}

            {/* Current occupant(s) */}
            {!selectedLocker.isAvailable && selectedLocker.memberName && (
              <div style={{ marginBottom: "10px" }}>
                <div style={{ fontSize: "0.6rem", color: "#444", letterSpacing: "0.08em", marginBottom: "4px" }}>MEMBER(S)</div>
                <div style={{ fontSize: "0.82rem", color: "#E8E4DC", lineHeight: 1.6 }}>
                  {selectedLocker.memberName.split(" / ").map((name, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Users size={10} color={cfg.color} />
                      <span>{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact info (placeholder — will populate from Lightspeed when connected) */}
            <div style={{ marginBottom: "10px", padding: "8px", background: "#111", borderRadius: "4px", border: "1px solid #1a1a1a" }}>
              <div style={{ fontSize: "0.6rem", color: "#444", letterSpacing: "0.08em", marginBottom: "6px" }}>CONTACT INFO</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {[
                  { icon: Phone, label: "Phone", value: selectedLocker.phone ?? "—" },
                  { icon: Mail,  label: "Email", value: selectedLocker.email ?? "—" },
                  { icon: Calendar, label: "Birthday", value: selectedLocker.birthdate ?? "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Icon size={10} color="#444" />
                    <span style={{ fontSize: "0.68rem", color: "#444", minWidth: "52px" }}>{label}:</span>
                    <span style={{ fontSize: "0.72rem", color: value === "—" ? "#2A2A2A" : "#C8C4BC" }}>{value}</span>
                  </div>
                ))}
              </div>
              {!selectedLocker.phone && !selectedLocker.email && (
                <p style={{ fontSize: "0.62rem", color: "#2A2A2A", marginTop: "6px" }}>
                  Contact details auto-populate when Lightspeed is connected.
                </p>
              )}
            </div>

            {/* Notes */}
            {selectedLocker.notes && (
              <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "4px", padding: "8px", marginBottom: "10px" }}>
                <div style={{ fontSize: "0.6rem", color: GOLD, letterSpacing: "0.08em", marginBottom: "4px" }}>NOTE</div>
                <div style={{ fontSize: "0.75rem", color: "#aaa", lineHeight: 1.4 }}>{selectedLocker.notes}</div>
              </div>
            )}

            {/* Bank / row info */}
            <div style={{ fontSize: "0.62rem", color: "#2A2A2A", marginBottom: "12px" }}>
              Bank: {selectedLocker.bank} · Row {selectedLocker.row}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {selectedLocker.isAvailable ? (
                <button
                  onClick={() => { setAssignForm({ memberName: "", notes: "", action: "assign" }); setShowAssignModal(true); }}
                  style={{ background: cfg.occupiedBg, border: `1px solid ${cfg.color}55`, borderRadius: "4px", padding: "8px", color: cfg.color, fontSize: "0.72rem", cursor: "pointer", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  <Unlock size={11} /> ASSIGN MEMBER
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setAssignForm({ memberName: selectedLocker.memberName ?? "", notes: "", action: "assign" }); setShowAssignModal(true); }}
                    style={{ background: cfg.occupiedBg, border: `1px solid ${cfg.color}55`, borderRadius: "4px", padding: "8px", color: cfg.color, fontSize: "0.72rem", cursor: "pointer", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <ArrowRight size={11} /> REASSIGN / MOVE
                  </button>
                  <button
                    onClick={() => { setAssignForm({ memberName: "", notes: "", action: "unassign" }); setShowAssignModal(true); }}
                    style={{ background: "rgba(200,16,46,0.08)", border: "1px solid rgba(200,16,46,0.3)", borderRadius: "4px", padding: "8px", color: ICC_RED, fontSize: "0.72rem", cursor: "pointer", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <Lock size={11} /> UNASSIGN
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setEditForm({
                    keyCode: selectedLocker.keyCode ?? "",
                    nameplateLabel: selectedLocker.nameplateLabel ?? "",
                    notes: selectedLocker.notes ?? "",
                    paymentOverdue: selectedLocker.paymentOverdue,
                  });
                  setShowEditModal(true);
                }}
                style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: "4px", padding: "8px", color: GOLD, fontSize: "0.72rem", cursor: "pointer", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Edit3 size={11} /> EDIT KEY / NAMEPLATE
              </button>
              <button
                onClick={() => setShowHistory(h => !h)}
                style={{ background: "rgba(136,153,204,0.08)", border: "1px solid rgba(136,153,204,0.25)", borderRadius: "4px", padding: "8px", color: SILVER, fontSize: "0.72rem", cursor: "pointer", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <History size={11} /> {showHistory ? "HIDE HISTORY" : "VIEW HISTORY"}
              </button>
            </div>

            {/* Move History */}
            {showHistory && (
              <div style={{ marginTop: "12px" }}>
                <div style={{ fontSize: "0.6rem", color: "#444", letterSpacing: "0.08em", marginBottom: "8px" }}>MOVE HISTORY</div>
                {historyData.length === 0 ? (
                  <p style={{ fontSize: "0.7rem", color: "#333", textAlign: "center", padding: "12px 0" }}>No history yet</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", maxHeight: "200px", overflowY: "auto" }}>
                    {historyData.map((h: any) => (
                      <div key={h.id} style={{ background: "#111", borderRadius: "4px", padding: "7px", fontSize: "0.7rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                          <span style={{ color: h.action === "unassigned" ? ICC_RED : h.action === "moved" ? "#C4A35A" : GREEN, fontWeight: 700, textTransform: "uppercase", fontSize: "0.65rem" }}>{h.action}</span>
                          <span style={{ color: "#333", fontSize: "0.62rem" }}>{new Date(h.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}</span>
                        </div>
                        {h.fromMemberName && <div style={{ color: "#666" }}>From: {h.fromMemberName}</div>}
                        {h.toMemberName && <div style={{ color: "#E8E4DC" }}>To: {h.toMemberName}</div>}
                        {h.performedBy && <div style={{ color: "#444", fontSize: "0.62rem" }}>By: {h.performedBy}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Assign / Reassign Modal ── */}
      {showAssignModal && selectedLocker && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0d0d0d", border: `1px solid ${cfg.color}44`, borderRadius: "8px", padding: "24px", width: "340px", maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", color: cfg.color, letterSpacing: "0.08em" }}>
                {assignForm.action === "unassign" ? "UNASSIGN" : selectedLocker.isAvailable ? "ASSIGN" : "REASSIGN"} — LOCKER {selectedLocker.number}
              </span>
              <button onClick={() => setShowAssignModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#444" }}><X size={16} /></button>
            </div>
            {assignForm.action !== "unassign" && (
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "0.62rem", color: "#444", letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>MEMBER NAME</label>
                <input
                  value={assignForm.memberName}
                  onChange={e => setAssignForm(f => ({ ...f, memberName: e.target.value }))}
                  placeholder="e.g. John Smith / Jane Smith"
                  style={{ width: "100%", background: "#111", border: "1px solid #222", borderRadius: "4px", padding: "8px", color: "#E8E4DC", fontSize: "0.82rem" }}
                />
                {members.length > 0 && assignForm.memberName.length > 1 && (
                  <div style={{ marginTop: "4px", maxHeight: "100px", overflowY: "auto", background: "#0a0a0a", borderRadius: "4px", border: "1px solid #1a1a1a" }}>
                    {(members as any[]).filter((m: any) => m.name?.toLowerCase().includes(assignForm.memberName.toLowerCase())).slice(0, 5).map((m: any) => (
                      <div key={m.id} onClick={() => setAssignForm(f => ({ ...f, memberName: m.name }))} style={{ padding: "6px 10px", fontSize: "0.78rem", color: "#aaa", cursor: "pointer" }}>{m.name}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "0.62rem", color: "#444", letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>NOTES (OPTIONAL)</label>
              <input
                value={assignForm.notes}
                onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Reason for move, special instructions..."
                style={{ width: "100%", background: "#111", border: "1px solid #222", borderRadius: "4px", padding: "8px", color: "#E8E4DC", fontSize: "0.82rem" }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setShowAssignModal(false)} style={{ flex: 1, background: "transparent", border: "1px solid #222", borderRadius: "4px", padding: "10px", color: "#666", fontSize: "0.75rem", cursor: "pointer" }}>CANCEL</button>
              <button
                onClick={() => {
                  if (assignForm.action !== "unassign" && !assignForm.memberName.trim()) { toast.error("Member name is required"); return; }
                  assignLocker.mutate({
                    lockerNumber: selectedLocker.number,
                    memberId: null,
                    memberName: assignForm.action === "unassign" ? null : assignForm.memberName.trim(),
                    tier: (selectedLocker.bank === "APEX" ? "APEX" : selectedLocker.bank === "Atabey" ? "Atabey" : "Visionary") as any,
                    notes: assignForm.notes || undefined,
                  });
                }}
                disabled={assignLocker.isPending}
                style={{ flex: 1, background: assignForm.action === "unassign" ? "rgba(200,16,46,0.15)" : cfg.occupiedBg, border: `1px solid ${assignForm.action === "unassign" ? ICC_RED : cfg.color}55`, borderRadius: "4px", padding: "10px", color: assignForm.action === "unassign" ? ICC_RED : cfg.color, fontSize: "0.75rem", cursor: "pointer", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}
              >
                {assignLocker.isPending ? "SAVING..." : assignForm.action === "unassign" ? "CONFIRM UNASSIGN" : "CONFIRM"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Key / Nameplate Modal ── */}
      {showEditModal && selectedLocker && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0d0d0d", border: `1px solid ${GOLD}44`, borderRadius: "8px", padding: "24px", width: "340px", maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", color: GOLD, letterSpacing: "0.08em" }}>
                EDIT — LOCKER {selectedLocker.number}
              </span>
              <button onClick={() => setShowEditModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#444" }}><X size={16} /></button>
            </div>
            {[
              { label: "KEY CODE", field: "keyCode" as const, placeholder: "e.g. K-001" },
              { label: "NAMEPLATE LABEL", field: "nameplateLabel" as const, placeholder: "e.g. Smith · Jones" },
              { label: "NOTES", field: "notes" as const, placeholder: "Any special notes..." },
            ].map(({ label, field, placeholder }) => (
              <div key={field} style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "0.62rem", color: "#444", letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>{label}</label>
                <input
                  value={editForm[field] as string}
                  onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width: "100%", background: "#111", border: "1px solid #222", borderRadius: "4px", padding: "8px", color: "#E8E4DC", fontSize: "0.82rem" }}
                />
              </div>
            ))}
            <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
              <label style={{ fontSize: "0.62rem", color: "#444", letterSpacing: "0.08em" }}>PAYMENT OVERDUE</label>
              <button
                onClick={() => setEditForm(f => ({ ...f, paymentOverdue: !f.paymentOverdue }))}
                style={{ padding: "4px 12px", borderRadius: "4px", fontSize: "0.72rem", cursor: "pointer", fontFamily: "'Bebas Neue', sans-serif", background: editForm.paymentOverdue ? "rgba(200,16,46,0.15)" : "transparent", color: editForm.paymentOverdue ? ICC_RED : "#444", border: `1px solid ${editForm.paymentOverdue ? ICC_RED : "#2A2A2A"}` }}
              >
                {editForm.paymentOverdue ? "YES" : "NO"}
              </button>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setShowEditModal(false)} style={{ flex: 1, background: "transparent", border: "1px solid #222", borderRadius: "4px", padding: "10px", color: "#666", fontSize: "0.75rem", cursor: "pointer" }}>CANCEL</button>
              <button
                onClick={() => {
                  updateLocker.mutate({
                    lockerNumber: selectedLocker.number,
                    keyCode: editForm.keyCode || undefined,
                    nameplateLabel: editForm.nameplateLabel || undefined,
                    notes: editForm.notes || undefined,
                    paymentOverdue: editForm.paymentOverdue,
                  });
                }}
                disabled={updateLocker.isPending}
                style={{ flex: 1, background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "4px", padding: "10px", color: GOLD, fontSize: "0.75rem", cursor: "pointer", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}
              >
                {updateLocker.isPending ? "SAVING..." : "SAVE CHANGES"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
