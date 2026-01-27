/**
 * Google Cloud Storage Helper
 * Uploads generated videos to GCS bucket for persistent storage
 */

import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage with service account credentials
let storage: Storage | null = null;
let isGCSConfigured = false;

// Support both GCS_PROJECT_ID (new) and VERTEX_AI_PROJECT_ID (legacy) for backwards compatibility
const GCS_PROJECT_ID = process.env.GCS_PROJECT_ID || process.env.VERTEX_AI_PROJECT_ID;

try {
  if (process.env.SERVICE_ACCOUNT_JSON && GCS_PROJECT_ID) {
    storage = new Storage({
      credentials: JSON.parse(process.env.SERVICE_ACCOUNT_JSON),
      projectId: GCS_PROJECT_ID,
    });
    isGCSConfigured = true;
    console.log('✅ Google Cloud Storage configured successfully');
  } else {
    console.warn('❌ Google Cloud Storage not configured. Video uploads will be unavailable.');
  }
} catch (error) {
  console.error('⚠️  Failed to initialize Google Cloud Storage:', error);
  console.warn('Video uploads will be unavailable.');
}

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'makemydogtalk-videos';

/**
 * Upload a video file to Google Cloud Storage
 * @param localFilePath - Path to the local video file
 * @param destinationFileName - Desired filename in the bucket
 * @returns Public URL of the uploaded video
 */
export async function uploadVideoToGCS(
  localFilePath: string,
  destinationFileName: string
): Promise<string> {
  if (!isGCSConfigured || !storage) {
    throw new Error('Google Cloud Storage is not configured. Please set SERVICE_ACCOUNT_JSON and GCS_PROJECT_ID.');
  }

  try {
    console.log(`📤 Uploading video to GCS: ${destinationFileName}`);
    
    const bucket = storage.bucket(BUCKET_NAME);
    
    // Upload the file
    await bucket.upload(localFilePath, {
      destination: destinationFileName,
      metadata: {
        contentType: 'video/mp4',
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
      // Don't set public: true because uniform bucket-level access is enabled
      // Instead, the bucket should have allUsers permission set at the bucket level
    });

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${destinationFileName}`;
    
    console.log(`✅ Video uploaded successfully: ${publicUrl}`);
    
    return publicUrl;
  } catch (error: any) {
    console.error('❌ Error uploading video to GCS:', error);
    throw new Error(`Failed to upload video to cloud storage: ${error.message}`);
  }
}

/**
 * Create the GCS bucket if it doesn't exist
 * This should be called during app initialization
 */
export async function ensureBucketExists(): Promise<void> {
  if (!isGCSConfigured || !storage) {
    console.warn('⚠️  Google Cloud Storage not configured. Skipping bucket verification.');
    return;
  }

  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const [exists] = await bucket.exists();

    if (!exists) {
      console.log(`📦 Creating GCS bucket: ${BUCKET_NAME}`);
      
      await storage.createBucket(BUCKET_NAME, {
        location: 'US',
        storageClass: 'STANDARD',
        iamConfiguration: {
          publicAccessPrevention: 'inherited',
          uniformBucketLevelAccess: {
            enabled: false, // Allow fine-grained ACLs for public access
          },
        },
      });
      
      console.log(`✅ Bucket created: ${BUCKET_NAME}`);
    } else {
      console.log(`✅ GCS bucket already exists: ${BUCKET_NAME}`);
    }
  } catch (error: any) {
    console.error(`❌ Error ensuring bucket exists: ${error.message}`);
    // Don't throw - app can still work without bucket creation
    console.warn('⚠️  Continuing without bucket verification. Videos may fail to upload.');
  }
}

/**
 * Delete a video from GCS
 * @param fileName - Name of the file to delete
 */
export async function deleteVideoFromGCS(fileName: string): Promise<void> {
  if (!isGCSConfigured || !storage) {
    throw new Error('Google Cloud Storage is not configured. Please set SERVICE_ACCOUNT_JSON and GCS_PROJECT_ID.');
  }

  try {
    const bucket = storage.bucket(BUCKET_NAME);
    await bucket.file(fileName).delete();
    console.log(`🗑️  Deleted video from GCS: ${fileName}`);
  } catch (error: any) {
    console.error(`❌ Error deleting video from GCS: ${error.message}`);
    throw error;
  }
}

/**
 * Upload an image file to Google Cloud Storage
 * Used to get a public URL for the Kie.ai API which requires image URLs
 * @param localFilePath - Path to the local image file
 * @param destinationFileName - Desired filename in the bucket
 * @returns Public URL of the uploaded image
 */
export async function uploadImageToGCS(
  localFilePath: string,
  destinationFileName: string
): Promise<string> {
  if (!isGCSConfigured || !storage) {
    throw new Error('Google Cloud Storage is not configured. Please set SERVICE_ACCOUNT_JSON and GCS_PROJECT_ID.');
  }

  try {
    console.log(`📤 Uploading image to GCS: ${destinationFileName}`);

    const bucket = storage.bucket(BUCKET_NAME);

    // Determine content type based on file extension
    const ext = localFilePath.toLowerCase().split('.').pop();
    let contentType = 'image/jpeg';
    if (ext === 'png') contentType = 'image/png';
    else if (ext === 'webp') contentType = 'image/webp';

    // Upload the file
    await bucket.upload(localFilePath, {
      destination: destinationFileName,
      metadata: {
        contentType,
        cacheControl: 'public, max-age=3600', // Cache for 1 hour (temporary upload)
      },
    });

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${destinationFileName}`;

    console.log(`✅ Image uploaded successfully: ${publicUrl}`);

    return publicUrl;
  } catch (error: any) {
    console.error('❌ Error uploading image to GCS:', error);
    throw new Error(`Failed to upload image to cloud storage: ${error.message}`);
  }
}

/**
 * Delete a file from GCS (generic)
 * @param fileName - Name of the file to delete
 */
export async function deleteFileFromGCS(fileName: string): Promise<void> {
  if (!isGCSConfigured || !storage) {
    return; // Silently fail if not configured
  }

  try {
    const bucket = storage.bucket(BUCKET_NAME);
    await bucket.file(fileName).delete();
    console.log(`🗑️  Deleted file from GCS: ${fileName}`);
  } catch (error: any) {
    // Don't throw - cleanup failures shouldn't break the flow
    console.warn(`⚠️  Failed to delete file from GCS: ${fileName}`);
  }
}
