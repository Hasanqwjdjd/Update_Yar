import type { CapacitorConfig } from '@capacitor/cli';

/**
 * تنظیمات Capacitor پروژه «آپدیت‌یار»
 *
 * ⚠️ اگر آدرس سایت اپ عوض شد، فقط مقدار server.url را تغییر دهید
 *    و بعد دستورات زیر را اجرا کنید:
 *      npx cap sync android
 *      سپس در Android Studio دوباره APK بگیرید.
 */
const config: CapacitorConfig = {
  appId: 'com.updatayar.app',
  appName: 'آپدیت‌یار',
  webDir: 'public',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  server: {
    // آدرس سرور آنلاین اپ (WebView این آدرس را باز می‌کند)
    url: 'https://p1cnf8f921h0-d.space-z.ai/',
    cleartext: false,
    androidScheme: 'https',
  },
};

export default config;
