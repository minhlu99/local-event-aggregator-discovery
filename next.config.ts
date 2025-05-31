import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
    ],
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
  },
  reactStrictMode: true,
  experimental: {
    // Enable scroll restoration
    scrollRestoration: true,
  },
  // Suppress hydration errors in development
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Vercel specific optimizations
  output: "standalone", // Optimizes for Vercel serverless functions
  poweredByHeader: false, // Removes the X-Powered-By header for security
};

// Suppress hydration errors from browser extensions in development
if (process.env.NODE_ENV === "development") {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Filter out specific hydration errors related to bis_skin_checked
    if (
      typeof args[0] === "string" &&
      args[0]?.includes("Hydration failed because") &&
      args[0]?.includes("bis_skin_checked")
    ) {
      return;
    }
    originalConsoleError(...args);
  };
}

export default nextConfig;
