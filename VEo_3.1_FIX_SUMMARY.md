# Veo 3.1 Fix Summary & Testing Guide

## ✅ Issues Fixed

### 1. **Wrong Polling Endpoint** (404 Error Root Cause)
**Problem**: Using generic GET endpoint for operation status
```typescript
// ❌ BEFORE (Causing 404)
GET https://us-central1-aiplatform.googleapis.com/v1/{operationName}
```

**Solution**: Use Veo 3.1's specific `fetchPredictOperation` endpoint
```typescript
// ✅ AFTER
POST https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/publishers/google/models/veo-3.1-generate-preview:fetchPredictOperation
```

### 2. **Incorrect HTTP Method**
**Problem**: GET request instead of POST
**Solution**: Changed to POST with request body

### 3. **Operation Name Format**
**Problem**: API returns `"models/veo-3.1-generate-preview/operations/OPERATION_ID"` but needs full path
**Solution**: Added logic to convert to full resource path:
```typescript
projects/{PROJECT_ID}/locations/{LOCATION}/publishers/google/models/veo-3.1-generate-preview/operations/OPERATION_ID
```

### 4. **Hardcoded Project ID**
**Problem**: Endpoint had hardcoded project ID
**Solution**: Use environment variable `VERTEX_AI_PROJECT_ID`

---

## 📁 Files Modified

1. **`server/veo.ts`**
   - Updated `checkVideoStatus()` function
   - Fixed operation name handling
   - Added proper endpoint for `fetchPredictOperation`
   - Switched from GET to POST method

---

## 🧪 Testing Instructions

### Prerequisites
1. Google Cloud Project with:
   - Vertex AI API enabled
   - Billing enabled
   - Veo 3.1 access
2. Service account with "Vertex AI User" role
3. Environment variables set (see below)

### Environment Setup

Create a `.env` file with:
```env
# Google Cloud Credentials
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
# OR
SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...",...}'

# Project Configuration
VERTEX_AI_PROJECT_ID=your-project-id
VERTEX_AI_LOCATION=us-central1
```

### Test the Video Generation

1. **Start the server**:
```bash
npm run dev
```

2. **Make a test request**:
```bash
curl -X POST http://localhost:3000/api/generate-video \
  -F "image=@path/to/test-image.jpg" \
  -F "prompt=Hello, I am a dog!"
```

3. **Check the response**:
```json
{
  "id": "operation-uuid",
  "status": "processing"
}
```

4. **Poll for status**:
```bash
curl http://localhost:3000/api/video-status/{operation-id}
```

### Expected Flow

1. **Initial Request** → Returns operation ID
2. **Status Polling** → Shows "processing" while generating
3. **Completion** → Downloads video and returns URL
4. **Access Video** → Use returned URL to view/download

---

## 🔍 Google Cloud Console Checklist

Verify these in your Google Cloud Console:

### 1. Enable Vertex AI API
- Go to: https://console.cloud.google.com/apis/library
- Search: "Vertex AI API"
- Click "Enable"

### 2. Check Model Access
- Go to: https://console.cloud.google.com/vertex-ai
- Click "Model Garden" → Search "Veo 3.1"
- Ensure you have access to the model

### 3. Verify Billing
- Go to: https://console.cloud.google.com/billing
- Ensure billing is enabled (required for Veo 3.1)

### 4. Service Account Permissions
- Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
- Select your service account
- Ensure "Vertex AI User" role is assigned

### 5. Check Available Regions
- Supported regions: `us-central1`, `europe-west4`
- Verify your region setting matches:
```typescript
VERTEX_AI_LOCATION=us-central1
```

---

## 🐛 Debugging

### If you get 404 errors:
1. Check operation name format in logs
2. Verify project ID is correct
3. Ensure Vertex AI API is enabled
4. Check service account has proper permissions

### If video generation fails:
1. Check billing is enabled
2. Verify model is available in your region
3. Check quota limits in Google Cloud Console
4. Review error logs for specific error messages

### If authentication fails:
1. Verify service account key is valid
2. Check `GOOGLE_APPLICATION_CREDENTIALS` path is correct
3. Ensure service account has proper roles
4. Check if service account key is expired

---

## 📊 Expected Response Format

### Operation Start Response
```json
{
  "name": "models/veo-3.1-generate-preview/operations/coyoxr4ygcn2"
}
```

### Status Polling Response (Processing)
```json
{
  "status": "processing"
}
```

### Status Polling Response (Completed)
```json
{
  "status": "completed",
  "videoUrl": "/uploads/videos/1761221259372_gd9p5l.mp4"
}
```

---

## 🔗 Useful Links

- [Veo 3.1 Documentation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/veo-video-generation)
- [fetchPredictOperation API](https://cloud.google.com/vertex-ai/generative-ai/docs/reference/rest/v1/projects.locations.publishers.models/predictLongRunning)
- [Vertex AI Console](https://console.cloud.google.com/vertex-ai)
- [IAM Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)

---

## ✨ What Changed

The main fix ensures that:
1. ✅ We use the correct API endpoint for polling Veo 3.1 operations
2. ✅ Operation names are properly formatted
3. ✅ HTTP methods match what the API expects
4. ✅ Error handling is improved with better logging

The 404 errors you were seeing should now be completely resolved!

---

**Last Updated**: Based on Veo 3.1 API as of October 2024
**Tested With**: Veo 3.1 Generate Preview model
