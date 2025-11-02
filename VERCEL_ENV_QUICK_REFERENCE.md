# Vercel Environment Variables - Quick Reference

## 🚀 Two Ways to Set Environment Variables

### Option 1: Use the Helper Script (Easier)
```bash
./setup-vercel-env.sh
```
This script will prompt you for each variable with descriptions.

### Option 2: Manual Commands (What you have)
Run each command individually (shown below).

---

## 📋 Environment Variables to Set

When prompted for each value, **copy from your `.env` file** to make it faster!

### 1. Essential Variables

```bash
vercel env add DATABASE_URL production
```
**Value**: Your PostgreSQL connection string from `.env`
Example: `postgresql://user:password@host.com:5432/database`

```bash
vercel env add SESSION_SECRET production
```
**Value**: Any random 32+ character string
Example: `your-super-secret-session-key-123456`

```bash
vercel env add VERTEX_AI_LOCATION production
```
**Value**: `us-central1`
Just type: `us-central1`

---

### 2. OAuth Variables (for Google Sign-In)

```bash
vercel env add GOOGLE_CLIENT_ID production
```
**Value**: From `.env` - ends with `.apps.googleusercontent.com`

```bash
vercel env add GOOGLE_CLIENT_SECRET production
```
**Value**: From `.env` - starts with `GOCSPX-`

```bash
vercel env add OAUTH_REDIRECT_URI production
```
**Value**: For now use: `https://makemydogtalk.vercel.app/auth/callback`
⚠️ **You'll update this after first deploy with your actual URL**

---

### 3. Vertex AI Variables (for Video Generation)

```bash
vercel env add SERVICE_ACCOUNT_JSON production
```
**Value**: Full JSON from `.env` - starts with `{"type":"service_account",...}`
**Tip**: Copy the entire JSON blob

```bash
vercel env add VERTEX_AI_PROJECT_ID production
```
**Value**: Your GCP project ID from `.env`

---

### 4. Stripe Variables (for Payments)

```bash
vercel env add STRIPE_SECRET_KEY production
```
**Value**: From `.env` - starts with `sk_live_` or `sk_test_`

```bash
vercel env add STRIPE_PUBLISHABLE_KEY production
```
**Value**: From `.env` - starts with `pk_live_` or `pk_test_`

```bash
vercel env add STRIPE_PRICE_ID_JUMP_LINE production
```
**Value**: From `.env` - starts with `price_`

```bash
vercel env add STRIPE_PRICE_ID_THREE_PACK production
```
**Value**: From `.env` - starts with `price_`

```bash
vercel env add STRIPE_WEBHOOK_SECRET production
```
**Value**: From `.env` - starts with `whsec_`
⚠️ **You'll need to create a new webhook in Stripe for Vercel URL**

---

### 5. Admin Variable

```bash
vercel env add ADMIN_EMAIL production
```
**Value**: Your admin email (from `.env`)

---

## 💡 Pro Tips

### Tip 1: Copy from .env file
Open your `.env` file and copy values directly:
```bash
cat .env
```

### Tip 2: Check what's already set
```bash
vercel env ls production
```

### Tip 3: Remove a variable if you made a mistake
```bash
vercel env rm VARIABLE_NAME production
```

### Tip 4: Add to all environments at once
If you want the same values in preview/development:
```bash
vercel env add VARIABLE_NAME
# Then select: Production, Preview, Development (use space to select multiple)
```

---

## ⚡ After Setting All Variables

### 1. Deploy to Production
```bash
vercel --prod
```

### 2. You'll get a URL like:
```
✅ Production: https://makemydogtalk-abc123.vercel.app
```

### 3. Update OAuth Redirect URI
```bash
vercel env rm OAUTH_REDIRECT_URI production
vercel env add OAUTH_REDIRECT_URI production
# Enter: https://makemydogtalk-abc123.vercel.app/auth/callback (your actual URL)
```

### 4. Update Google Cloud Console
Go to: https://console.cloud.google.com/apis/credentials
- Find your OAuth 2.0 Client ID
- Add to Authorized redirect URIs:
  - `https://makemydogtalk-abc123.vercel.app/auth/callback`
  - `https://makemydogtalk-abc123.vercel.app/auth/google/callback`

### 5. Update Stripe Webhook
Go to: https://dashboard.stripe.com/webhooks
- Update endpoint to: `https://makemydogtalk-abc123.vercel.app/api/webhook`
- Copy new webhook secret
- Update in Vercel:
  ```bash
  vercel env rm STRIPE_WEBHOOK_SECRET production
  vercel env add STRIPE_WEBHOOK_SECRET production
  ```

### 6. Redeploy
```bash
vercel --prod
```

---

## 🧪 Test Your Deployment

```bash
# Test OAuth redirect
curl -I https://your-vercel-url.vercel.app/auth/google

# Test API health
curl https://your-vercel-url.vercel.app/api/health

# Test in browser
open https://your-vercel-url.vercel.app
```

---

**Ready to go!** 🚀

Start running the commands above, or use `./setup-vercel-env.sh` for guided setup.

