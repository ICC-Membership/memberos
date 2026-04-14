/**
 * Seed locker assignments from the V3 Locker Diagram into the DB.
 * Parsed from: /home/ubuntu/cigar_lounge/gdrive_docs/V3. LOCKER DIAGRAM.xlsx
 * Three banks: APEX (41 lockers), Atabey (96 lockers), Visionary (70 lockers)
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ─── APEX Bank ───────────────────────────────────────────────────────────────
// Layout: C1 corner, 1-10 (top row), C2 corner, then rows below
// C lockers are cabinet/corner lockers shared by multiple members
const apexLockers = [
  // Corner/Cabinet lockers
  { lockerNumber: 'APEX-C1', section: 'APEX', row: 1, col: 0, memberName: null, tier: null, isAvailable: true, notes: 'Corner cabinet locker' },
  { lockerNumber: 'APEX-C2', section: 'APEX', row: 1, col: 11, memberName: null, tier: null, isAvailable: true, notes: 'Corner cabinet locker' },
  { lockerNumber: 'APEX-C3', section: 'APEX', row: 3, col: 0, memberName: null, tier: null, isAvailable: true, notes: 'Corner cabinet locker' },
  { lockerNumber: 'APEX-C4', section: 'APEX', row: 3, col: 11, memberName: null, tier: null, isAvailable: true, notes: 'Corner cabinet locker' },
  // Row 1: 1-10
  { lockerNumber: 'APEX-1', section: 'APEX', row: 1, col: 1, memberName: 'Scott Bates', tier: 'APEX', isAvailable: false, notes: null },
  { lockerNumber: 'APEX-2', section: 'APEX', row: 1, col: 2, memberName: 'Ed Eaton', tier: 'APEX', isAvailable: false, notes: null },
  { lockerNumber: 'APEX-3', section: 'APEX', row: 1, col: 3, memberName: 'AL Brodie', tier: 'APEX', isAvailable: false, notes: null },
  { lockerNumber: 'APEX-4', section: 'APEX', row: 1, col: 4, memberName: 'Wes Ayers', tier: 'APEX', isAvailable: false, notes: null },
  { lockerNumber: 'APEX-5', section: 'APEX', row: 1, col: 5, memberName: 'Jeff Axelrod', tier: 'APEX', isAvailable: false, notes: null },
  { lockerNumber: 'APEX-6', section: 'APEX', row: 1, col: 6, memberName: 'Kevin Guthrie', tier: 'APEX', isAvailable: false, notes: null },
  { lockerNumber: 'APEX-7', section: 'APEX', row: 1, col: 7, memberName: 'Jerrod Henderson', tier: 'APEX', isAvailable: false, notes: null },
  { lockerNumber: 'APEX-8', section: 'APEX', row: 1, col: 8, memberName: 'Anthony White', tier: 'APEX', isAvailable: false, notes: null },
  { lockerNumber: 'APEX-9', section: 'APEX', row: 1, col: 9, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-10', section: 'APEX', row: 1, col: 10, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  // Row 2: 11-20
  { lockerNumber: 'APEX-11', section: 'APEX', row: 2, col: 1, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-12', section: 'APEX', row: 2, col: 2, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-13', section: 'APEX', row: 2, col: 3, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-14', section: 'APEX', row: 2, col: 4, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-15', section: 'APEX', row: 2, col: 5, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-16', section: 'APEX', row: 2, col: 6, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-17', section: 'APEX', row: 2, col: 7, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-18', section: 'APEX', row: 2, col: 8, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-19', section: 'APEX', row: 2, col: 9, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-20', section: 'APEX', row: 2, col: 10, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  // Row 3: 21-30
  { lockerNumber: 'APEX-21', section: 'APEX', row: 3, col: 1, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-22', section: 'APEX', row: 3, col: 2, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-23', section: 'APEX', row: 3, col: 3, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-24', section: 'APEX', row: 3, col: 4, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-25', section: 'APEX', row: 3, col: 5, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-26', section: 'APEX', row: 3, col: 6, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-27', section: 'APEX', row: 3, col: 7, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-28', section: 'APEX', row: 3, col: 8, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-29', section: 'APEX', row: 3, col: 9, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-30', section: 'APEX', row: 3, col: 10, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  // Row 4: 31-37
  { lockerNumber: 'APEX-31', section: 'APEX', row: 4, col: 1, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-32', section: 'APEX', row: 4, col: 2, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-33', section: 'APEX', row: 4, col: 3, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-34', section: 'APEX', row: 4, col: 4, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-35', section: 'APEX', row: 4, col: 5, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-36', section: 'APEX', row: 4, col: 6, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
  { lockerNumber: 'APEX-37', section: 'APEX', row: 4, col: 7, memberName: 'OPEN', tier: null, isAvailable: true, notes: null },
];

// ─── Atabey Bank (6 rows × 16 columns = 96 lockers) ─────────────────────────
// From the ATABEY sheet — row 6 is Bottle Concierge
const atabeyAssignments = {
  '1A': 'Scott Bates', '1B': 'Ed Eaton', '1C': 'AL Brodie', '1D': 'Wes Ayers',
  '1E': 'Jeff Axelrod', '1F': 'Kevin Guthrie', '1G': 'Jerrod Henderson', '1H': 'Anthony White',
  '1I': 'OPEN', '1J': 'OPEN', '1K': 'OPEN', '1L': 'OPEN',
  '1M': 'OPEN', '1N': 'OPEN', '1O': 'OPEN', '1P': 'OPEN',
  '2A': 'OPEN', '2B': 'OPEN', '2C': 'OPEN', '2D': 'OPEN',
  '2E': 'OPEN', '2F': 'OPEN', '2G': 'OPEN', '2H': 'OPEN',
  '2I': 'OPEN', '2J': 'OPEN', '2K': 'OPEN', '2L': 'OPEN',
  '2M': 'OPEN', '2N': 'OPEN', '2O': 'OPEN', '2P': 'OPEN',
  '3A': 'OPEN', '3B': 'OPEN', '3C': 'OPEN', '3D': 'OPEN',
  '3E': 'OPEN', '3F': 'OPEN', '3G': 'OPEN', '3H': 'OPEN',
  '3I': 'OPEN', '3J': 'OPEN', '3K': 'OPEN', '3L': 'OPEN',
  '3M': 'OPEN', '3N': 'OPEN', '3O': 'OPEN', '3P': 'OPEN',
  '4A': 'OPEN', '4B': 'OPEN', '4C': 'OPEN', '4D': 'OPEN',
  '4E': 'OPEN', '4F': 'OPEN', '4G': 'OPEN', '4H': 'OPEN',
  '4I': 'OPEN', '4J': 'OPEN', '4K': 'OPEN', '4L': 'OPEN',
  '4M': 'OPEN', '4N': 'OPEN', '4O': 'OPEN', '4P': 'OPEN',
  '5A': 'OPEN', '5B': 'OPEN', '5C': 'OPEN', '5D': 'OPEN',
  '5E': 'OPEN', '5F': 'OPEN', '5G': 'OPEN', '5H': 'OPEN',
  '5I': 'OPEN', '5J': 'OPEN', '5K': 'OPEN', '5L': 'OPEN',
  '5M': 'OPEN', '5N': 'OPEN', '5O': 'OPEN', '5P': 'OPEN',
  '6A': 'Bottle Concierge', '6B': 'Bottle Concierge', '6C': 'Bottle Concierge', '6D': 'Bottle Concierge',
  '6E': 'Bottle Concierge', '6F': 'Bottle Concierge', '6G': 'Bottle Concierge', '6H': 'Bottle Concierge',
  '6I': 'Bottle Concierge', '6J': 'Bottle Concierge', '6K': 'Bottle Concierge', '6L': 'Bottle Concierge',
  '6M': 'Bottle Concierge', '6N': 'Bottle Concierge', '6O': 'Bottle Concierge', '6P': 'Bottle Concierge',
};

const cols = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'];
const atabeyLockers = [];
for (let r = 1; r <= 6; r++) {
  for (let c = 0; c < 16; c++) {
    const lockerNumber = `${r}${cols[c]}`;
    const memberName = atabeyAssignments[lockerNumber] || 'OPEN';
    const isBottleConcierge = memberName === 'Bottle Concierge';
    atabeyLockers.push({
      lockerNumber: `ATB-${lockerNumber}`,
      section: 'Atabey',
      row: r,
      col: c + 1,
      memberName: isBottleConcierge ? null : (memberName === 'OPEN' ? null : memberName),
      tier: isBottleConcierge ? null : (memberName !== 'OPEN' ? 'Atabey' : null),
      isAvailable: memberName === 'OPEN',
      notes: isBottleConcierge ? 'Bottle Concierge storage' : null,
    });
  }
}

// ─── Visionary Bank (5 rows × 14 columns = 70 lockers) ──────────────────────
const visionaryAssignments = {
  '1A': 'Jeff Axelrod', '1B': 'Anthony White', '1C': 'Jerrod Henderson',
  '1D': 'Kevin Guthrie', '1E': 'OPEN', '1F': 'OPEN', '1G': 'OPEN',
  '1H': 'OPEN', '1I': 'OPEN', '1J': 'OPEN', '1K': 'OPEN', '1L': 'OPEN', '1M': 'OPEN', '1N': 'OPEN',
};

const visionaryLockers = [];
const visCols = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'];
for (let r = 1; r <= 5; r++) {
  for (let c = 0; c < 14; c++) {
    const lockerNumber = `${r}${visCols[c]}`;
    const memberName = visionaryAssignments[lockerNumber] || 'OPEN';
    visionaryLockers.push({
      lockerNumber: `VIS-${lockerNumber}`,
      section: 'Visionary',
      row: r,
      col: c + 1,
      memberName: memberName === 'OPEN' ? null : memberName,
      tier: memberName !== 'OPEN' ? 'Visionary' : null,
      isAvailable: memberName === 'OPEN',
      notes: null,
    });
  }
}

// ─── Seed all lockers ────────────────────────────────────────────────────────
const allLockers = [...apexLockers, ...atabeyLockers, ...visionaryLockers];
console.log(`Seeding ${allLockers.length} lockers...`);

// Clear existing
await conn.execute('DELETE FROM lockers');

let inserted = 0;
for (const locker of allLockers) {
  await conn.execute(
    `INSERT INTO lockers (lockerNumber, section, \`row\`, \`col\`, memberName, tier, isAvailable, notes, assignedAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      locker.lockerNumber,
      locker.section,
      locker.row,
      locker.col,
      locker.memberName,
      locker.tier,
      locker.isAvailable ? 1 : 0,
      locker.notes,
      locker.memberName && !locker.notes?.includes('Concierge') ? new Date() : null,
    ]
  );
  inserted++;
}

console.log(`✓ Inserted ${inserted} lockers`);

// Summary
const [summary] = await conn.execute(`
  SELECT section, COUNT(*) as total, SUM(isAvailable = 0 AND notes NOT LIKE '%Concierge%') as occupied, SUM(isAvailable = 1) as open
  FROM lockers GROUP BY section
`);
console.log('Summary:', JSON.stringify(summary, null, 2));

await conn.end();
