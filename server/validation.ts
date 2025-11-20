/**
 * Input validation and security constants for the application
 */

import { z } from 'zod';

// Security Constants
export const VALIDATION_LIMITS = {
  MAX_PROMPT_LENGTH: 500,
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
  ALLOWED_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png'],
  MIN_PROMPT_LENGTH: 5,
  MAX_BACKGROUND_LENGTH: 100,
  MAX_ACTION_LENGTH: 100,
  MAX_VOICE_STYLE_LENGTH: 50,
};

// Rate Limiting Constants
export const RATE_LIMITS = {
  VIDEO_GENERATION_PER_HOUR: 10,
  VIDEO_GENERATION_PER_DAY: 50,
  VIDEO_GENERATION_COOLDOWN_MS: 30000, // 30 seconds between requests
};

// Validation Schemas
export const videoGenerationSchema = z.object({
  prompt: z.string()
    .min(VALIDATION_LIMITS.MIN_PROMPT_LENGTH, 'Prompt must be at least 5 characters')
    .max(VALIDATION_LIMITS.MAX_PROMPT_LENGTH, 'Prompt must be less than 500 characters')
    .refine(
      (val) => val.trim().length > 0,
      'Prompt cannot be empty or only whitespace'
    )
    .refine(
      (val) => {
        // If using multi-dog format, validate the structure
        const isMultiDog = /Dog\s+\d+:/i.test(val);
        if (isMultiDog) {
          // Check that each dog has dialogue after the "Dog X:" label
          const dogSections = val.split(/Dog\s+\d+:/i);
          // First element is empty or text before first dog
          const dogDialogues = dogSections.slice(1);

          // Ensure all dogs have non-empty dialogue
          return dogDialogues.every(dialogue => dialogue.trim().length > 0);
        }
        return true;
      },
      'Each dog must have dialogue. Format: "Dog 1: [dialogue] Dog 2: [dialogue]"'
    ),
  intent: z.enum(['adoption', 'apology', 'celebration', 'funny', 'business', 'memorial', '']).optional(),
  tone: z.enum(['friendly', 'calm', 'excited', 'sad', 'funny', 'professional', '']).optional(),
  voiceStyle: z.string()
    .max(VALIDATION_LIMITS.MAX_VOICE_STYLE_LENGTH, 'Voice style must be less than 50 characters')
    .optional(),
  action: z.string()
    .max(VALIDATION_LIMITS.MAX_ACTION_LENGTH, 'Action must be less than 100 characters')
    .optional(),
  background: z.string()
    .max(VALIDATION_LIMITS.MAX_BACKGROUND_LENGTH, 'Background must be less than 100 characters')
    .optional(),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).optional(),
});

export type VideoGenerationInput = z.infer<typeof videoGenerationSchema>;

/**
 * Validate file upload
 */
export function validateImageFile(file: Express.Multer.File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > VALIDATION_LIMITS.MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds ${VALIDATION_LIMITS.MAX_FILE_SIZE_MB}MB limit`,
    };
  }

  // Check MIME type
  if (!VALIDATION_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Only JPEG and PNG images are allowed`,
    };
  }

  // Check file extension
  const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!ext || !VALIDATION_LIMITS.ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file extension. Only .jpg, .jpeg, and .png are allowed`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize error messages to prevent information leakage
 */
export function sanitizeError(error: any): string {
  const errorMessage = error?.message || 'An unexpected error occurred';

  // IMPORTANT: Check for content moderation errors FIRST before sanitizing
  // These should be shown to users so they can fix their prompts
  if (errorMessage.includes('sensitive words') ||
      errorMessage.includes('Responsible AI practices') ||
      errorMessage.includes('violate') ||
      errorMessage.includes('content policy')) {
    // Return the full error message for content moderation issues
    // Users need this feedback to understand why their prompt was rejected
    return errorMessage;
  }

  // Remove sensitive patterns from error messages
  const sensitivePatterns = [
    /projects\/[^\/]+/g,                    // GCP project IDs
    /service-account-[^@]+@[^\.]+\.iam\.gserviceaccount\.com/g, // Service account emails
    /gs:\/\/[^\/]+/g,                       // GCS bucket paths
    /Bearer\s+[A-Za-z0-9\-._~+\/]+=*/g,    // Bearer tokens
    /AIza[0-9A-Za-z\-_]{35}/g,             // API keys
    /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, // UUIDs/operation IDs
  ];

  let sanitized = errorMessage;
  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  // Map technical errors to user-friendly messages
  if (sanitized.includes('PERMISSION_DENIED') || sanitized.includes('403')) {
    return 'Service configuration error. Please contact support.';
  }
  if (sanitized.includes('QUOTA_EXCEEDED') || sanitized.includes('429')) {
    return 'Service is temporarily busy. Please try again in a few minutes.';
  }
  if (sanitized.includes('INVALID_ARGUMENT') || sanitized.includes('400')) {
    return 'Invalid request. Please check your input and try again.';
  }
  if (sanitized.includes('NOT_FOUND') || sanitized.includes('404')) {
    return 'Resource not found. Please try again.';
  }

  // Generic error for anything else
  return 'An error occurred while processing your request. Please try again later.';
}
