// Quick script to fix user credits in database
import "dotenv/config";
import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function fixCredits() {
  try {
    // Get the user by email
    const userEmail = "jeffbennett10@gmail.com";
    const result = await db.select().from(users).where(eq(users.email, userEmail));

    if (result.length === 0) {
      console.log(`User ${userEmail} not found`);
      return;
    }

    const user = result[0];
    console.log(`Current user: ${user.email}, Credits: ${user.credits}`);

    // Update credits to 10
    const updated = await db.update(users)
      .set({ credits: 10 })
      .where(eq(users.email, userEmail))
      .returning();

    console.log(`✅ Updated! New balance: ${updated[0].credits} credits`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

fixCredits();
