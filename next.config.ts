import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.vercel-storage.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
      allowedOrigins: [
        "*.run.app",
        "*.asia-southeast1.run.app",
        "ais-dev-4s5fmrhihpk5d5onpmdmlp-190401891669.asia-southeast1.run.app",
        "ais-pre-4s5fmrhihpk5d5onpmdmlp-190401891669.asia-southeast1.run.app",
        "*.vercel.app",
        "saltrepublic.mv",
      ],
    },
  },
  allowedDevOrigins: [
    "*.run.app",
    "*.asia-southeast1.run.app",
    "ais-dev-4s5fmrhihpk5d5onpmdmlp-190401891669.asia-southeast1.run.app",
    "ais-pre-4s5fmrhihpk5d5onpmdmlp-190401891669.asia-southeast1.run.app",
    "*.vercel.app",
  ],
  async redirects() {
    return [
      // Sign-in removed: /login now leads straight to the dashboard.
      { source: "/login", destination: "/dashboard", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        // Keep the open dashboard out of search engines.
        source: "/dashboard/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
