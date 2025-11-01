# Deployment Checklist for MakeMyDogTalk.com

## Pre-Deployment

- [ ] Google Cloud project created with billing enabled
- [ ] gcloud CLI installed and authenticated
- [ ] Docker installed (optional, for local testing)
- [ ] All environment variables ready (see `.env.production.template`)
- [ ] Database set up (if using external PostgreSQL)
- [ ] Domain `makemydogtalk.com` added to Cloudflare

## Code Preparation ✅

- [x] Dockerfile created
- [x] .dockerignore created
- [x] Server configured to listen on PORT 8080
- [x] Server configured to bind to 0.0.0.0 in production
- [x] Build script verified
- [x] cloudbuild.yaml created
- [x] Deploy script created

## Google Cloud Setup

- [ ] Enable required APIs:
  - [ ] Cloud Run API
  - [ ] Cloud Build API
  - [ ] Container Registry API
- [ ] Service account permissions configured

## Deployment

- [ ] Run `./deploy.sh` OR `gcloud run deploy makemydogtalk --source .`
- [ ] Set all environment variables in Cloud Run console
- [ ] Verify service is running at Cloud Run URL
- [ ] Check logs for any errors

## Google OAuth Configuration

- [ ] Update OAuth redirect URI in Google Cloud Console:
  - [ ] Add `https://makemydogtalk.com/auth/callback`
  - [ ] Add `https://www.makemydogtalk.com/auth/callback` (if using www)
- [ ] Test OAuth login flow

## Custom Domain Setup

- [ ] Map custom domain to Cloud Run service:
  ```bash
  gcloud run domain-mappings create \
    --service=makemydogtalk \
    --domain=makemydogtalk.com \
    --region=us-central1
  ```
- [ ] Get DNS records from Cloud Run
- [ ] Configure Cloudflare DNS with records from Cloud Run
- [ ] Set Cloudflare SSL/TLS to "Full (strict)"
- [ ] Enable "Always Use HTTPS" in Cloudflare
- [ ] Enable HSTS in Cloudflare

## Stripe Configuration

- [ ] Update webhook URL in Stripe dashboard:
  - URL: `https://makemydogtalk.com/api/webhook`
- [ ] Copy webhook signing secret
- [ ] Add `STRIPE_WEBHOOK_SECRET` to Cloud Run environment variables
- [ ] Test payment flow on production

## Database

- [ ] Database created and accessible from Cloud Run
- [ ] DATABASE_URL added to environment variables
- [ ] Run database migrations if needed
- [ ] Test database connection

## Testing

- [ ] Visit `https://makemydogtalk.com`
- [ ] Test homepage loads
- [ ] Test Google OAuth login
- [ ] Test email/password signup
- [ ] Test video generation
- [ ] Test payment flow
- [ ] Test file uploads
- [ ] Check all images/assets load
- [ ] Test on mobile devices
- [ ] Test in different browsers

## Monitoring

- [ ] Set up Cloud Logging alerts
- [ ] Set up Cloud Monitoring dashboards
- [ ] Configure uptime checks
- [ ] Set up billing alerts
- [ ] Add error tracking (e.g., Sentry)

## Security

- [ ] All secrets stored as environment variables (not in code)
- [ ] HTTPS enabled everywhere
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Content Security Policy configured
- [ ] Security headers configured in Cloudflare

## Performance

- [ ] Enable Cloudflare caching for static assets
- [ ] Configure CDN settings
- [ ] Set up Cloud Run autoscaling
- [ ] Optimize images
- [ ] Enable compression

## Documentation

- [ ] Update README with production info
- [ ] Document environment variables
- [ ] Create runbook for common issues
- [ ] Share credentials securely with team

## Post-Deployment

- [ ] Announce launch
- [ ] Monitor logs for first 24 hours
- [ ] Check error rates
- [ ] Verify analytics are tracking
- [ ] Test all critical user flows
- [ ] Remove "Under Development" page from old hosting

## Rollback Plan

If something goes wrong:
1. Check Cloud Run logs: `gcloud run services logs read makemydogtalk`
2. Roll back to previous revision in Cloud Run console
3. Or point Cloudflare DNS back to old hosting temporarily
4. Fix issues and redeploy

---

## Quick Commands Reference

```bash
# Deploy
./deploy.sh

# Check logs
gcloud run services logs read makemydogtalk --region=us-central1

# Update environment variables
gcloud run services update makemydogtalk \
  --update-env-vars="KEY=value" \
  --region=us-central1

# Map custom domain
gcloud run domain-mappings create \
  --service=makemydogtalk \
  --domain=makemydogtalk.com \
  --region=us-central1

# View service details
gcloud run services describe makemydogtalk --region=us-central1
```
