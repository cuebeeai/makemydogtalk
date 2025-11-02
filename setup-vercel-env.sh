#!/bin/bash

# Vercel Environment Variables Setup Script
# This script helps you set all environment variables at once

set -e

echo "🔧 Vercel Environment Variables Setup"
echo "======================================"
echo ""
echo "This script will help you set all required environment variables in Vercel."
echo "You can copy values from your .env file to make this faster."
echo ""

# Check if .env file exists
if [ -f .env ]; then
    echo "✅ Found .env file. You can copy values from there."
    echo ""
fi

# Function to add env var
add_env() {
    local var_name=$1
    local description=$2
    
    echo "📝 Setting: $var_name"
    echo "   $description"
    
    # Check if already exists
    if vercel env ls production 2>/dev/null | grep -q "^$var_name"; then
        echo "   ⚠️  Already exists. Skipping..."
    else
        vercel env add "$var_name" production
    fi
    echo ""
}

echo "Starting environment variable setup..."
echo ""

# Essential
add_env "DATABASE_URL" "PostgreSQL connection string"
add_env "SESSION_SECRET" "Random 32-character secret key"
add_env "VERTEX_AI_LOCATION" "Enter: us-central1"

# OAuth
add_env "GOOGLE_CLIENT_ID" "Google OAuth Client ID (xxx.apps.googleusercontent.com)"
add_env "GOOGLE_CLIENT_SECRET" "Google OAuth Secret (GOCSPX-xxxxx)"
add_env "OAUTH_REDIRECT_URI" "For now use: https://makemydogtalk.vercel.app/auth/callback"

# Vertex AI
add_env "SERVICE_ACCOUNT_JSON" "Full JSON service account credentials"
add_env "VERTEX_AI_PROJECT_ID" "GCP Project ID"

# Stripe
add_env "STRIPE_SECRET_KEY" "Stripe secret key (sk_live_... or sk_test_...)"
add_env "STRIPE_PUBLISHABLE_KEY" "Stripe publishable key (pk_live_... or pk_test_...)"
add_env "STRIPE_PRICE_ID_JUMP_LINE" "Stripe price ID for 1 video"
add_env "STRIPE_PRICE_ID_THREE_PACK" "Stripe price ID for 3 videos"
add_env "STRIPE_WEBHOOK_SECRET" "Stripe webhook secret (whsec_...)"

# Admin
add_env "ADMIN_EMAIL" "Admin email address"

echo "✅ Environment variable setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: vercel --prod"
echo "2. Get your deployment URL"
echo "3. Update OAUTH_REDIRECT_URI with actual URL"
echo "4. Update Google Cloud Console redirect URIs"
echo "5. Redeploy: vercel --prod"

