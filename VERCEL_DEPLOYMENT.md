# Vercel Deployment Guide

## 🚀 Quick Deploy

You're currently in the `vercel link` process. Here's how to complete the deployment:

### Step 1: Complete Vercel Link (In Progress)

In your terminal, you should see:
```
? Which scope should contain your project?
❯ cuebeeai's projects
```

Press **Enter** to continue, then answer:
- **Link to existing project?** → No (or create new project)
- **Project name?** → `makemydogtalk` (or your preferred name)

### Step 2: Configure Environment Variables

After linking, set all environment variables:

```bash
# Set environment variables one by one
vercel env add DATABASE_URL
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add OAUTH_REDIRECT_URI
vercel env add SERVICE_ACCOUNT_JSON
vercel env add VERTEX_AI_PROJECT_ID
vercel env add VERTEX_AI_LOCATION
vercel env add SESSION_SECRET
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_PRICE_ID_JUMP_LINE
vercel env add STRIPE_PRICE_ID_THREE_PACK
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add ADMIN_EMAIL
```

For each command, you'll be prompted to:
1. Enter the value
2. Choose environments: Select **Production**, **Preview**, and **Development**

#### Required Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | `GOCSPX-xxxxx` |
| `OAUTH_REDIRECT_URI` | OAuth callback URL | `https://your-app.vercel.app/auth/callback` |
| `SERVICE_ACCOUNT_JSON` | GCP Service Account JSON | `{"type":"service_account",...}` |
| `VERTEX_AI_PROJECT_ID` | GCP Project ID | `your-project-id` |
| `VERTEX_AI_LOCATION` | Vertex AI Region | `us-central1` |
| `SESSION_SECRET` | Random 32-char string | `your-secret-key` |
| `STRIPE_SECRET_KEY` | Stripe Secret Key | `sk_live_...` or `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key | `pk_live_...` or `pk_test_...` |
| `STRIPE_PRICE_ID_JUMP_LINE` | Stripe Price ID (1 video) | `price_xxxxx` |
| `STRIPE_PRICE_ID_THREE_PACK` | Stripe Price ID (3 videos) | `price_xxxxx` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret | `whsec_xxxxx` |
| `ADMIN_EMAIL` | Admin bypass email | `admin@example.com` |

### Step 3: Deploy to Vercel

```bash
vercel --prod
```

This will:
1. Build your application (`npm run build`)
2. Deploy to Vercel's global CDN
3. Provide you with a production URL

### Step 4: Update OAuth Redirect URIs

Once deployed, you'll get a URL like: `https://makemydogtalk.vercel.app`

#### Google Cloud Console:
1. Go to https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Add these to **Authorized redirect URIs**:
   - `https://makemydogtalk.vercel.app/auth/callback`
   - `https://makemydogtalk.vercel.app/auth/google/callback`
   - `https://your-custom-domain.com/auth/callback` (if using custom domain)

#### Update Environment Variable:
```bash
vercel env add OAUTH_REDIRECT_URI
# Enter: https://makemydogtalk.vercel.app/auth/callback
```

Then redeploy:
```bash
vercel --prod
```

### Step 5: Update Stripe Webhook

In [Stripe Dashboard](https://dashboard.stripe.com/webhooks):
1. Click on your webhook endpoint
2. Update URL to: `https://makemydogtalk.vercel.app/api/webhook`
3. Copy the new signing secret
4. Update in Vercel:
   ```bash
   vercel env add STRIPE_WEBHOOK_SECRET
   ```

## 🔧 Vercel Configuration Files

### Created Files:
- **`vercel.json`** - Vercel deployment configuration
- **`server/vercel.ts`** - Serverless function entry point
- **`api/index.js`** - Compiled serverless function (auto-generated)

### How It Works:

1. **Static Files**: Served from `dist/public/` directory
   - React app, CSS, JS, images
   - Cached on Vercel's global CDN

2. **API Routes**: Handled by serverless function at `api/index.js`
   - `/api/*` - API endpoints
   - `/auth/*` - Authentication routes
   - `/uploads/*` - File uploads
   - All other routes - SPA fallback

3. **Serverless Function**: 
   - Memory: 3GB
   - Timeout: 60 seconds
   - Cold start: ~1-2 seconds
   - Warm: < 100ms

## 📊 Testing Your Deployment

### 1. Test OAuth Flow:
```bash
curl -I https://your-app.vercel.app/auth/google
```
**Expected**: `HTTP/2 302` redirect to Google OAuth

### 2. Test API Health:
```bash
curl https://your-app.vercel.app/api/health
```
**Expected**: JSON response with status

### 3. Test Frontend:
Visit: `https://your-app.vercel.app/`
**Expected**: React app loads successfully

### 4. Test Complete Flow:
1. Visit your app
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Upload dog image
5. Generate video
6. Check video status

## 🌐 Custom Domain (Optional)

### Add Custom Domain:
```bash
vercel domains add makemydogtalk.com
```

Follow the prompts to:
1. Verify domain ownership
2. Configure DNS records
3. Wait for DNS propagation (~5-60 minutes)

### After Domain is Active:
Update OAuth redirect URIs in Google Cloud Console to include your custom domain.

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:
- **Pushes to `main`** → Production deployment
- **Pull requests** → Preview deployment

To enable:
1. Go to https://vercel.com/dashboard
2. Click your project
3. Go to **Settings** → **Git**
4. Connect your GitHub repository

## ⚡ Performance Tips

### 1. **Edge Functions** (Optional)
For even faster cold starts, consider Edge Functions:
- Edit `vercel.json`: Change runtime to `edge`
- Note: Some Node.js APIs not available at edge

### 2. **Caching**
Static assets are automatically cached. API responses can be cached:
```javascript
res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
```

### 3. **Database Connection Pooling**
Vercel serverless functions benefit from connection pooling:
- Already configured with `@neondatabase/serverless`
- Reuses connections across invocations

## 🆘 Troubleshooting

### Build Fails:
```bash
vercel logs
```
Check logs for errors during build process.

### Function Timeout:
If video generation takes > 60 seconds:
1. Go to Vercel Dashboard → Project → Settings → Functions
2. Increase timeout (Pro plan required for > 60s)

### Environment Variables Not Working:
```bash
vercel env ls
```
Verify all variables are set for production environment.

### OAuth Redirect Fails:
- Check `OAUTH_REDIRECT_URI` matches your Vercel URL
- Verify Google Cloud Console redirect URIs include Vercel domain
- Check browser console for errors

### Database Connection Issues:
- Verify `DATABASE_URL` is correct
- Check if database allows connections from Vercel IPs
- Consider using Neon's connection pooling

## 📈 Monitoring

### View Logs:
```bash
vercel logs --follow
```

### Analytics:
Visit: https://vercel.com/dashboard/analytics
- Request count
- Latency metrics
- Error rates
- Traffic by region

## 💰 Vercel Pricing

- **Hobby (Free)**:
  - 100GB bandwidth/month
  - Serverless function invocations included
  - Good for testing

- **Pro ($20/month)**:
  - 1TB bandwidth
  - Longer function timeouts
  - Better for production

---

## ✅ Quick Command Reference

```bash
# Link project
vercel link

# Set environment variable
vercel env add VARIABLE_NAME

# Deploy to production
vercel --prod

# View logs
vercel logs

# List environment variables
vercel env ls

# Add custom domain
vercel domains add domain.com
```

---

**Ready to deploy!** 🚀

Continue with the `vercel link` process in your terminal, then run `vercel --prod` to deploy.

