# Make My Dog Talk

## Overview

Make My Dog Talk is an AI-powered web application that transforms user-uploaded dog photos into talking videos using Google's Veo 3.1 video generation model. Users upload a photo of their dog, provide a text prompt describing what they want their dog to say or do, and the application generates an animated video. The application features an interactive landing page with a demo video and a streamlined video generation flow with paywall integration after the first video.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**UI Component System**: The application uses shadcn/ui, a collection of re-usable components built on Radix UI primitives. This provides accessible, customizable components following the "New York" style variant with TailwindCSS for styling.

**Routing**: Uses Wouter for lightweight client-side routing. The application is primarily a single-page landing page with potential for future expansion.

**State Management**: React Query (@tanstack/react-query) handles server state management and data fetching. Local component state is managed with React hooks.

**Styling Approach**: TailwindCSS with a custom design system defined in the configuration. The design follows a playful, pet-friendly aesthetic with a light blue color palette (hsl-based colors) and rounded elements. The design guidelines emphasize accessibility and a fun, approachable feel inspired by pet service websites.

**Design System**:
- Primary color: Vibrant sky blue (200 90% 60%)
- Typography: Inter or similar modern sans-serif
- Spacing: Consistent Tailwind units (4, 6, 8, 12, 16, 20, 24)
- Component style: Rounded corners, soft borders, clean layouts

### Backend Architecture

**Server Framework**: Express.js running on Node.js with TypeScript support.

**Development Setup**: Custom Vite middleware integration for development with HMR (Hot Module Replacement). In production, serves static files from the built client.

**API Structure**: RESTful API design with routes prefixed with `/api`. Currently minimal with placeholder storage implementation ready for expansion.

**Storage Layer**: Abstracted through an `IStorage` interface, currently implemented as in-memory storage (`MemStorage`) for development. Designed to be easily swapped for persistent database storage (PostgreSQL expected based on Drizzle configuration).

**Request Handling**: Express middleware for JSON parsing, URL-encoded data, and request/response logging with duration tracking for API endpoints.

### Data Storage

**ORM**: Drizzle ORM configured for PostgreSQL dialect.

**Database Provider**: Configured for Neon Database (@neondatabase/serverless) based on connection string approach.

**Schema Design**: Currently includes a basic `users` table with:
- UUID primary key (auto-generated)
- Username (unique, required)
- Password (required)
- Schema validation using drizzle-zod for type-safe operations

**Migration Strategy**: Drizzle Kit for schema migrations with output directory at `./migrations`.

### External Dependencies

**AI Integration**:
- Google Generative AI SDK (@google/genai) version 1.25.0
- Uses Veo 3.1 model for video generation from static images
- Requires `GEMINI_API_KEY` environment variable
- Paid tier access required (Tier 1: 10 requests/day, costs $0.40/sec for standard quality)
- Environment variables loaded via dotenv package

**UI Component Library**: 
- Radix UI primitives for accessible, unstyled components
- shadcn/ui configuration for styled component variants
- Lucide React for icons
- React Icons for social media icons

**Form Handling**: React Hook Form with Zod resolvers for validation.

**Development Tools**:
- TypeScript for type safety across client and server
- ESBuild for server bundling in production
- Vite plugins for development experience (error overlay, Replit-specific tools)

**Session Management**: connect-pg-simple for PostgreSQL-backed session storage (configured but not yet implemented).

**Utility Libraries**:
- date-fns for date manipulation
- clsx and tailwind-merge (via cn utility) for conditional className handling
- class-variance-authority for component variant styling

### Application Flow

1. User lands on single-page marketing site with interactive hero section featuring demo video
2. Hero section displays clickable demo video with play button overlay
3. User uploads dog photo via file input (handled by multer middleware)
4. User enters text prompt describing desired video content
5. Form submission triggers asynchronous video generation via `/api/generate-video` endpoint
6. Server creates video operation record with "processing" status
7. Client polls `/api/video-status/:id` endpoint to check generation progress
8. Once complete, video is displayed with proper video player controls
9. After first video generation, paywall UI appears prompting for upgrade
10. Generated videos are stored in `/uploads/videos/` directory and served statically

