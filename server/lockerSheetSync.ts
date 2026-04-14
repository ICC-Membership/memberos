/**
 * lockerSheetSync.ts — Google Sheets ↔ Locker Diagram bidirectional sync
 *
 * Sheet format (row 1 = headers):
 *   A: Locker Number | B: Section | C: Member Name | D: Tier | E: Key Code
 *   F: Nameplate | G: Type | H: Available | I: Notes | J: Assigned At
 *
 * Environment variables required:
 *   GOOGLE_SHEETS_LOCKER_ID  — the Google Sheets spreadsheet ID
 *   GOOGLE_SHEETS_LOCKER_TAB — sheet tab name (default: "Lockers")
 *
 * Uses the `gws` CLI via child_process.exec for all Sheets API calls.
 * This keeps the server dependency-free from googleapis while still
 * leveraging the authenticated gws session.
 */

import { exec } from "child_process";
import { promisify } from "util";
import { getDb } from "./db";
import { eq } from "drizzle-orm";

const execAsync = promisify(exec);

const SHEET_ID = process.env.GOOGLE_SHEETS_LOCKER_ID ?? "";
const SHEET_TAB = process.env.GOOGLE_SHEETS_LOCKER_TAB ?? "Lockers";

const HEADERS = [
  "Locker Number", "Section", "Member Name", "Tier", "Key Code",
  "Nameplate", "Type", "Available", "Notes", "Assigned At",
];

// ─── Helper: run a gws CLI command and return parsed JSON ────────────────────
async function gwsJson(args: string): Promise<any> {
  const { stdout } = await execAsync(`gws ${args}`);
  return JSON.parse(stdout.trim());
}

// ─── Helper: escape a cell value for Sheets API ─────────────────────────────
function cell(v: any): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

// ─── Export DB lockers → Google Sheet ────────────────────────────────────────
export async function exportLockersToSheet(): Promise<{ updated: number }> {
  if (!SHEET_ID) throw new Error("GOOGLE_SHEETS_LOCKER_ID env var not set");

  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { lockers } = await import("../drizzle/schema");
  const rows = await db.select().from(lockers).orderBy(lockers.section, lockers.lockerNumber);

  // Build values array: header row + data rows
  const values = [
    HEADERS,
    ...rows.map(r => [
      cell(r.lockerNumber),
      cell(r.section),
      cell(r.memberName),
      cell(r.tier),
      cell(r.keyCode),
      cell(r.nameplateLabel),
      cell(r.lockerType),
      r.isAvailable ? "Yes" : "No",
      cell(r.notes),
      r.assignedAt ? new Date(r.assignedAt).toLocaleDateString("en-US") : "",
    ]),
  ];

  // Clear existing data and write fresh
  await execAsync(
    `gws sheets spreadsheets values clear --spreadsheetId ${SHEET_ID} --range "${SHEET_TAB}"`
  );

  const valuesJson = JSON.stringify({ values });
  const tmpFile = `/tmp/locker_export_${Date.now()}.json`;
  const { writeFileSync } = await import("fs");
  writeFileSync(tmpFile, valuesJson);

  await execAsync(
    `gws sheets spreadsheets values update --spreadsheetId ${SHEET_ID} --range "${SHEET_TAB}!A1" --valueInputOption USER_ENTERED --body "$(cat ${tmpFile})"`
  );

  return { updated: rows.length };
}

// ─── Import Google Sheet → DB lockers ────────────────────────────────────────
export async function importLockersFromSheet(): Promise<{ synced: number; errors: string[] }> {
  if (!SHEET_ID) throw new Error("GOOGLE_SHEETS_LOCKER_ID env var not set");

  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { lockers } = await import("../drizzle/schema");

  const result = await gwsJson(
    `sheets spreadsheets values get --spreadsheetId ${SHEET_ID} --range "${SHEET_TAB}"`
  );

  const sheetRows: string[][] = result.values ?? [];
  if (sheetRows.length < 2) return { synced: 0, errors: ["Sheet has no data rows"] };

  // Skip header row
  const dataRows = sheetRows.slice(1);
  const errors: string[] = [];
  let synced = 0;

  for (const row of dataRows) {
    const [lockerNumber, section, memberName, tier, keyCode, nameplateLabel, lockerType, available, notes] = row;
    if (!lockerNumber) continue;

    try {
      const isAvailable = available?.toLowerCase() === "yes" || !memberName;
      await db
        .update(lockers)
        .set({
          section: section || null,
          memberName: memberName || null,
          tier: (tier as any) || null,
          keyCode: keyCode || null,
          nameplateLabel: nameplateLabel || null,
          lockerType: (lockerType as any) || "individual",
          isAvailable,
          notes: notes || null,
          updatedAt: new Date(),
        })
        .where(eq(lockers.lockerNumber, lockerNumber));
      synced++;
    } catch (e: any) {
      errors.push(`Row ${lockerNumber}: ${e.message}`);
    }
  }

  return { synced, errors };
}
