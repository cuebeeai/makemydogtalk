import "dotenv/config";
import { db } from "../server/db";
import { videoOperations } from "@shared/schema";
import { eq } from "drizzle-orm";

async function checkFailedVideos() {
  console.log("Fetching all failed video operations from today...\n");

  const operations = await db.query.videoOperations.findMany({
    where: eq(videoOperations.status, "failed"),
    orderBy: (operations, { desc }) => [desc(operations.createdAt)],
    limit: 10,
  });

  if (operations.length === 0) {
    console.log("No failed operations found");
    return;
  }

  console.log(`Found ${operations.length} failed operations:\n`);

  for (const op of operations) {
    console.log('='.repeat(60));
    console.log(`ID: ${op.id}`);
    console.log(`Created: ${op.createdAt}`);
    console.log(`Prompt: "${op.prompt}"`);
    console.log(`Image: ${op.imagePath}`);
    console.log(`Error: ${op.error}`);
    console.log(`User ID: ${op.userId}`);

    // Check if the image file still exists
    const fs = await import("fs");
    const imageExists = fs.existsSync(op.imagePath);
    console.log(`Image file exists: ${imageExists}`);

    if (imageExists) {
      const stats = fs.statSync(op.imagePath);
      console.log(`Image size: ${(stats.size / 1024).toFixed(2)} KB`);
    }
    console.log('');
  }
}

checkFailedVideos().catch(console.error);