### Feature Highlights

- No sign-up required for first video
- Interactive hero section with clickable demo video and play button overlay
- Mobile-responsive design with hamburger menu
- Smooth scroll navigation between sections
- Real-time video generation status tracking via polling
- Automatic paywall display after first video generation
- Proper video playback controls with error handling
- File upload support with 10MB size limit via multer
- Static video serving with proper CORS and content-type headers
- Sample video gallery showing use cases (birthday, funny voice, "I love you" messages)
- Pricing tiers clearly displayed with feature comparison
- Social proof elements (testimonials)
- Footer with social media links and quick navigation

### API Endpoints

**POST `/api/generate-video`**
- Accepts multipart form data with `image` file and `prompt` text
- Uploads image to temporary directory
- Initiates Veo 3.1 video generation
- Creates video operation record in storage
- Returns operation ID and "processing" status
- Cleans up temporary uploaded file after processing

**GET `/api/video-status/:id`**
- Checks status of video generation operation
- Polls Google's Gemini API for operation completion
- Updates storage with completed video URL or error
- Downloads generated video to `/uploads/videos/` directory
- Returns current status: "pending", "processing", "completed", or "failed"

### Video Generation Implementation

**Technology**: Google Veo 3.1 video generation model via Gemini API

**Process**:
1. Image uploaded and converted to base64
2. MIME type detection (PNG or JPEG)
3. API call to `veo-3.1-generate-preview` model with prompt and image
4. Long-running operation created by API
5. Status polling via REST endpoint
6. Video download using SDK's file download method
7. Local storage in `/uploads/videos/` with timestamped filename

**Error Handling**:
- API quota exhaustion detection (429 errors)
- Missing video in response handling
- Network error recovery
- User-friendly error messages
- Server-side logging for debugging

### Environment Configuration

**Required Environment Variables**:
- `GEMINI_API_KEY`: Google Gemini API key from https://aistudio.google.com/app/apikey
- `PORT`: Server port (defaults to 3000)
- `NODE_ENV`: "development" or "production"

**Configuration Files**:
- `.env`: Environment variables (gitignored for security)
- `.env` must contain valid Gemini API key with paid tier access
- Server loads environment variables via `dotenv/config` import

### Storage Implementation

**Current**: In-memory storage via `MemStorage` class
- Stores users in Map data structure
- Stores video operations with metadata
- Includes operation ID, status, prompt, image path, video URL, errors, and timestamps

**Schema** (defined in `@shared/schema`):
- `User`: id, username, password
- `VideoOperation`: id, operationId, status, prompt, imagePath, videoUrl, error, createdAt

**Interface**: `IStorage` abstraction allows easy swap to persistent database

### Known Issues and Limitations

1. **API Quota Limits**:
   - Tier 1 paid tier: 10 requests per day
   - Rate limit: 2 requests per minute
   - Requires quota increase for production use
   - Daily quota resets at midnight

2. **Pricing**:
   - $0.40 per second (standard quality)
   - $0.15 per second (fast quality)
   - 5-10 second videos cost $2-4 each

3. **Storage**:
   - Currently using in-memory storage (data lost on restart)
   - Ready for PostgreSQL migration via Drizzle ORM

4. **File Management**:
   - Generated videos stored locally in `/uploads/videos/`
   - No automatic cleanup of old videos
   - Temporary uploads cleaned after processing

### Recent Updates

- ✅ Integrated Google Veo 3.1 for video generation
- ✅ Added environment variable configuration with dotenv
- ✅ Implemented video operation tracking and status polling
- ✅ Added paywall UI after first video generation
- ✅ Improved video playback controls and error handling
- ✅ Added interactive demo video with play button overlay
- ✅ Enhanced hero section with clickable video player
- ✅ Configured proper static file serving for videos with CORS support