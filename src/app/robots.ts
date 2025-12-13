import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/dashboard/',
          '/admin/',
          '/settings/',
          '/security/',
          '/audit/',
          '/users/',
          '/organizations/',
          '/roles/',
          '/products/',
          '/apps/',
          '/connect/',
          '/app-sso/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

