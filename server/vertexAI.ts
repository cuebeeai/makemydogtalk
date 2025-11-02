/**
 * Vertex AI Service Account Integration
 *
 * This module handles VIDEO GENERATION using Vertex AI.
 * It uses SERVICE ACCOUNT credentials (NOT user OAuth tokens).
 * The service account acts on behalf of the application, not individual users.
 */

import { GoogleAuth } from 'google-auth-library';

// Parse service account JSON from environment variable
let serviceAccountKey: any = null;
let auth: GoogleAuth | null = null;
let VERTEX_AI_PROJECT_ID: string | undefined;
let VERTEX_AI_LOCATION: string = 'us-central1';

try {
  if (process.env.SERVICE_ACCOUNT_JSON) {
    serviceAccountKey = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
    VERTEX_AI_PROJECT_ID = serviceAccountKey.project_id || process.env.VERTEX_AI_PROJECT_ID;
    VERTEX_AI_LOCATION = process.env.VERTEX_AI_LOCATION || 'us-central1';

    // Initialize Google Auth with SERVICE ACCOUNT credentials
    auth = new GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    console.log('✅ Vertex AI configured successfully');
  } else {
    console.warn('❌ No Google credentials found. Video generation will be unavailable.');
  }
} catch (error) {
  console.error('⚠️  Failed to parse SERVICE_ACCOUNT_JSON:', error);
  console.warn('Video generation will be unavailable.');
}

if (!VERTEX_AI_PROJECT_ID && process.env.SERVICE_ACCOUNT_JSON) {
  console.warn('❌ Vertex AI Project ID not found. Video generation will be unavailable.');
}

// Helper to check if Vertex AI is configured
const isVertexAIConfigured = !!auth && !!VERTEX_AI_PROJECT_ID;

/**
 * Get access token from service account
 * This token is used to call Vertex AI APIs
 */
async function getServiceAccountToken(): Promise<string> {
  if (!auth) {
    throw new Error('Vertex AI is not configured. Please set SERVICE_ACCOUNT_JSON environment variable.');
  }

  const client = await auth.getClient();
  const accessTokenResponse = await client.getAccessToken();

  if (!accessTokenResponse.token) {
    throw new Error('Failed to get service account access token');
  }

  return accessTokenResponse.token;
}

/**
 * Generate video using Vertex AI Veo model
 * This is called AFTER user authentication, but uses SERVICE ACCOUNT credentials
 */
export async function generateTalkingDogVideo(params: {
  prompt: string;
  imageBase64: string;
  mimeType: string;
  intent?: string;
  tone?: string;
  background?: string;
  userId: string; // For tracking purposes, not for auth
}): Promise<{
  operationId: string;
  status: string;
}> {
  if (!isVertexAIConfigured) {
    throw new Error('Video generation is not configured. Please set up Vertex AI credentials.');
  }

  try {
    console.log(`[Vertex AI] Generating video for user: ${params.userId}`);
    console.log(`[Vertex AI] Prompt: ${params.prompt}`);

    // Get service account access token
    const accessToken = await getServiceAccountToken();

    // Build enhanced prompt
    const enhancedPrompt = buildEnhancedPrompt({
      prompt: params.prompt,
      intent: params.intent,
      tone: params.tone,
      background: params.background,
    });

    // Vertex AI endpoint for Veo 3.1
    // NOTE: This endpoint may vary - adjust based on your Vertex AI setup
    const endpoint = `https://${VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${VERTEX_AI_PROJECT_ID}/locations/${VERTEX_AI_LOCATION}/publishers/google/models/veo-001:predict`;

    const requestBody = {
      instances: [{
        prompt: enhancedPrompt,
        image: {
          bytesBase64Encoded: params.imageBase64,
        },
      }],
      parameters: {
        sampleCount: 1,
      },
    };

    console.log(`[Vertex AI] Calling endpoint: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`, // Using SERVICE ACCOUNT token
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Vertex AI] Error response:', errorText);
      throw new Error(`Vertex AI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[Vertex AI] Video generation started:', result);

    return {
      operationId: result.name || `operation-${Date.now()}`,
      status: 'processing',
    };
  } catch (error: any) {
    console.error('[Vertex AI] Video generation failed:', error);
    throw new Error(`Video generation failed: ${error.message}`);
  }
}

/**
 * Check video generation status
 */
export async function checkVideoGenerationStatus(operationId: string): Promise<{
  status: 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
}> {
  try {
    const accessToken = await getServiceAccountToken();

    const endpoint = `https://${VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/${operationId}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const operation = await response.json();

    if (!operation.done) {
      return { status: 'processing' };
    }

    if (operation.error) {
      return {
        status: 'failed',
        error: operation.error.message || 'Video generation failed',
      };
    }

    // Extract video URL from response
    const predictions = operation.response?.predictions || operation.response?.generatedSamples;
    const videoUri = predictions?.[0]?.video?.uri || predictions?.[0]?.videoUri;

    if (videoUri) {
      return {
        status: 'completed',
        videoUrl: videoUri,
      };
    }

    return {
      status: 'failed',
      error: 'No video URL in response',
    };
  } catch (error: any) {
    console.error('[Vertex AI] Status check failed:', error);
    return {
      status: 'failed',
      error: error.message,
    };
  }
}

/**
 * Build enhanced prompt with tone and context
 */
function buildEnhancedPrompt(config: {
  prompt: string;
  intent?: string;
  tone?: string;
  background?: string;
}): string {
  const toneMap: Record<string, string> = {
    friendly: 'cheerful and playful',
    calm: 'calm and sincere',
    excited: 'excited and energetic',
    sad: 'sad and emotional',
    funny: 'funny and sarcastic',
    professional: 'professional and clear',
  };

  const toneModifier = config.tone && toneMap[config.tone]
    ? `in a ${toneMap[config.tone]} tone`
    : 'in a friendly tone';

  let enhancedPrompt = `A talking dog video that matches the visual style of the input image. The dog should appear to be speaking ${toneModifier}, saying: "${config.prompt}"`;

  if (config.background) {
    enhancedPrompt += `. The scene is set in ${config.background}`;
  }

  const intentContext: Record<string, string> = {
    adoption: '. The video has a warm, hopeful feeling suitable for adoption or rescue.',
    apology: '. The video conveys sincerity and heartfelt emotion.',
    celebration: '. The video is joyful and celebratory.',
    funny: '. The video is humorous and entertaining.',
    business: '. The video is professional and clear for promotional purposes.',
    memorial: '. The video is respectful and touching, suitable for a tribute.',
  };

  if (config.intent && intentContext[config.intent]) {
    enhancedPrompt += intentContext[config.intent];
  }

  enhancedPrompt += ' Preserve the visual style of the input image. Use natural lip-sync. The video should be 8 seconds long.';

  return enhancedPrompt;
}

/**
 * Get Vertex AI project info (for debugging)
 */
export function getVertexAIInfo() {
  return {
    projectId: VERTEX_AI_PROJECT_ID,
    location: VERTEX_AI_LOCATION,
    serviceAccountEmail: serviceAccountKey.client_email,
  };
}
