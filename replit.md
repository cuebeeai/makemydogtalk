# Make My Dog Talk

## Overview

Make My Dog Talk is an AI-powered web application that transforms user-uploaded dog photos into 6-second talking videos. Users upload a photo of their dog, provide a text prompt describing what they want their dog to say or do, and the application generates a short animated video. The application offers a freemium model with a free first video (watermarked) and paid options for watermark-free, higher-quality videos.

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

**AI Integration**: Google Generative AI SDK (@google/genai) version 1.25.0, likely used for video generation or content processing.

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

1. User lands on single-page marketing site with hero section
2. User uploads dog photo via file input with drag-and-drop support
3. User enters text prompt describing desired video content
4. Form submission triggers video generation (implementation pending)
5. Free tier: First video with watermark
6. Paid tiers: Individual ($5) or bundle ($20 for 5 videos) for watermark-free HD videos

### Feature Highlights

- No sign-up required for first video
- Mobile-responsive design with hamburger menu
- Smooth scroll navigation between sections
- Sample video gallery showing use cases (birthday, funny voice, "I love you" messages)
- Pricing tiers clearly displayed with feature comparison
- Social proof elements (testimonials)
- Footer with social media links and quick navigation