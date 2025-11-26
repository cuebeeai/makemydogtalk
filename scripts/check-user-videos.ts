import "dotenv/config";
import { db } from "../server/db";
import { videoOperations, users } from "@shared/schema";
import { desc, eq } from "drizzle-orm";

async function checkUserVideos() {
  // First, find the user
  const user = await db.query.users.findFirst({
    where: eq(users.email, 'jeff@cuebee.ai'),
  });

  if (!user) {
    console.log("User not found: jeff@cuebee.ai");
    return;
  }

  console.log(`Found user: ${user.email} (ID: ${user.id})`);
  const credits = user.credits || 0;
  const adminCredits = user.adminCredits || 0;
  console.log(`Credits: ${credits}, Admin Credits: ${adminCredits}\n`);

  // Get all video operations for this user
  const operations = await db.query.videoOperations.findMany({
    where: eq(videoOperations.userId, user.id),
    orderBy: desc(videoOperations.createdAt),
    limit: 20,
  });

  console.log(`Total videos: ${operations.length}\n`);

  const completed = operations.filter(op => op.status === "completed");
  const failed = operations.filter(op => op.status === "failed");
  const processing = operations.filter(op => op.status === "processing");

  console.log(`✅ Completed: ${completed.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`⏳ Processing: ${processing.length}\n`);

  // Show all operations with details
  console.log("=".repeat(80));
  console.log("ALL VIDEO OPERATIONS:");
  console.log("=".repeat(80));

  operations.forEach((op, idx) => {
    console.log(`\n${idx + 1}. Operation ID: ${op.id}`);
    console.log(`   Status: ${op.status}`);
    console.log(`   Created: ${op.createdAt}`);
    console.log(`   Prompt: "${op.prompt}"`);
    if (op.status === "failed") {
      console.log(`   ❌ Error: ${op.error}`);
    }
    if (op.status === "completed") {
      console.log(`   ✅ Video URL: ${op.videoUrl}`);
    }
    if (op.operationId) {
      console.log(`   Vertex AI Operation: ${op.operationId}`);
    }
  });

  // Show failed operations in detail
  if (failed.length > 0) {
    console.log("\n" + "=".repeat(80));
    console.log("FAILED OPERATIONS DETAIL:");
    console.log("=".repeat(80));
    failed.forEach(f => {
      console.log(`\nTime: ${f.createdAt}`);
      console.log(`Prompt: "${f.prompt}"`);
      console.log(`Error: ${f.error}`);
      console.log(`Operation ID: ${f.operationId}`);
    });
  }
}

checkUserVideos().catch(console.error);
