import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load env
dotenv.config({ path: '.env' });
const DATABASE_URL = process.env.DATABASE_URL;

const staffMembers = [
  { name: 'Mike Choate',     referralCode: 'MIKE-VIP',    shopifyUrl: 'https://industrialcigars.co/pages/membership-at-icc?ref=mike-vip' },
  { name: 'Reagon Rogers',   referralCode: 'REAGON-VIP',  shopifyUrl: 'https://industrialcigars.co/pages/membership-at-icc?ref=reagon-vip' },
  { name: 'Trey',            referralCode: 'TREY-VIP',    shopifyUrl: 'https://industrialcigars.co/pages/membership-at-icc?ref=trey-vip' },
  { name: 'Eric Stowers',    referralCode: 'ERIC-VIP',    shopifyUrl: 'https://industrialcigars.co/pages/membership-at-icc?ref=eric-vip' },
  { name: 'Amanda',          referralCode: 'AMANDA-VIP',  shopifyUrl: 'https://industrialcigars.co/pages/membership-at-icc?ref=amanda-vip' },
  { name: 'Lydia',           referralCode: 'LYDIA-VIP',   shopifyUrl: 'https://industrialcigars.co/pages/membership-at-icc?ref=lydia-vip' },
  { name: 'Daniel',          referralCode: 'DANIEL-VIP',  shopifyUrl: 'https://industrialcigars.co/pages/membership-at-icc?ref=daniel-vip' },
  { name: 'Nolan',           referralCode: 'NOLAN-VIP',   shopifyUrl: 'https://industrialcigars.co/pages/membership-at-icc?ref=nolan-vip' },
  { name: 'Hayden',          referralCode: 'HAYDEN-VIP',  shopifyUrl: 'https://industrialcigars.co/pages/membership-at-icc?ref=hayden-vip' },
  { name: 'Josh',            referralCode: 'JOSH-VIP',    shopifyUrl: 'https://industrialcigars.co/pages/membership-at-icc?ref=josh-vip' },
  { name: 'Nathan Frakes',   referralCode: 'NATHAN-VIP',  shopifyUrl: 'https://industrialcigars.co/pages/membership-at-icc?ref=nathan-vip' },
  { name: 'Brandon Frakes',  referralCode: 'BRANDON-VIP', shopifyUrl: 'https://industrialcigars.co/pages/membership-at-icc?ref=brandon-vip' },
  { name: 'Dave Frakes',     referralCode: 'DAVE-VIP',    shopifyUrl: 'https://industrialcigars.co/pages/membership-at-icc?ref=dave-vip' },
  { name: 'Drew Frakes',     referralCode: 'DREW-VIP',    shopifyUrl: 'https://industrialcigars.co/pages/membership-at-icc?ref=drew-vip' },
];

async function seed() {
  const conn = await createConnection(DATABASE_URL);
  console.log('Connected to DB');

  for (const s of staffMembers) {
    // Check if already exists
    const [rows] = await conn.execute('SELECT id FROM staff WHERE referralCode = ?', [s.referralCode]);
    if (rows.length > 0) {
      console.log(`  SKIP: ${s.name} already exists`);
      continue;
    }
    await conn.execute(
      'INSERT INTO staff (name, referralCode, shopifyUrl, isActive) VALUES (?, ?, ?, 1)',
      [s.name, s.referralCode, s.shopifyUrl]
    );
    console.log(`  INSERTED: ${s.name} (${s.referralCode})`);
  }

  await conn.end();
  console.log('Done seeding staff.');
}

seed().catch(err => { console.error(err); process.exit(1); });
