# MakeMyDogTalk.com - OAuth + Vertex AI Backend

Complete Node.js Express backend integrating **Google OAuth 2.0 user authentication** and **Vertex AI video generation** using service account credentials.

## 🔐 Two Types of Authentication

### 1. **User Authentication** (OAuth 2.0)
- Users log in with their Google account
- Handled by `server/auth.ts`
- Creates user sessions
- Protects routes with middleware
- **Purpose**: Identify who is using the app

### 2. **Service Account Authentication** (Vertex AI)
- App authenticates to Google Cloud
- Handled by `server/vertexAI.ts`
- Uses service account JSON credentials
- Calls Vertex AI APIs on behalf of the app
- **Purpose**: Generate videos programmatically

> **Key Point**: User OAuth tokens are NOT used for Vertex AI. The app uses its own service account.

---

## 📋 Prerequisites

1. **Node.js** 18+ and npm
2. **Google Cloud Project** with:
   - Vertex AI API enabled
   - OAuth 2.0 credentials (Web application)
   - Service account with Vertex AI permissions
3. **Service Account JSON** downloaded from Google Cloud Console

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

###2. Set Up Environment Variables

Create `.env` file in the project root:

```env
# ========================================
# GOOGLE OAUTH 2.0 (User Authentication)
# ========================================
# Get these from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# ========================================
# VERTEX AI (Service Account)
# ========================================
# Paste the ENTIRE contents of your service account JSON file here
# Get from: https://console.cloud.google.com/iam-admin/serviceaccounts
SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project",...}

# Optional: Override project/location
VERTEX_AI_PROJECT_ID=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1

# ========================================
# SERVER
# ========================================
PORT=3000
NODE_ENV=development
```

### 3. Get Google OAuth Credentials

