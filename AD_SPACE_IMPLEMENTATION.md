# Ad Space Implementation Guide

## Overview
The video generation loading screen now displays a professional "Ad Space For Sale" placeholder that will eventually become a rotating carousel of paid sponsors.

## Current Implementation (Phase 1)

### Location
`client/src/components/Hero.tsx` - Lines 802-896 (loading state)

### Design Features
- **Attractive dashed border** with gradient background
- **Animated badge** with pulsing dot for attention
- **Key statistics display**:
  - 2-5 min view time (average video generation)
  - 10 total slots available
  - 3 premium slots (+30s extended display)
- **Professional CTA button** with email pre-filled inquiry
- **Decorative elements** (animated corner gradients)
- **Responsive design** (mobile to desktop)
- **Dark mode support**

### Contact Flow
Email: makemydogtalk@gmail.com
Subject: "Ad Space Inquiry"
Pre-filled body includes:
- Company Name
- Website
- Preferred Ad Duration (Standard / Premium +30s)

## Business Model

### Pricing Structure (TBD)
- **7 Standard Slots**: Equal price, equal rotation time
- **3 Premium Slots**: Same base price + premium for +30 seconds extra display time
- First come, first served
- All ads require email submission and approval

### Ad Specifications (Future)
- Carousel will rotate during 2-5 minute video generation
- 10 rotating ads total
- 3 ads can pay for +30 second extended display
- All submissions reviewed for:
  - Brand alignment
  - Terms of Service compliance
  - Quality standards

### Approval Process
1. Business emails makemydogtalk@gmail.com
2. Team reviews submission against TOS
3. Approve/deny based on brand fit
4. Invoice sent if approved
5. Ad creative submitted
6. Ad goes live after payment

## Future Enhancements (Phase 2)

### Create Carousel Component
```typescript
// Future: client/src/components/AdCarousel.tsx
interface SponsorAd {
  id: string;
  companyName: string;
  imageUrl: string;
  link: string;
  isPremium: boolean; // +30s display
  displayDuration: number; // seconds
}
```

### Features to Add
- [ ] Auto-rotating carousel with smooth transitions
- [ ] Click tracking for advertisers
- [ ] Impression tracking
- [ ] Admin dashboard for managing ads
- [ ] A/B testing different ad positions
- [ ] Analytics for advertisers (views, clicks, CTR)

### Database Schema (Future)
```sql
CREATE TABLE sponsors (
  id UUID PRIMARY KEY,
  company_name VARCHAR(255),
  image_url TEXT,
  link_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  display_duration INTEGER DEFAULT 10, -- seconds
  status VARCHAR(50), -- 'pending', 'active', 'paused'
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ad_impressions (
  id UUID PRIMARY KEY,
  sponsor_id UUID REFERENCES sponsors(id),
  viewed_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES users(id) NULL
);

CREATE TABLE ad_clicks (
  id UUID PRIMARY KEY,
  sponsor_id UUID REFERENCES sponsors(id),
  clicked_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES users(id) NULL
);
```

## Testing

To see the ad space placeholder:
1. Upload a dog image
2. Enter a prompt
3. Click "Make My Dog Talk"
4. The ad space will display above the progress bar during generation

## Notes
- No pricing is displayed (lead generation only)
- Manual approval process maintains brand quality
- Progress bar remains at bottom as requested
- Dog loading animation removed as requested
- Email client opens with pre-filled inquiry template
