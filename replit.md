# Make My Dog Talk

## Overview

Make My Dog Talk is a full-stack web application that transforms photos of dogs into AI-generated talking videos. Users upload a dog photo, provide a text prompt describing what the dog should say or do, and receive a 6-second AI-generated video with synchronized lip movements and custom voice styles.

The application operates on a credit-based system with free initial videos, paid credit packs via Stripe, and promotional codes. It features both email/password and Google OAuth authentication, with user dashboards for managing credits and video history.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query for server state management and caching

**UI/Styling:**
- Tailwind CSS for utility-first styling with custom theme configuration
- shadcn/ui component library (Radix UI primitives) for accessible, customizable components
- Custom CSS variables for consistent theming across light/dark modes
- Responsive design with mobile-first approach

**Key Frontend Features:**
- File upload with validation (image types, file size limits)
- Real-time video generation status polling
- Embedded Stripe Checkout for payment processing
- Protected routes requiring authentication
- Toast notifications for user feedback
- Modal dialogs for authentication, checkout, and promo codes

**State Management:**
- React Context API for global auth state (`AuthContext`)
- TanStack Query for server data caching and synchronization
- Local component state for UI interactions

### Backend Architecture

**Runtime & Framework:**
- Node.js with Express.js server
- TypeScript for type safety across the entire stack
- Dual entry points: `server/index.ts` (local dev) and `server/vercel.ts` (serverless deployment)

**API Structure:**
- RESTful endpoints under `/api/*` prefix
- Authentication routes under `/auth/*`
- File upload handling via multer middleware
- Cookie-based session management with httpOnly flags
- Rate limiting middleware for video generation endpoints

**Authentication System:**
- Dual authentication strategy:
  - Email/Password with bcrypt password hashing (8+ character minimum)
  - Google OAuth 2.0 for social login
- Unified session token management supporting both methods
- Session tokens stored in httpOnly cookies for security
- Middleware for protected routes (`requireAuth`) and optional auth (`optionalAuth`)

**Video Generation Pipeline:**
1. Image upload and validation (10MB max, JPEG/PNG only)
2. Prompt validation (5-500 characters)
3. Google Cloud Vertex AI (Veo Model) integration for video generation
4. Asynchronous polling-based status checking
5. Optional FFmpeg watermarking for free-tier videos
6. Upload to Google Cloud Storage for persistent hosting
7. Database record creation with operation tracking

**Rate Limiting & Credits:**
- In-memory rate limiting (10 videos/hour, 30-second cooldown between requests)
- Credit-based system tracked in database
- IP-based tracking for non-authenticated users
- User-based tracking for authenticated users
- Admin bypass mode for testing (email-based identification)

**Payment Processing:**
- Stripe integration for credit purchases
- Two product tiers: "Jump The Line" (1 credit) and "3 Video Pack" (3 credits)
- Embedded Stripe Checkout with session management
- Webhook handling for payment confirmation (via `/api/webhook`)
- Stripe Customer ID stored in user records for recurring purchases

**Promotional System:**
- Promo code manager with configurable codes
- Track redemptions per user to prevent duplicate claims
- Default codes: FACEBOOK, LINKEDIN, INSTAGRAM (5 credits each)
- One-time redemption enforcement per user

### Data Storage Solutions

**Database:**
- PostgreSQL via Neon serverless driver
- Drizzle ORM for type-safe database queries
- Two primary tables:
  - `users`: Authentication, profile, credits, Stripe customer ID
  - `videoOperations`: Video generation history, status tracking, URLs

**Database Schema Design:**
- UUID primary keys with `gen_random_uuid()` default
- Nullable password field to support OAuth users
- Separate `googleId` field for OAuth user identification
- Integer credit balance with default of 0
- Timestamp tracking for account creation and last login
- Video operation status enum: pending, processing, completed, failed

**File Storage:**
- Temporary uploads to `/tmp/uploads` (Vercel serverless compatible)
- Persistent video storage in Google Cloud Storage bucket
- Public URLs generated for completed videos
- Local disk storage for development environment

**Migration Strategy:**
- Drizzle Kit for schema migrations
- Migration files in `/migrations` directory
- Version-controlled schema changes via JSON snapshots

### External Dependencies

**Google Cloud Platform:**
- **Vertex AI API:** Veo model for video generation with image-to-video capabilities
- **Cloud Storage:** Persistent video file hosting with public URL access
- **Service Account Authentication:** JSON credentials for server-to-GCP communication
- **Project Configuration:** Project ID and region (us-central1) required

**Stripe Payment Platform:**
- **Embedded Checkout:** Client-side integration via `@stripe/stripe-js` and `@stripe/react-stripe-js`
- **API Integration:** Server-side SDK for session creation and customer management
- **Webhook Events:** Payment confirmation via `checkout.session.completed` events
- **Test Mode Support:** Separate test/production API keys and price IDs

**Google OAuth 2.0:**
- **OAuth2Client:** User authentication flow via Google accounts
- **Scopes:** Profile and email access only
- **Redirect URI Configuration:** Environment-specific callback URLs
- **Credential Management:** Client ID, client secret, and redirect URI

**Third-Party Services:**
- **FFmpeg:** Optional watermark application for free-tier videos (requires system installation)
- **Neon Database:** Serverless PostgreSQL hosting
- **Vercel:** Serverless function deployment platform

**Environment Variables Required:**
- `DATABASE_URL`: PostgreSQL connection string
- `VERTEX_AI_PROJECT_ID`: GCP project identifier
- `VERTEX_AI_LOCATION`: GCP region for Vertex AI
- `SERVICE_ACCOUNT_JSON`: GCP service account credentials (JSON string)
- `GCS_BUCKET_NAME`: Cloud Storage bucket name
- `GOOGLE_CLIENT_ID`: OAuth client ID
- `GOOGLE_CLIENT_SECRET`: OAuth client secret
- `OAUTH_REDIRECT_URI`: OAuth callback URL
- `STRIPE_SECRET_KEY`: Stripe API secret key
- `STRIPE_PUBLISHABLE_KEY`: Stripe public key (client-side)
- `VITE_ADMIN_EMAIL`: Admin user email for bypass mode

**Development Dependencies:**
- Vite plugins: Cartographer, dev banner, runtime error modal (Replit-specific)
- TypeScript compiler and type definitions
- Drizzle Kit for database tooling
- ESBuild for server-side bundling