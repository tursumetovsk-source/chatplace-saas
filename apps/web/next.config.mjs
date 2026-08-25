/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@chatplace/shared',
    '@chatplace/automation-engine',
    '@chatplace/channel-sdk',
    '@chatplace/ai-sdk',
    '@chatplace/database',
    '@chatplace/ui'
  ],
  // Prisma is generated in the workspace root by pnpm. Next's file tracer does
  // not discover the native query engine through the transpiled database
  // package automatically, so include it in every server function bundle.
  outputFileTracingIncludes: {
    '/*': ['../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*']
  },
  reactStrictMode: true,
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }
      ]
    }];
  }
};

export default nextConfig;
