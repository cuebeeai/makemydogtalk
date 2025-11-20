import "dotenv/config";
import { GoogleAuth } from "google-auth-library";

const VERTEX_AI_PROJECT_ID = process.env.VERTEX_AI_PROJECT_ID;

// Test dialogue
const dialogue = "I'm a good boy, right?";
const action = "tilting head curiously";

// Test different explicit prompt variations
const testPrompts = [
  {
    name: "Current (implicit)",
    prompt: `dog, ${dialogue}, ${action}`
  },
  {
    name: "Explicit - speaking aloud",
    prompt: `A dog speaking aloud: ${dialogue}, ${action}`
  },
  {
    name: "Explicit - mouth moving",
    prompt: `Dog with mouth moving, speaking: ${dialogue}, ${action}`
  },
  {
    name: "Explicit - talking",
    prompt: `A dog talking: ${dialogue}, ${action}`
  },
  {
    name: "Explicit - saying with audio",
    prompt: `Dog speaking and saying: ${dialogue}, ${action}`
  },
  {
    name: "Simple - dog speaking",
    prompt: `dog speaking, ${dialogue}, ${action}`
  }
];

async function testPrompt(prompt: string, name: string) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Testing: ${name}`);
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
        durationSeconds: 4,
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

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ FAILED - Status: ${response.status}`);
      try {
        const errorData = JSON.parse(errorText);
        console.log(`Error: ${errorData.error?.message || errorText.substring(0, 200)}`);
      } catch {
        console.log(`Error: ${errorText.substring(0, 200)}`);
      }
      return false;
    }

    const operation = await response.json();
    console.log(`✅ SUCCESS - Operation started: ${operation.name}`);
    return true;

  } catch (error: any) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log("Testing explicit prompt variations for dog speech...\n");
  console.log("Goal: Find the clearest way to tell Veo the dog should speak\n");

  const results: { name: string; passed: boolean }[] = [];

  for (const test of testPrompts) {
    const passed = await testPrompt(test.prompt, test.name);
    results.push({ name: test.name, passed });

    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log("\n" + "=".repeat(70));
  console.log("SUMMARY");
  console.log("=".repeat(70));

  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
  });

  const passedCount = results.filter(r => r.passed).length;
  console.log(`\nPassed: ${passedCount}/${results.length}`);

  console.log("\nAll passing prompts should work. Choose based on:");
  console.log("- Clarity (most explicit about speaking/mouth movement)");
  console.log("- Brevity (shorter prompts may give more natural results)");
  console.log("- Natural language (reads well)");
}

runTests();
