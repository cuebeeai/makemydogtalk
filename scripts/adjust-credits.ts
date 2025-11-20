import { db } from '../server/db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function adjustCredits() {
  const email = process.argv[2];
  const adjustment = parseInt(process.argv[3]);

  if (!email || isNaN(adjustment)) {
    console.log('Usage: npx tsx scripts/adjust-credits.ts <email> <adjustment>');
    console.log('Example: npx tsx scripts/adjust-credits.ts makemydogtalk@gmail.com -3');
    process.exit(1);
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (result.length === 0) {
    console.log(`No user found with email: ${email}`);
    process.exit(1);
  }

  const user = result[0];
  const oldCredits = user.credits || 0;
  const newCredits = Math.max(0, oldCredits + adjustment);

  await db.update(users)
    .set({ credits: newCredits })
    .where(eq(users.id, user.id));

  console.log(`✅ Updated credits for ${email}`);
  console.log(`Old balance: ${oldCredits}`);
  console.log(`Adjustment: ${adjustment}`);
  console.log(`New balance: ${newCredits}`);

  process.exit(0);
}

adjustCredits().catch(console.error);
