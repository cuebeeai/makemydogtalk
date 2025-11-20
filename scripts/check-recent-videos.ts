import "dotenv/config";
import { db } from "../server/db";
import { videoOperations } from "@shared/schema";
import { desc, gte } from "drizzle-orm";

async function checkRecentVideos() {
  // Get videos from the last 48 hours
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  console.log(`Fetching videos from the last 48 hours (since ${twoDaysAgo.toLocaleString()})...\n`);

  const operations = await db.query.videoOperations.findMany({
    where: gte(videoOperations.createdAt, twoDaysAgo),
    orderBy: desc(videoOperations.createdAt),
    limit: 50,
  });

  const completed = operations.filter(op => op.status === "completed");
  const failed = operations.filter(op => op.status === "failed");
  const processing = operations.filter(op => op.status === "processing");

  console.log(`Total: ${operations.length} videos`);
  console.log(`✅ Completed: ${completed.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`⏳ Processing: ${processing.length}\n`);

  // Find the last successful video
  if (completed.length > 0) {
    const lastSuccess = completed[0];
    console.log("=".repeat(60));
    console.log("LAST SUCCESSFUL VIDEO:");
    console.log("=".repeat(60));
    console.log(`Time: ${lastSuccess.createdAt}`);
    console.log(`Prompt: "${lastSuccess.prompt}"`);
    console.log(`Video URL: ${lastSuccess.videoUrl}`);
    console.log("");
  }

  // Show timeline of failures
  if (failed.length > 0) {
    console.log("=".repeat(60));
    console.log("FAILURE TIMELINE:");
    console.log("=".repeat(60));
    failed.forEach(f => {
      console.log(`${f.createdAt?.toLocaleString()} - "${f.prompt?.substring(0, 50)}..."`);
    });
    console.log("");
  }

  // Check if all failures are the same prompt
  const failedPrompts = new Set(failed.map(f => f.prompt));
  console.log(`Unique failed prompts: ${failedPrompts.size}`);

  if (failedPrompts.size === 1) {
    console.log(`⚠️  All failures are from the same prompt: "${Array.from(failedPrompts)[0]}"`);
  }
}

checkRecentVideos().catch(console.error);
