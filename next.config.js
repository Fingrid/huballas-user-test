/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: {
    unoptimized: true
  },
  // Disable server-side features for static export
  experimental: {
    // Remove any experimental features that require server
  }
}

module.exports = nextConfig
