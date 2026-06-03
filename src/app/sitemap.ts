import { MetadataRoute } from 'next';
import { getPublicSiteUrl } from '@/lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getPublicSiteUrl();
  
  const routes = [
    '',
    '/contact',
    '/api-docs',
    '/auth/login',
    '/auth/register',
    '/privacy',
    '/terms',
    '/acceptable-use',
    '/dpa',
    '/cookies',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.8,
  }));
}

