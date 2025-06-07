import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimized webpack configuration for Vercel
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  
  // Vercel-optimized image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
    // Disable unoptimized for better Vercel performance
    unoptimized: false
  },

  // Enable strict mode for better production builds
  reactStrictMode: true,

  // Optimize for production deployment
  poweredByHeader: false,
  compress: true,

  // Remove build error ignoring for production readiness
  // Note: You'll need to fix TypeScript errors for production deployment
  experimental: {
    // Enable optimizations for faster builds
    optimizeCss: true,
  }
};

export default nextConfig;
