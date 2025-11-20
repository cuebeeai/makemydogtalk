# Production Deployment Checklist

This document outlines how to ensure MakeMyDogTalk.com stays online and reliable in production.

## Pre-Deployment Checklist

### 1. Environment Variables
Ensure all required environment variables are set in Vercel:

- ✅ `DATABASE_URL` - Neon/PostgreSQL connection string
- ✅ `GOOGLE_CLIENT_ID` - Google OAuth client ID
- ✅ `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- ✅ `SERVICE_ACCOUNT_JSON` - Google Cloud service account (base64 encoded)
- ✅ `VERTEX_AI_PROJECT_ID` - Google Cloud project ID
- ✅ `STRIPE_SECRET_KEY` - Stripe secret key
- ✅ `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- ✅ `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- ✅ `GCS_BUCKET_NAME` - Google Cloud Storage bucket name
- ✅ `NODE_ENV=production`

### 2. Stripe Webhook Configuration

**CRITICAL:** Stripe webhooks only work with a public URL (not localhost).

1. Deploy your app to Vercel first to get your production URL
2. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
3. Add endpoint: `https://your-domain.vercel.app/api/stripe-webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
5. Copy the webhook signing secret to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

**Why this matters:** Without webhooks, transactions won't be recorded in your database, causing the financial analytics to be inaccurate.

### 3. Database Migrations

Run database migrations before deploying:
```bash
npm run db:push
```

## Reliability Features (Automatic in Production)

When deployed to Vercel, you automatically get:

### ✅ Auto-Restart on Crashes
- If your Node.js process crashes, Vercel restarts it automatically
- No manual intervention needed

### ✅ Zero Downtime Deployments
- New versions deploy without taking the site down
- Old version continues serving traffic until new version is ready

### ✅ Edge Caching
- Static assets cached globally for fast load times
- Reduces server load

### ✅ HTTPS by Default
- Free SSL certificate
- All traffic encrypted

### ✅ Global CDN
- Your site served from servers close to your users
- Faster page loads worldwide

## Additional Monitoring (Recommended)

### 1. Uptime Monitoring
Set up external monitoring to alert you if the site goes down:

**Free Option: UptimeRobot**
1. Go to [UptimeRobot.com](https://uptimerobot.com)
2. Add monitor for `https://your-domain.vercel.app`
3. Set alert email to your admin email
4. Monitor every 5 minutes

**What it does:** Sends you an email/SMS if your site is down for more than 5 minutes.

### 2. Error Tracking (Optional but Recommended)
Use Sentry to track JavaScript errors and server crashes:

**Setup Sentry:**
```bash
npm install @sentry/node @sentry/react
```

Then add to server/index.ts:
```typescript
import * as Sentry from "@sentry/node";

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: 'production',
  });
}
```

### 3. Database Backups
Your Neon database should have automatic backups enabled. Verify in Neon dashboard:
- Daily backups: ✅ Enabled
- Retention period: 7 days minimum

## Health Check Endpoint

Your app already has a health check at `/health`. Use this to monitor:
- Server status
- Database connectivity
- Authentication system
- Vertex AI configuration

Test it: `curl https://your-domain.vercel.app/health`

## What to Do When Something Goes Wrong

### Server is Down
1. Check [Vercel Dashboard](https://vercel.com/dashboard) for deployment status
2. Check deployment logs for errors
3. Verify environment variables are set correctly
4. Check Neon database status

### Transactions Not Recording
1. Verify Stripe webhook is configured with correct URL
2. Check Vercel logs for webhook errors
3. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
4. Test webhook delivery in Stripe dashboard

### Database Connection Errors
1. Check Neon database status
2. Verify `DATABASE_URL` environment variable
3. Check if database has hit connection limits
4. Verify database user has correct permissions

## Performance Optimization

### 1. Database Connection Pooling
Already configured in your app via Drizzle ORM with Neon.

### 2. Rate Limiting
Already implemented for video generation endpoints.

### 3. Caching
Consider adding Redis for session caching in high-traffic scenarios.

## Deployment Commands

```bash
# Deploy to production
git push  # If using Vercel GitHub integration

# Or deploy manually
vercel --prod

# Check deployment status
vercel ls

# View production logs
vercel logs
```

## Cost Monitoring

Monitor your costs for:
- Vercel hosting (likely free for your traffic level)
- Neon database (free tier: 0.5 GB storage)
- Google Cloud Vertex AI (pay per video generation)
- Google Cloud Storage (pay per GB stored)
- Stripe fees (2.9% + $0.30 per transaction)

Set up billing alerts in Google Cloud Console to avoid surprises.

## Security Checklist

- ✅ All secrets stored in environment variables (not in code)
- ✅ HTTPS enabled (automatic on Vercel)
- ✅ Rate limiting enabled for API endpoints
- ✅ Input validation on all user inputs
- ✅ SQL injection prevention via Drizzle ORM
- ✅ XSS prevention via React's built-in escaping
- ✅ Cookie security flags set correctly

## Testing Before Going Live

1. Test OAuth login flow with production Google credentials
2. Make a test purchase with Stripe test mode
3. Verify webhook receives the event and creates transaction
4. Generate a test video to confirm Vertex AI works
5. Check analytics dashboard shows correct data
6. Test on mobile devices
7. Run Lighthouse audit for performance

## Go-Live Steps

1. Switch Stripe from test mode to live mode
2. Update Stripe webhook endpoint
3. Point domain to Vercel
4. Set up uptime monitoring
5. Send test transaction to verify everything works
6. Monitor logs for first 24 hours

## Ongoing Maintenance

- Weekly: Check error logs
- Weekly: Review analytics for anomalies
- Monthly: Review database size and costs
- Monthly: Update dependencies for security patches
- Quarterly: Review and optimize database queries
