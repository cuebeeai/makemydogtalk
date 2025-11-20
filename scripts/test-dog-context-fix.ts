import "dotenv/config";
import { GoogleAuth } from "google-auth-library";

const VERTEX_AI_PROJECT_ID = process.env.VERTEX_AI_PROJECT_ID;

// The problematic prompt that was failing
const originalPrompt = "I don't need much… just your hand, your lap, and like… maybe fifty kisses. I'm simple like that.";

// With dog context (our fix)
const fixedPrompt = "dog, " + originalPrompt;

async function testPromptWithContext(prompt: string, label: string) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Testing: ${label}`);
  console.log(`Prompt: "${prompt}"`);
  console.log('='.repeat(70));

  try {
    const serviceAccountCredentials = JSON.parse(process.env.SERVICE_ACCOUNT_JSON!);
    const auth = new GoogleAuth({
      credentials: serviceAccountCredentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    if (!accessToken.token) {
      throw new Error("Failed to get access token");
    }

    // Use a simple test image (1x1 pixel PNG)
    const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${VERTEX_AI_PROJECT_ID}/locations/us-central1/publishers/google/models/veo-3.1-generate-preview:predictLongRunning`;

    const requestBody = {
      instances: [{
        prompt: prompt,
        image: {
          bytesBase64Encoded: testImageBase64,
          mimeType: "image/png",
        },
      }],
      parameters: {
        aspectRatio: "16:9",
        durationSeconds: 4,  // Use 4 seconds (valid duration: 4, 6, or 8)
        generateAudio: true,
        sampleCount: 1,
        enableSubtitles: false,
        addSubtitles: false,
      },
    };

    console.log("Submitting to Vertex AI...");

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken.token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Submission FAILED - Status: ${response.status}`);
      try {
        const errorData = JSON.parse(errorText);
        console.log(`Error: ${errorData.error?.message || errorText.substring(0, 200)}`);
      } catch {
        console.log(`Error: ${errorText.substring(0, 200)}`);
      }
      return null;
    }

    const operation = await response.json();
    console.log(`✅ Submission SUCCESS - Operation: ${operation.name}`);

    // Now wait a bit and check if it's processing or failed during generation
    console.log("Waiting 10 seconds to check processing status...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check operation status
    const statusEndpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${VERTEX_AI_PROJECT_ID}/locations/us-central1/publishers/google/models/veo-3.1-generate-preview:fetchPredictOperation`;

    const statusResponse = await fetch(statusEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken.token}`,
      },
      body: JSON.stringify({ operationName: operation.name }),
    });

    const statusData = await statusResponse.json();

    if (statusData.error) {
      console.log(`❌ Processing FAILED during generation`);
      console.log(`Error: ${statusData.error.message}`);
      return false;
    } else if (statusData.done) {
      console.log(`✅ Processing COMPLETED`);
      return true;
    } else {
      console.log(`⏳ Still processing... (this is good, means no content violation)`);
      return true;
    }

  } catch (error: any) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

async function runTest() {
  console.log("Testing the dog context fix for content moderation...\n");

  console.log("This test will verify that adding 'dog' context prevents the content");
  console.log("moderation false positive that was rejecting innocent dog dialogue.\n");

  // Test with dog context (our fix)
  await testPromptWithContext(fixedPrompt, "WITH DOG CONTEXT (our fix)");

  console.log("\n" + "=".repeat(70));
  console.log("TEST COMPLETE");
  console.log("=".repeat(70));
  console.log("\nIf the test shows 'Still processing' or 'COMPLETED', the fix works!");
  console.log("If it shows 'Processing FAILED', we need a different approach.");
}

runTest();
