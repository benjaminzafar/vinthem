import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
    ],
    qualities: [60, 75],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'motion/react', 'sonner'],
    serverActions: {
      bodySizeLimit: '10mb'
    }
  }
};

export default nextConfig;

// Trigger rebuild 1776111100

