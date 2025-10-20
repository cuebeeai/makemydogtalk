# Design Guidelines for Make My Dog Talk

## Design Approach
**Reference-Based Approach**: Drawing inspiration from playful pet service websites with a focus on accessibility and fun. The design should feel approachable, cute, and immediately understandable - think Canva's friendly aesthetic meets modern SaaS landing pages.

## Core Design Elements

### Color Palette
**Primary Colors (Light Mode)**:
- Background: 210 100% 97% (soft light blue)
- Primary Blue: 200 90% 60% (vibrant sky blue)
- Accent Blue: 195 85% 45% (deeper blue for CTAs)
- Text Dark: 220 20% 20% (near black with blue tint)
- Text Light: 210 15% 45% (muted blue-gray)

**Supporting Colors**:
- Success Green: 150 70% 50% (for positive states)
- White: 0 0% 100% (cards, highlights)
- Subtle Border: 210 30% 88% (soft dividers)

### Typography
- **Font Family**: Inter or similar modern sans-serif via Google Fonts
- **Hero Title**: text-5xl to text-6xl, font-bold, leading-tight
- **Section Headings**: text-3xl to text-4xl, font-semibold
- **Body Text**: text-base to text-lg, font-normal, leading-relaxed
- **CTA Buttons**: text-lg, font-semibold

### Layout System
**Spacing Units**: Use Tailwind units of 4, 6, 8, 12, 16, 20, 24 (e.g., p-8, py-16, gap-6)
- Section Padding: py-16 to py-24 on desktop, py-12 on mobile
- Container: max-w-7xl mx-auto px-6
- Component Gaps: gap-8 for cards, gap-4 for smaller elements

## Component Library

### Header
- Fixed/sticky navigation with light background
- Logo: "🐾 Make My Dog Talk" with playful typography
- Navigation links: Home, Features, Examples, Pricing, Contact
- Mobile: Hamburger menu with slide-in drawer

### Hero Section (Two-Column Layout)
**Left Column**:
- Bold headline: "Turn Your Dog Into a Star"
- Subtitle in lighter weight explaining the 6-second video generation
- Upload form card with rounded-2xl borders:
  - File upload input with drag-and-drop styling
  - Text prompt textarea with placeholder
  - Large prominent CTA button with gradient or solid blue
- Spacing: gap-6 between elements

**Right Column**:
- Large dog image with circular frame and subtle shadow
- Optional play button overlay: "Watch Sample"
- Use rounded-full for circular treatment

### "Hello" Section
- Single column, centered layout, max-w-3xl
- Friendly title: "hello!" in lowercase, playful font
- Paragraph with generous line-height explaining the app
- Light background card with rounded corners

### "Why Choose Us" Section
- 2x2 or 4-column grid on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Feature cards with:
  - Icon (paw print, sparkles, lock, etc.) in primary blue
  - Bold title
  - Short description
  - Rounded-xl cards with subtle hover lift effect
- Features: Free video, Custom animation, No sign-up, Watermark removal

### Sample Video Section
- Title: "See how it works"
- 3-column grid showcasing example categories
- Video cards with rounded corners, shadow, and labels:
  - "Birthday", "Funny Voice", "Dog Says I Love You"
- Placeholder for embedded videos (looping)

### Pricing Section
- 3-column pricing cards (Free, Pro, Bundle)
- Centered layout with highlighted middle option
- Card details:
  - Plan name in bold
  - Large price display
  - Feature list with checkmarks
  - CTA button (primary for Pro plan)
- Rounded-2xl cards with border on free, solid background on paid

### Feature Highlights / Final CTA
- Full-width section with light blue background
- Icons: paw print, play icon, speech bubble
- Bold CTA: "Start your dog's first video now"
- Social proof element or testimonial snippet
- Large prominent button

### Footer
- Light blue background matching header
- Three columns: Contact info, Quick links, Social icons
- Email address, copyright text
- Rounded social media icon buttons

## Button Styles
- **Primary CTA**: Solid blue (bg-blue-500), rounded-full, px-8 py-4, shadow-lg
- **Secondary**: Outline with border-2, rounded-full, px-6 py-3
- **Hover**: Subtle scale transform (hover:scale-105) and brightness increase
- All buttons use font-semibold text

## Images
**Hero Image**: Large, cute dog photo in circular frame - professional pet photography style, happy/smiling dog, neutral background. Position: Right side of hero section at approximately 500-600px width.

**Sample Section**: Placeholder video thumbnails showing different dog expressions/breeds in the example cards.

## Responsive Behavior
- Desktop (lg): Full two-column hero, 3-4 column grids
- Tablet (md): Hero stacks, 2-column grids
- Mobile (base): Single column, stacked layout throughout
- Navigation collapses to hamburger on mobile
- Maintain generous spacing on all viewports

## Interaction Design
- File upload with drag-and-drop visual feedback
- Form inputs have soft rounded corners (rounded-lg)
- Hover states on all interactive elements
- Console logging for CTAs (no actual API calls in initial build)
- Smooth scrolling between sections