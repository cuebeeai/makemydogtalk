import { db } from '../server/db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function checkCredits() {
  const email = process.argv[2] || 'makemydogtalk@gmail.com';

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (result.length === 0) {
    console.log(`No user found with email: ${email}`);
  } else {
    const user = result[0];
    console.log(`User: ${user.email}`);
    console.log(`Credits: ${user.credits || 0}`);
    console.log(`User ID: ${user.id}`);
  }

  process.exit(0);
}

checkCredits().catch(console.error);
