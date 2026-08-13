/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@chatplace/shared',
    '@chatplace/automation-engine',
    '@chatplace/channel-sdk',
    '@chatplace/ai-sdk',
    '@chatplace/ui'
  ],
  reactStrictMode: true
};

export default nextConfig;
