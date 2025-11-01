# Deployment Guide: MakeMyDogTalk.com to Google Cloud Run

## Prerequisites

1. **Google Cloud Project** with billing enabled
2. **Firebase CLI** installed: `npm install -g firebase-tools`
3. **Google Cloud SDK (gcloud)** installed
4. **Docker** installed (for local testing)
5. **Cloudflare** account with makemydogtalk.com domain

## Step 1: Set Up Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Set your project ID (replace with your actual project ID)
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

## Step 2: Configure Environment Variables for Production

You need to set these environment variables in Cloud Run:

### Required Environment Variables:

```bash
# Google OAuth (User Authentication)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
OAUTH_REDIRECT_URI=https://makemydogtalk.com/auth/callback

# Vertex AI (Service Account)
SERVICE_ACCOUNT_JSON={"type":"service_account",...}
VERTEX_AI_PROJECT_ID=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1

# Server Configuration
PORT=8080
NODE_ENV=production

# Session Secret (generate a random string)
SESSION_SECRET=your-random-32-character-secret

# Stripe Payment Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_JUMP_LINE=price_...
STRIPE_PRICE_3_PACK=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database (if using external PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# Optional: Admin email
ADMIN_EMAIL=your-admin@email.com
```

## Step 3: Build and Test Docker Image Locally (Optional)

```bash
# Build the Docker image
docker build -t makemydogtalk .

# Test run locally (make sure to set environment variables)
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e PORT=8080 \
  -e GOOGLE_CLIENT_ID=your-id \
  -e GOOGLE_CLIENT_SECRET=your-secret \
  # ... add other env vars
  makemydogtalk

# Test at http://localhost:8080
```

## Step 4: Deploy to Cloud Run

### Option A: Deploy using gcloud CLI

```bash
# Build and deploy in one command
gcloud run deploy makemydogtalk \
  --source . \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=2Gi \
  --cpu=2 \
  --min-instances=0 \
  --max-instances=10 \
  --set-env-vars="NODE_ENV=production,PORT=8080" \
  --set-env-vars="GOOGLE_CLIENT_ID=your-id" \
  --set-env-vars="GOOGLE_CLIENT_SECRET=your-secret" \
  # ... add all other environment variables

# Get the service URL
gcloud run services describe makemydogtalk --region=us-central1 --format="value(status.url)"
```

### Option B: Deploy using Cloud Build (Recommended)

```bash
# Submit build to Cloud Build
gcloud builds submit --config cloudbuild.yaml

# Set environment variables after deployment
gcloud run services update makemydogtalk \
  --region=us-central1 \
  --update-env-vars="NODE_ENV=production,PORT=8080,GOOGLE_CLIENT_ID=your-id,..."
```

### Setting Environment Variables via Console:

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click on your service "makemydogtalk"
3. Click "EDIT & DEPLOY NEW REVISION"
4. Go to "Variables & Secrets" tab
5. Add all environment variables
6. Click "DEPLOY"

## Step 5: Configure Custom Domain in Cloud Run

```bash
# Add your custom domain
gcloud run domain-mappings create \
  --service=makemydogtalk \
  --domain=makemydogtalk.com \
  --region=us-central1

# Get the DNS records to configure
gcloud run domain-mappings describe \
  --domain=makemydogtalk.com \
  --region=us-central1
```

## Step 6: Configure Cloudflare DNS

1. Log in to your Cloudflare dashboard
2. Select the domain: **makemydogtalk.com**
3. Go to DNS settings
4. Add/Update DNS records based on Cloud Run output:

```
Type: A
Name: @
Content: [IP from Cloud Run]
Proxy status: Proxied (orange cloud)

Type: CNAME
Name: www
Content: makemydogtalk.com
Proxy status: Proxied (orange cloud)
```

Or use the Load Balancer IP provided by Cloud Run.

### Configure Cloudflare SSL/TLS

1. Go to SSL/TLS → Overview
2. Set SSL/TLS encryption mode to **Full (strict)**
3. Enable **Always Use HTTPS**
4. Enable **HTTP Strict Transport Security (HSTS)**

## Step 7: Update OAuth Redirect URIs

Update your Google OAuth settings to use the production domain:

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add:
   - `https://makemydogtalk.com/auth/callback`
   - `https://www.makemydogtalk.com/auth/callback`

## Step 8: Configure Stripe Webhook

1. Go to [Stripe Dashboard - Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://makemydogtalk.com/api/webhook`
3. Select events to listen for
4. Copy the webhook signing secret
5. Update the `STRIPE_WEBHOOK_SECRET` environment variable in Cloud Run

## Step 9: Database Setup

If you need a PostgreSQL database:

### Option A: Neon (Recommended - Free tier available)
```bash
# Sign up at neon.tech
# Create a project and get the connection string
# Add DATABASE_URL to Cloud Run environment variables
```

### Option B: Google Cloud SQL
```bash
# Create Cloud SQL PostgreSQL instance
gcloud sql instances create makemydogtalk-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Connect Cloud Run to Cloud SQL
gcloud run services update makemydogtalk \
  --add-cloudsql-instances=$PROJECT_ID:us-central1:makemydogtalk-db \
  --region=us-central1
```

## Step 10: Verify Deployment

1. Visit `https://makemydogtalk.com`
2. Test the following:
   - ✅ Homepage loads correctly
   - ✅ Google OAuth login works
   - ✅ Email/password signup works
   - ✅ Video generation works
   - ✅ Stripe payment flow works
   - ✅ File uploads work
   - ✅ All images/assets load

## Monitoring and Logs

```bash
# View logs
gcloud run services logs read makemydogtalk --region=us-central1

# Stream logs in real-time
gcloud run services logs tail makemydogtalk --region=us-central1
```

## Continuous Deployment (Optional)

Set up automatic deployment from GitHub:

1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click "CREATE TRIGGER"
3. Connect your GitHub repository
4. Set trigger to run on push to `main` branch
5. Use `cloudbuild.yaml` configuration

## Troubleshooting

### Issue: "Container failed to start"
- Check logs: `gcloud run services logs read makemydogtalk`
- Verify PORT environment variable is set to 8080
- Ensure all required environment variables are set

### Issue: OAuth redirect fails
- Verify `OAUTH_REDIRECT_URI` matches your domain
- Check Google Cloud Console OAuth settings
- Ensure domain is using HTTPS

### Issue: Database connection fails
- Check DATABASE_URL format
- Verify Cloud SQL connection if using Cloud SQL
- Check firewall/network settings

### Issue: File uploads not working
- Consider using Google Cloud Storage for file uploads in production
- Update code to use Cloud Storage instead of local filesystem

## Cost Optimization

Cloud Run pricing is based on:
- Requests
- CPU and memory usage
- Data transfer

Tips:
- Use `--min-instances=0` to scale to zero when not in use
- Start with smaller memory/CPU and scale up as needed
- Monitor usage in Cloud Console
- Set up billing alerts

## Security Checklist

- ✅ All environment variables set securely
- ✅ HTTPS enabled via Cloudflare
- ✅ OAuth credentials configured for production domain
- ✅ Stripe webhook secrets set
- ✅ Session secrets are random and secure
- ✅ Cloud Run service has appropriate IAM permissions
- ✅ Database has strong password (if applicable)
- ✅ CORS configured properly
- ✅ Rate limiting enabled

## Support

For issues, check:
1. Cloud Run logs
2. Cloud Build history
3. Cloudflare analytics
4. Application logs

---

**Ready to deploy!** Start with Step 1 and work through each step carefully.
