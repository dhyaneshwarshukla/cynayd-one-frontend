import { MetadataRoute } from 'next';
import { getPublicSiteUrl } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicSiteUrl();
  
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

