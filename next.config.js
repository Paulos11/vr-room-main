/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental features - compatible with Next.js 14.0.4
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
    // Removed ppr as it's only available in canary
  },

  // Image optimization - enhanced
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
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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

  // Enhanced headers for better performance and security
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
      // Static assets caching
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Image caching
      {
        source: "/:path*.{jpg,jpeg,png,webp,avif,ico,svg}",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
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
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Enhanced webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      // Better tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;

      // Enhanced bundle splitting
      if (!isServer) {
        config.optimization.splitChunks = {
          ...config.optimization.splitChunks,
          chunks: "all",
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // Vendor chunk optimization
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
              enforce: true,
              priority: 20,
            },
            // React/Next.js specific chunk
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              name: "react",
              chunks: "all",
              enforce: true,
              priority: 30,
            },
            // UI library chunk
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
              name: "ui",
              chunks: "all",
              enforce: true,
              priority: 25,
            },
            // Common shared code
            common: {
              name: "common",
              minChunks: 2,
              chunks: "all",
              enforce: true,
              priority: 10,
            },
          },
        };
      }
    }

    // Module resolution optimizations
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Optimize module resolution
    config.resolve.modules = ["node_modules", "."];

    return config;
  },

  // Performance optimizations
  swcMinify: true,
  reactStrictMode: true,
  trailingSlash: false,
  generateEtags: true,

  // Output configuration
  output: "standalone",

  // Compiler options for better performance
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Logging for better debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Redirects - optimize common patterns
  async redirects() {
    return [];
  },

  // Rewrites for cleaner URLs if needed
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
