import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  transpilePackages: ["gsap"],
  experimental: {
    optimizePackageImports: ["gsap"],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // More stable chunk ids during HMR (reduces "Cannot find module './897.js'")
      config.optimization = {
        ...config.optimization,
        moduleIds: "named",
      };
    }
    return config;
  },
};

export default nextConfig;
