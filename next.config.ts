import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for better performance
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['@heroicons/react', 'lucide-react'],
    // Enable server actions
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },

  // Reduce logging output
  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  // Disable detailed compilation logs
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },

  // Disable telemetry and reduce build output
  ...(process.env.NODE_ENV === 'development' && {
    // Reduce development logging
    typescript: {
      ignoreBuildErrors: false,
    },
    eslint: {
      ignoreDuringBuilds: false,
    },
  }),

  // Enable Turbopack for faster development (now stable)
  // turbopack: {
  //   rules: {
  //     '*.svg': {
  //       loaders: ['@svgr/webpack'],
  //       as: '*.js',
  //     },
  //   },
  // },

  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Compiler optimizations
  compiler: {
    // Remove console.logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Headers for better caching and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=120',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=30, stale-while-revalidate=60',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }

    return config;
  },

  // Optimize for production
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
    poweredByHeader: false,
  }),
};

export default nextConfig;
