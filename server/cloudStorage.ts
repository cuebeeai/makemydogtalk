/**
 * Google Cloud Storage Helper
 * Uploads generated videos to GCS bucket for persistent storage
 */

import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage with service account credentials
const storage = new Storage({
  credentials: process.env.SERVICE_ACCOUNT_JSON 
    ? JSON.parse(process.env.SERVICE_ACCOUNT_JSON)
    : undefined,
  projectId: process.env.VERTEX_AI_PROJECT_ID,
});

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
      public: true, // Make the file publicly accessible
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
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    await bucket.file(fileName).delete();
    console.log(`🗑️  Deleted video from GCS: ${fileName}`);
  } catch (error: any) {
    console.error(`❌ Error deleting video from GCS: ${error.message}`);
    throw error;
  }
}

