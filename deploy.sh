#!/bin/bash

# Deployment script for MakeMyDogTalk.com to Google Cloud Run

set -e  # Exit on error

# Use full path to gcloud
GCLOUD="$HOME/google-cloud-sdk/bin/gcloud"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 MakeMyDogTalk.com Deployment Script${NC}"
echo ""

# Check if gcloud is installed
if [ ! -f "$GCLOUD" ]; then
    echo -e "${RED}❌ gcloud CLI not found at $GCLOUD${NC}"
    echo "Please run: curl https://sdk.cloud.google.com | bash"
    exit 1
fi

# Check if user is logged in
if ! $GCLOUD auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to gcloud. Logging in...${NC}"
    $GCLOUD auth login
fi

# Get project ID
PROJECT_ID=$($GCLOUD config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}⚠️  No project set. Please enter your project ID:${NC}"
    read PROJECT_ID
    $GCLOUD config set project $PROJECT_ID
fi

echo -e "${GREEN}📦 Using project: ${PROJECT_ID}${NC}"
echo ""

# Service name
SERVICE_NAME="makemydogtalk"
REGION="us-central1"

echo -e "${YELLOW}🔍 Checking required APIs...${NC}"
$GCLOUD services enable run.googleapis.com
$GCLOUD services enable cloudbuild.googleapis.com
$GCLOUD services enable containerregistry.googleapis.com
echo -e "${GREEN}✅ APIs enabled${NC}"
echo ""

echo -e "${YELLOW}🏗️  Building and deploying to Cloud Run...${NC}"
echo ""

# Deploy using Cloud Build
$GCLOUD run deploy $SERVICE_NAME \
  --source . \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=2Gi \
  --cpu=2 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""

    # Get the service URL
    SERVICE_URL=$($GCLOUD run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    echo -e "${GREEN}🌐 Service URL: ${SERVICE_URL}${NC}"
    echo ""

    echo -e "${YELLOW}⚠️  IMPORTANT NEXT STEPS:${NC}"
    echo ""
    echo "1. Set environment variables in Cloud Run Console:"
    echo "   https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}/variables?project=${PROJECT_ID}"
    echo ""
    echo "2. Update Google OAuth redirect URI to:"
    echo "   https://makemydogtalk.com/auth/callback"
    echo ""
    echo "3. Configure custom domain:"
    echo "   $GCLOUD run domain-mappings create --service=$SERVICE_NAME --domain=makemydogtalk.com --region=$REGION"
    echo ""
    echo "4. Configure Cloudflare DNS to point to Cloud Run IP"
    echo ""
    echo "5. Update Stripe webhook URL to:"
    echo "   https://makemydogtalk.com/api/webhook"
    echo ""
    echo -e "${GREEN}📖 See DEPLOYMENT.md for detailed instructions${NC}"
else
    echo ""
    echo -e "${RED}❌ Deployment failed. Check the error messages above.${NC}"
    exit 1
fi
