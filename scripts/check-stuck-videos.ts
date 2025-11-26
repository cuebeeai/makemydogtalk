import "dotenv/config";
import { db } from "../server/db";
import { videoOperations } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { checkVideoStatus } from "../server/veo";

async function checkStuckVideos() {
  console.log("🔍 Checking for stuck 'processing' videos...\n");

  // Get all processing videos
  const processingOps = await db.query.videoOperations.findMany({
    where: eq(videoOperations.status, "processing"),
    orderBy: desc(videoOperations.createdAt),
    limit: 20,
  });

  console.log(`Found ${processingOps.length} videos in 'processing' status\n`);

  for (const op of processingOps) {
    console.log("=".repeat(80));
    console.log(`Video Operation ID: ${op.id}`);
    console.log(`Created: ${op.createdAt}`);
    console.log(`Prompt: "${op.prompt?.substring(0, 60)}..."`);
    console.log(`Vertex AI Operation: ${op.operationId}`);

    if (!op.operationId) {
      console.log("⚠️  No operation ID - cannot check status");
      continue;
    }

    console.log("\n🔄 Checking status with Vertex AI...");

    try {
      const statusResult = await checkVideoStatus(op.operationId);

      console.log(`Status: ${statusResult.status}`);

      if (statusResult.status === "completed") {
        console.log("✅ Video completed! Updating database...");
        console.log(`Video URL: ${statusResult.videoUrl}`);

        // Update in database
        await db
          .update(videoOperations)
          .set({
            status: "completed",
            videoUrl: statusResult.videoUrl,
          })
          .where(eq(videoOperations.id, op.id));

        console.log("✅ Database updated successfully!");
      } else if (statusResult.status === "failed") {
        console.log(`❌ Video failed: ${statusResult.error}`);

        // Update in database
        await db
          .update(videoOperations)
          .set({
            status: "failed",
            error: statusResult.error,
          })
          .where(eq(videoOperations.id, op.id));

        console.log("Database updated with failure status");
      } else {
        console.log("⏳ Still processing...");
      }
    } catch (error: any) {
      console.error("❌ Error checking status:", error.message);
    }

    console.log("");
  }

  console.log("=".repeat(80));
  console.log("✅ Check complete!");
}

checkStuckVideos().catch(console.error);
