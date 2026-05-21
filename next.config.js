/** @type {import('next').NextConfig} */
const isDockerBuild = process.env.DOCKER_BUILD === 'true';

const nextConfig = {
  output: isDockerBuild ? 'standalone' : 'export',

  trailingSlash: !isDockerBuild,
  skipTrailingSlashRedirect: !isDockerBuild,

  ...(isDockerBuild
    ? {}
    : {
        distDir: 'out',
      }),

  images: {
    domains: ['localhost', 'ui-avatars.com'],
    unoptimized: !isDockerBuild,
  },

  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://auth.one.cynayd.com'
        : 'http://localhost:4000'),

    NEXT_PUBLIC_APP_NAME:
      process.env.NEXT_PUBLIC_APP_NAME || 'CYNAYD One',
  },
};

module.exports = nextConfig;
