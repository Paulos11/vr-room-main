// next.config.js - Fixed and optimized configuration
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove deprecated experimental features
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
    // Remove optimizeCss and optimizeServerReact as they're deprecated
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "localhost",
        port: "3000",
      },
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Environment variables
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },

  // Compression and security
  compress: true,
  poweredByHeader: false,

  // Headers for security and performance
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting for production
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            enforce: true,
          },
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            enforce: true,
          },
        },
      };
    }

    // Optimize module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },

  // Performance optimizations
  swcMinify: true,
  reactStrictMode: true,
  trailingSlash: false,
  generateEtags: true,

  // Output configuration for better performance
  output: "standalone",

  // Redirect configuration
  async redirects() {
    return [];
  },

  // Rewrite configuration
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
