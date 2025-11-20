import "dotenv/config";
import { db } from "../server/db";
import { videoOperations } from "@shared/schema";
import { eq } from "drizzle-orm";

const videoId = "54c3ab69-d262-43af-b70c-b2a9f93388f3";

async function debugVideo() {
  console.log("Fetching video operation from database...");

  const operation = await db.query.videoOperations.findFirst({
    where: eq(videoOperations.id, videoId),
  });

  if (!operation) {
    console.log("Operation not found in database");
    return;
  }

  console.log("\n=== Video Operation Details ===");
  console.log("ID:", operation.id);
  console.log("Status:", operation.status);
  console.log("Operation ID:", operation.operationId);
  console.log("Prompt:", operation.prompt);
  console.log("Image Path:", operation.imagePath);
  console.log("Video URL:", operation.videoUrl);
  console.log("Error:", operation.error);
  console.log("Created At:", operation.createdAt);
  console.log("Updated At:", operation.updatedAt);
  console.log("User ID:", operation.userId);

  // If there's an operationId, let's try to check the status
  if (operation.operationId) {
    console.log("\n=== Checking Vertex AI Status ===");
    const { checkVideoStatus } = await import("../server/veo");

    try {
      const status = await checkVideoStatus(operation.operationId);
      console.log("Status check result:", JSON.stringify(status, null, 2));
    } catch (error: any) {
      console.error("Error checking status:", error.message);
    }
  }
}

debugVideo().catch(console.error);