1. Go to [Google Cloud Console → APIs & Credentials](https://console.cloud.google.com/apis/credentials)
2. Create **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Authorized redirect URIs: `http://localhost:3000/auth/callback`
5. Copy Client ID and Client Secret to `.env`

### 4. Get Service Account JSON

1. Go to [IAM & Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Create service account or use existing
3. Grant role: **Vertex AI User**
4. Create JSON key
5. Copy **entire JSON content** to `SERVICE_ACCOUNT_JSON` in `.env`

### 5. Enable Vertex AI API

```bash
gcloud services enable aiplatform.googleapis.com --project=YOUR_PROJECT_ID
```

### 6. Run the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

---

## 🔄 OAuth Flow

### Step 1: Start Login
```bash
curl http://localhost:3000/auth/google
```
Returns redirect URL to Google login page.

### Step 2: User Logs In
User is redirected to Google, grants permissions, then redirected back to:
```
http://localhost:3000/auth/callback?code=AUTHORIZATION_CODE
```

### Step 3: Get Session Token
Backend exchanges code for tokens, creates session, returns:
```json
{
  "success": true,
  "user": {
    "id": "google-user-id",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "accessToken": "user-session-token"
}
```

### Step 4: Use Token
Include in subsequent requests:
```bash
curl -H "Authorization: Bearer user-session-token" \
  http://localhost:3000/generate-video
```

---

## 🎥 Video Generation Flow

### Generate Video (Authenticated Users Only)

```bash
curl -X POST http://localhost:3000/generate-video \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -F "image=@dog.jpg" \
  -F "prompt=Hi! I'm a talking dog!" \
  -F "tone=friendly" \
  -F "intent=funny"
```

Response:
```json
{
  "success": true,
  "operationId": "projects/.../operations/...",
  "status": "processing",
  "message": "Video generation started"
}
```

### Check Status

```bash
curl http://localhost:3000/video-status/OPERATION_ID \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

Response (processing):
```json
{
  "status": "processing"
}
```

Response (completed):
```json
{
  "status": "completed",
  "videoUrl": "https://..."
}
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/auth/google` | ❌ No | Get Google OAuth URL |
| GET | `/auth/callback` | ❌ No | OAuth callback handler |
| POST | `/auth/logout` | ✅ Yes | Logout user |
| GET | `/auth/me` | ✅ Yes | Get current user info |

### Video Generation

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/generate-video` | ✅ Yes | Generate talking dog video |
| GET | `/video-status/:id` | ✅ Yes | Check generation status |

### Health

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/` | ❌ No | Server health check |
| GET | `/health` | ❌ No | Detailed health status |

---

## 🔧 Code Architecture

```
server/
├── auth.ts              # OAuth 2.0 user authentication
├── vertexAI.ts          # Vertex AI service account integration
├── middleware.ts        # Authentication middleware
├── routes.ts            # API route handlers
└── index.ts             # Express server setup
```

### Key Separation of Concerns

- **`auth.ts`**: Handles USER login with Google OAuth
- **`vertexAI.ts`**: Handles APP authentication to Vertex AI (service account)
- **Middleware**: Verifies user is logged in before allowing video generation
- **Routes**: Protected routes check user auth, then use service account for Vertex AI

---

## 🧪 Testing Locally

### 1. Test Health Endpoint
```bash
curl http://localhost:3000/health
```

### 2. Test OAuth Flow
Open in browser:
```
http://localhost:3000/auth/google
```

### 3. Test Video Generation
```bash
# After logging in and getting token
curl -X POST http://localhost:3000/generate-video \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test-dog.jpg" \
  -F "prompt=Hello, I am a dog!"
```

---

## 🚨 Common Issues

### "Authentication required" when calling `/generate-video`
- Make sure you've logged in via `/auth/google` first
- Include `Authorization: Bearer YOUR_TOKEN` header
- Token might be expired - log in again

### "SERVICE_ACCOUNT_JSON not set"
- Ensure the entire JSON is in one line in `.env`
- Use escape characters for quotes if needed
- Or use `.env.local` and load with dotenv

### "Permission denied" from Vertex AI
- Service account needs **Vertex AI User** role
- Enable Vertex AI API in your project
- Check `VERTEX_AI_PROJECT_ID` matches your GCP project

### "Model not found" (veo-001)
- Vertex AI Veo might not be available in all regions
- Try different `VERTEX_AI_LOCATION` (us-central1, europe-west4)
- Model name might vary - check Google Cloud documentation

---

## 📝 Environment Variable Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | ✅ Yes | OAuth client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | ✅ Yes | OAuth client secret | `GOCSPX-xxx` |
| `OAUTH_REDIRECT_URI` | ✅ Yes | OAuth callback URL | `http://localhost:3000/auth/callback` |
| `SERVICE_ACCOUNT_JSON` | ✅ Yes | Full service account JSON | `{"type":"service_account",...}` |
| `VERTEX_AI_PROJECT_ID` | ⚠️ Optional | GCP project ID | `my-project-123` |
| `VERTEX_AI_LOCATION` | ⚠️ Optional | Vertex AI region | `us-central1` |
| `PORT` | ⚠️ Optional | Server port | `3000` |

---

## 🔒 Security Notes

1. **Never commit `.env`** - Add to `.gitignore`
2. **Use HTTPS in production** - Especially for OAuth callbacks
3. **Rotate service account keys** regularly
4. **Implement rate limiting** for video generation
5. **Add request validation** for user inputs
6. **Use Redis** for session storage in production (not in-memory Map)

---

## 🎯 Next Steps

- [ ] Add payment integration before video generation
- [ ] Implement request queue for video generation
- [ ] Add Redis for session persistence
- [ ] Set up webhook for Vertex AI operation completion
- [ ] Add video watermark for free tier
- [ ] Implement usage quotas per user

---

## 📚 Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Google Auth Library for Node.js](https://github.com/googleapis/google-auth-library-nodejs)
- [Service Account Authentication](https://cloud.google.com/docs/authentication/production)

---

**Built with ❤️ for MakeMyDogTalk.com**
