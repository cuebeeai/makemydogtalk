import { db } from '../server/db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { isAdmin } from '../server/adminUtil.js';

async function checkAdminUser() {
  try {
    const result = await db.select().from(users).where(eq(users.email, 'jeff@cuebee.ai')).limit(1);

    if (result.length === 0) {
      console.log('❌ No user found with email: jeff@cuebee.ai');
      return;
    }

    const user = result[0];
    console.log('\n📧 User Record:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Name:', user.name);
    console.log('  Created:', user.createdAt);

    console.log('\n🔐 Admin Check:');
    const adminStatus = isAdmin(user.email);
    console.log('  Is Admin:', adminStatus);
    console.log('  Email (lowercase):', user.email.toLowerCase());

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdminUser();
