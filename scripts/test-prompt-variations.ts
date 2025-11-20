import "dotenv/config";
import { GoogleAuth } from "google-auth-library";
import * as fs from "fs";

const VERTEX_AI_PROJECT_ID = process.env.VERTEX_AI_PROJECT_ID;
const VERTEX_AI_LOCATION = process.env.VERTEX_AI_LOCATION || "us-central1";

// Test different prompt variations to see which ones pass content moderation
const testPrompts = [
  // Original prompt that failed
  {
    name: "Original (failed)",
    prompt: "I don't need much… just your hand, your lap, and like… maybe fifty kisses. I'm simple like that."
  },
  // Add dog context at the beginning
  {
    name: "With 'dog' prefix",
    prompt: "A dog saying: I don't need much… just your hand, your lap, and like… maybe fifty kisses. I'm simple like that."
  },
  {
    name: "With 'pet dog' context",
    prompt: "Pet dog expressing affection: I don't need much… just your hand, your lap, and like… maybe fifty kisses. I'm simple like that."
  },
  {
    name: "Reworded - remove 'kisses'",
    prompt: "I don't need much… just your hand, your lap, and like… maybe fifty cuddles. I'm simple like that."
  },
  {
    name: "Reworded - more dog-like",
    prompt: "I don't need much… just pets, your lap, and lots of tail wags. I'm simple like that."
  },
  {
    name: "With dog behavior descriptors",
    prompt: "tail wagging, I don't need much… just your hand, your lap, and like… maybe fifty kisses. I'm simple like that."
  }
];

async function testPrompt(prompt: string, name: string) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${name}`);
    console.log(`Prompt: "${prompt}"`);
    console.log('='.repeat(60));

    // Initialize Google Auth
    const serviceAccountCredentials = JSON.parse(process.env.SERVICE_ACCOUNT_JSON!);
    const auth = new GoogleAuth({
      credentials: serviceAccountCredentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    // Get access token
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
        durationSeconds: 3,
        generateAudio: true,
        sampleCount: 1,
        enableSubtitles: false,
        addSubtitles: false,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken.token}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.log(`❌ FAILED - Status: ${response.status}`);
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error?.message) {
          console.log(`Error: ${errorData.error.message}`);
        } else {
          console.log(`Error: ${responseText.substring(0, 200)}`);
        }
      } catch {
        console.log(`Error: ${responseText.substring(0, 200)}`);
      }
      return false;
    }

    const responseJson = JSON.parse(responseText);
    console.log(`✅ SUCCESS - Operation started`);
    console.log(`Operation: ${responseJson.name}`);
    return true;

  } catch (error: any) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log("Testing prompt variations for content moderation...\n");

  const results: { name: string; passed: boolean }[] = [];

  for (const test of testPrompts) {
    const passed = await testPrompt(test.prompt, test.name);
    results.push({ name: test.name, passed });

    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));

  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
  });

  const passedCount = results.filter(r => r.passed).length;
  console.log(`\nPassed: ${passedCount}/${results.length}`);
}

runTests();
