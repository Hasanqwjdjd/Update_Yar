import type { NextConfig } from "next";

// خروجی استاتیک: کل اپ در پوشه out/ ساخته می‌شود و داخل APK قرار می‌گیرد
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
