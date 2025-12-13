# SEO Implementation Guide

This document outlines the SEO implementation for CYNAYD One.

## Implemented Features

### 1. Metadata (layout.tsx)
- ✅ Comprehensive title and description
- ✅ Open Graph tags for social media sharing
- ✅ Twitter Card metadata
- ✅ Keywords meta tags
- ✅ Canonical URLs
- ✅ Robots meta tags
- ✅ Author, creator, and publisher information
- ✅ Language and locale settings

### 2. Structured Data (JSON-LD)
- ✅ SoftwareApplication schema on homepage
- ✅ Organization schema
- ✅ WebSite schema with search action
- ✅ Automatically injected via React useEffect

### 3. Robots.txt
- ✅ Static robots.txt in `/public/robots.txt`
- ✅ Dynamic robots.ts for Next.js App Router
- ✅ Properly configured to allow public pages and disallow private routes

### 4. Sitemap
- ✅ Dynamic sitemap.ts for automatic sitemap generation
- ✅ Includes all public routes
- ✅ Proper priority and change frequency settings

### 5. Manifest.json
- ✅ PWA manifest for better mobile experience
- ✅ Theme colors and icons configured

## Environment Variables

Add to your `.env.local`:
```env
NEXT_PUBLIC_SITE_URL=https://one.cynayd.com
```

## Required Assets

You'll need to add these files to `/public`:
- `og-image.jpg` (1200x630px) - Open Graph image for social sharing
- `logo.png` - Company logo for structured data
- `favicon.ico` - Favicon (already referenced)

## Search Engine Verification

To verify your site with search engines, add verification codes to `frontend/src/app/layout.tsx`:

```typescript
verification: {
  google: "your-google-verification-code",
  yandex: "your-yandex-verification-code",
  bing: "your-bing-verification-code",
},
```

## Social Media Links

Update the Organization schema in `frontend/src/app/page.tsx` with your social media links:

```typescript
"sameAs": [
  "https://twitter.com/cynayd",
  "https://linkedin.com/company/cynayd",
  "https://facebook.com/cynayd",
],
```

## Testing SEO

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
3. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
4. **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/

## Next Steps

1. Generate and add the OG image (1200x630px)
2. Add company logo
3. Update social media links
4. Add search engine verification codes
5. Submit sitemap to Google Search Console
6. Monitor SEO performance in Google Analytics

## Page-Specific SEO

For pages that need custom metadata, create a `metadata` export or use `generateMetadata`:

```typescript
export const metadata: Metadata = {
  title: "Custom Page Title",
  description: "Custom page description",
  openGraph: {
    title: "Custom OG Title",
    description: "Custom OG Description",
  },
};
```

