import "dotenv/config";
import { GoogleAuth } from "google-auth-library";

const VERTEX_AI_PROJECT_ID = process.env.VERTEX_AI_PROJECT_ID;
const VERTEX_AI_LOCATION = process.env.VERTEX_AI_LOCATION || "us-central1";

// Operation ID from the failed video (can be passed as command line argument)
const operationId = process.argv[2] || "projects/makemydogtalk-78f41/locations/us-central1/publishers/google/models/veo-3.1-generate-preview/operations/bf14e957-bcaa-4c26-82b3-1bc48712e96f";

async function debugRawError() {
  try {
    console.log("Initializing Google Auth...");

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

    console.log("✅ Got access token");

    // Fetch operation status
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${VERTEX_AI_PROJECT_ID}/locations/us-central1/publishers/google/models/veo-3.1-generate-preview:fetchPredictOperation`;

    console.log("\n=== Fetching operation status ===");
    console.log("Endpoint:", endpoint);
    console.log("Operation ID:", operationId);

    const requestBody = {
      operationName: operationId
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken.token}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("\nResponse status:", response.status, response.statusText);

    const responseText = await response.text();
    console.log("\n=== RAW RESPONSE ===");
    console.log(responseText);

    try {
      const responseJson = JSON.parse(responseText);
      console.log("\n=== PARSED RESPONSE ===");
      console.log(JSON.stringify(responseJson, null, 2));

      if (responseJson.error) {
        console.log("\n=== ERROR DETAILS ===");
        console.log("Error code:", responseJson.error.code);
        console.log("Error message:", responseJson.error.message);
        console.log("Error status:", responseJson.error.status);
        if (responseJson.error.details) {
          console.log("Error details:", JSON.stringify(responseJson.error.details, null, 2));
        }
      }
    } catch (e) {
      console.log("Response is not JSON");
    }
  } catch (error: any) {
    console.error("\n=== UNCAUGHT ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
  }
}

debugRawError();
