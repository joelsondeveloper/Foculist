import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  // reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ]
  },
};

const pwaConfig = {
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  customWorkerDir: 'public',
  buildExcludes: [
     /middleware\.js$/,
     /middleware-manifest\.json$/,
     /middleware-runtime\.js$/,
     /_middleware\.js$/,
  ],
};

export default withPWA(pwaConfig)(nextConfig);
