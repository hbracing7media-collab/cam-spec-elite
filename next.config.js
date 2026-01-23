/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow larger body sizes for video uploads in server actions
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  // Image optimization settings
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

module.exports = nextConfig;
