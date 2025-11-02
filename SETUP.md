# Make My Dog Talk - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables

#### For Local Development
```bash
cp .env.local.example .env.local
# Edit .env.local with your local development credentials
```

**IMPORTANT:** Never use production credentials locally!
- Create a separate development database
- Use Stripe test mode keys
- Create separate OAuth credentials for localhost

#### Pull from Vercel (for production debugging only)
```bash
vercel env pull .env --environment=production
```
⚠️ Use with extreme caution - this uses production database!

### 3. Setup Database
```bash
npm run db:push
```

### 4. Run Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## Environment Variables

### Required for Local Development
- `DATABASE_URL` - PostgreSQL connection string (use dev database!)
- `VERTEX_AI_PROJECT_ID` - Google Cloud project ID
- `VERTEX_AI_LOCATION` - GCP region (us-central1)
- `SERVICE_ACCOUNT_JSON` - GCP service account JSON
- `GCS_BUCKET_NAME` - Cloud Storage bucket name

### Optional
- OAuth credentials (Google login)
- Stripe credentials (payments)
- Admin email

## Deployment

### Vercel (Production)
```bash
vercel --prod
```

Environment variables are managed in Vercel dashboard.

### Build Locally
```bash
npm run build
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production build locally
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run check` - Run TypeScript type checking

## Architecture

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Express.js
- **Database:** PostgreSQL (Neon)
- **AI:** Google Vertex AI (Veo video generation)
- **Storage:** Google Cloud Storage
- **Payments:** Stripe
- **Deployment:** Vercel

## Common Issues

### "DATABASE_URL is not set"
Make sure you've created a `.env.local` file with your database URL.

### Video generation fails
- Check your `SERVICE_ACCOUNT_JSON` is properly formatted
- Verify your GCP project has Vertex AI API enabled
- Ensure your service account has proper permissions

### OAuth redirect errors
- Update `OAUTH_REDIRECT_URI` to match your environment
- For local dev: `http://localhost:5000/auth/callback`
- For production: update in Vercel environment variables

## Getting Help

For issues, check:
1. Vercel deployment logs
2. Browser console for client errors
3. Terminal output for server errors

## Security Notes

- Never commit `.env` or `.env.local` files
- Always use test mode Stripe keys in development
- Use separate databases for dev/prod
- Rotate secrets regularly
