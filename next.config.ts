import type { NextConfig } from "next";

// خروجی استاتیک: کل اپ در پوشه out/ ساخته می‌شود و داخل APK قرار می‌گیرد
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // ⚠️ قبلاً true بود و خطاهای TypeScript (مثل import گمشده‌ی عامل کرش) موقع بیلد
  // گرفته نمی‌شدند. از این به بعد هر خطای تایپ = بیلد ناموفق، تا چنین کرش‌هایی
  // هرگز به APK نرسند.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  // امن‌سازی خروجی: در نسخه‌ی نهایی console.log/info/debug حذف می‌شود
  // (خطاها و هشدارها برای دیباگ باقی می‌مانند)
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
};

export default nextConfig;
