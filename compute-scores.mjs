/**
 * Compute and seed power scores for all members.
 * Scoring formula (100 pts total):
 *   Tenure Score (0-15): months as member × 1.5, capped at 15
 *   Tier Score (0-30): APEX=30, Atabey=20, Visionary=10
 *   Referral Score (0-20): placeholder 0 until Shopify referral tracking is live
 *   Visit Score (0-30): 0 until Lightspeed connected
 *   Event Score (0-5): 0 until event tracking is live
 *   Spend Score (0-25): 0 until Lightspeed connected
 * Total = tenure + tier (max 45 without Lightspeed)
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const now = new Date();

// Get all active members
const [members] = await conn.execute(
  "SELECT id, name, tier, status, joinedAt FROM members WHERE status = 'Active'"
);

console.log(`Computing scores for ${members.length} active members...`);

let updated = 0;
for (const m of members) {
  // Tenure score: months since joining × 1.5, capped at 15
  let tenureScore = 0;
  if (m.joinedAt) {
    const monthsAsMember = (now - new Date(m.joinedAt)) / (1000 * 60 * 60 * 24 * 30);
    tenureScore = Math.min(15, Math.round(monthsAsMember * 1.5));
  }

  // Tier score
  const tierScore = m.tier === 'APEX' ? 30 : m.tier === 'Atabey' ? 20 : 10;

  // Total (visit, spend, referral, event all 0 until external data)
  const totalScore = tenureScore + tierScore;

  // APEX eligible if total >= 65 (would need Lightspeed data to fully qualify)
  // For now: APEX members are always eligible, Atabey with high tenure are candidates
  const apexEligible = m.tier === 'APEX' || (m.tier === 'Atabey' && totalScore >= 28);

  await conn.execute(
    `UPDATE members SET tenureScore = ?, totalScore = ?, apexEligible = ?, updatedAt = NOW()
     WHERE id = ?`,
    [tenureScore, totalScore, apexEligible ? 1 : 0, m.id]
  );
  updated++;
}

console.log(`✓ Updated scores for ${updated} active members`);

// Show score distribution
const [dist] = await conn.execute(`
  SELECT tier,
    ROUND(AVG(totalScore), 1) as avgScore,
    MAX(totalScore) as maxScore,
    MIN(totalScore) as minScore,
    COUNT(*) as count
  FROM members WHERE status = 'Active'
  GROUP BY tier ORDER BY avgScore DESC
`);
console.log('\nScore distribution by tier:');
console.log(JSON.stringify(dist, null, 2));

// Show top 10
const [top10] = await conn.execute(`
  SELECT name, tier, totalScore, tenureScore, joinedAt
  FROM members WHERE status = 'Active'
  ORDER BY totalScore DESC LIMIT 10
`);
console.log('\nTop 10 members by score:');
top10.forEach((m, i) => {
  const months = m.joinedAt ? Math.round((now - new Date(m.joinedAt)) / (1000 * 60 * 60 * 24 * 30)) : 0;
  console.log(`${i+1}. ${m.name} (${m.tier}) — Score: ${m.totalScore} | Tenure: ${months} months`);
});

await conn.end();
