import type { CapacitorConfig } from '@capacitor/cli';

/**
 * تنظیمات Capacitor پروژه «آپدیت‌یار»
 *
 * ✅ اپ کاملاً آفلاین است: کل رابط کاربری داخل خود APK ذخیره می‌شود
 *    (پوشه out/ پس از `bun run build` ساخته و با `npx cap sync android`
 *    داخل پروژه اندروید کپی می‌شود) و داده‌ها در حافظه‌ی خود گوشی ذخیره می‌شوند.
 */
const config: CapacitorConfig = {
  appId: 'com.updatayar.app',
  appName: 'آپدیت‌یار',
  webDir: 'out',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
