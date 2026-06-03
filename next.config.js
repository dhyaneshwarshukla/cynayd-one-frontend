/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ui-avatars.com', pathname: '/api/**' },
      ...(process.env.NODE_ENV === 'development'
        ? [{ protocol: 'http', hostname: 'localhost', pathname: '/**' }]
        : []),
    ],
  },

  env: {
    NEXT_PUBLIC_APP_NAME:
      process.env.NEXT_PUBLIC_APP_NAME || 'CYNAYD One',
  },
};

module.exports = nextConfig;
