import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // کاهش شدید حجم باندل سرور و جلوگیری از بسته‌بندی WASM پی‌جی‌لایت
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
    optimizePackageImports: ["lucide-react", "motion"],
  },
};

export default nextConfig;
