# Firebase App Hosting Deployment Guide

## 🚀 Step-by-Step Deployment Instructions

### Prerequisites (You Need to Do These Steps)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Create or Select Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project OR select existing project
   - Note your project ID (you'll need this)

### Step 1: Initialize Firebase App Hosting

Run this command in your project directory:
```bash
npm run firebase:init
```

This will:
- Connect your local project to your Firebase project
- Set up App Hosting configuration
- Link to your GitHub repository (if prompted)

### Step 2: Connect to GitHub Repository

During initialization, you'll be prompted to:
1. **Connect to GitHub**: Authorize Firebase to access your GitHub account
2. **Select Repository**: Choose your repository (e.g., `yourusername/DogTalkVideo`)
3. **Select Branch**: Choose your main branch (usually `main` or `master`)

### Step 3: Configure Environment Secrets

In the [Firebase Console](https://console.firebase.google.com/):

1. Go to your project
2. Navigate to **App Hosting** in the left sidebar
3. Click on your app
4. Go to **Settings** → **Environment Variables**
5. Add these secrets one by one:

#### Required Secrets:
```
DATABASE_URL=postgresql://username:password@host:port/database
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
OAUTH_REDIRECT_URI=https://your-app-domain.web.app/auth/callback
SERVICE_ACCOUNT_JSON={"type":"service_account",...}
VERTEX_AI_PROJECT_ID=your-gcp-project-id
SESSION_SECRET=your-random-32-character-secret
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_... for testing)
STRIPE_PRICE_ID_JUMP_LINE=price_...
STRIPE_PRICE_ID_THREE_PACK=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
ADMIN_EMAIL=your-admin@email.com
```

### Step 4: Update OAuth Redirect URIs

1. **Google Cloud Console**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services** → **Credentials**
   - Find your OAuth 2.0 Client ID
   - Add your Firebase App Hosting URL to **Authorized redirect URIs**:
     - `https://your-app-id.web.app/auth/callback`
     - `https://your-app-id.firebaseapp.com/auth/callback`

2. **Stripe Dashboard**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/)
   - Navigate to **Developers** → **Webhooks**
   - Update webhook endpoint URL to: `https://your-app-id.web.app/api/webhook`

### Step 5: Deploy Your Application

```bash
npm run deploy
```

This will:
- Build your application
- Deploy to Firebase App Hosting
- Provide you with live URLs

### Step 6: Test Your Deployment

1. Visit your app at the provided Firebase URL
2. Test key functionality:
   - User authentication (Google OAuth)
   - Video generation
   - Payment processing
   - Admin features

## 🔧 Configuration Files Created

The following files have been configured for Firebase App Hosting:

- **`apphosting.yaml`**: Main App Hosting configuration
- **`firebase.json`**: Firebase project configuration
- **`package.json`**: Updated with deployment scripts

## 🌐 Environment Variables

Your app uses these environment variables (configured as secrets in Firebase):

### Authentication & OAuth
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `OAUTH_REDIRECT_URI`: OAuth callback URL
- `SESSION_SECRET`: Session encryption secret

### Database
- `DATABASE_URL`: PostgreSQL database connection string

### AI/Video Generation
- `SERVICE_ACCOUNT_JSON`: Google Cloud service account credentials
- `VERTEX_AI_PROJECT_ID`: Google Cloud project ID for Vertex AI
- `VERTEX_AI_LOCATION`: Set to `us-central1` (configured in apphosting.yaml)

### Payment Processing
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `STRIPE_PRICE_ID_JUMP_LINE`: Stripe price ID for single video
- `STRIPE_PRICE_ID_THREE_PACK`: Stripe price ID for 3-video pack
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret

### Admin
- `ADMIN_EMAIL`: Admin email for bypass functionality

## 🚨 Important Notes

1. **Database**: Make sure your PostgreSQL database is accessible from Firebase App Hosting
2. **File Uploads**: The app uses local file storage in `/uploads` - consider using Google Cloud Storage for production
3. **Domain**: You can add a custom domain in Firebase Console → App Hosting → Settings
4. **Monitoring**: Check Firebase Console for logs and performance metrics

## 🔄 Continuous Deployment

Once set up, Firebase App Hosting will automatically deploy when you push to your connected GitHub branch. You can also manually deploy using:

```bash
npm run deploy
```

## 🆘 Troubleshooting

- **Build Failures**: Check Firebase Console logs for detailed error messages
- **Environment Variables**: Ensure all secrets are properly configured in Firebase Console
- **OAuth Issues**: Verify redirect URIs are correctly set in Google Cloud Console
- **Payment Issues**: Check Stripe webhook configuration and test with Stripe CLI

---

*Your app is now ready for Firebase App Hosting! 🎉*
