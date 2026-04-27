import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'vinthem.com' },
      { protocol: 'https', hostname: 'www.vinthem.com' },
      { protocol: 'https', hostname: 'cdn.vinthem.com' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: 'picsum.photos' }
    ],
    // Let Next.js optimize images for performance unless specifically told otherwise
    unoptimized: false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'motion/react', 'sonner'],
    serverActions: {
      bodySizeLimit: '10mb'
    }
  }
};

export default nextConfig;
