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
        hostname: 'vinthem.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.vinthem.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.vinthem.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-f44233c26dba4e9795b3ccf51fe6f2cb.r2.dev',
        port: '',
        pathname: '/**',
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

