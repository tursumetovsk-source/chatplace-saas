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
