/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output for Docker builds, static export for other production builds
  ...(process.env.NODE_ENV === 'production' && process.env.DOCKER_BUILD !== 'true' && {
    output: 'export',
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
    distDir: 'out',
    images: {
      domains: ['localhost', 'ui-avatars.com'],
      unoptimized: true, // Required for static export
    },
  }),
  // Standalone output for Docker builds
  ...(process.env.NODE_ENV === 'production' && process.env.DOCKER_BUILD === 'true' && {
    output: 'standalone',
    images: {
      domains: ['localhost', 'ui-avatars.com'],
    },
  }),
  // Development configuration
  ...(process.env.NODE_ENV !== 'production' && {
    images: {
      domains: ['localhost', 'ui-avatars.com'],
    },
  }),
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://auth.one.cynayd.com' : 'http://localhost:4000'),
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'CYNAYD One',
  },
};

module.exports = nextConfig;

