'use client'

/**
 * پل ارتباط با پلاگین نیتیو اندروید (InstalledAppsPlugin.java)
 *
 * روی گوشی: قابلیت‌های واقعی — خواندن برنامه‌های نصب‌شده، اجرای اپ، باز کردن فروشگاه/لینک، تنظیمات
 * در مرورگر (پیش‌نمایش وب): پلاگین موجود نیست و caller باید fallback نمایشی استفاده کند
 */

import { Capacitor, registerPlugin } from '@capacitor/core'

export interface NativeAppInfo {
  packageName: string
  appName: string
  versionName: string
  versionCode: number
  isSystem: boolean
  installTime: number
  sizeMB: number
  iconBase64?: string
}

export interface InstalledAppsPluginInterface {
  listInstalledApps(): Promise<{ apps: NativeAppInfo[]; partial?: boolean }>
  openApp(options: { packageName: string }): Promise<void>
  openInStore(options: { packageName: string; store: string; url?: string }): Promise<void>
  /** باز کردن هر لینکی در مرورگر/اپ مناسب سیستم (mailto، https، ...) */
  openUrl(options: { url: string }): Promise<void>
  /** باز کردن صفحه‌ی تنظیمات خود اپ (برای دادن دسترسی‌های خاص مثل MIUI) */
  openAppSettings(): Promise<void>
  /** رویداد باز شدن اپ با deep-link (مثل بازگشت از درگاه پرداخت) */
  addListener(eventName: 'appUrlOpen', listenerFunc: (data: { url: string }) => void): Promise<string>
  removeListener(eventName: 'appUrlOpen', listenerFunc: unknown): Promise<void>
}

export const InstalledApps = registerPlugin<InstalledAppsPluginInterface>('InstalledApps')

/** آیا داخل اپ اندروید اجرا می‌شویم؟ (نه مرورگر) */
export const isNativeApp = (): boolean => Capacitor.isNativePlatform()

/**
 * باز کردن لینک خارجی — روی گوشی در مرورگر/اپ سیستم، در وب در تب جدید
 * (window.open داخل WebView کار نمی‌کند؛ حتماً باید اینتنت نیتیو زده شود)
 */
export async function openExternal(url: string): Promise<boolean> {
  if (isNativeApp()) {
    try {
      await InstalledApps.openUrl({ url })
      return true
    } catch {
      return false
    }
  }
  const w = window.open(url, '_blank')
  return Boolean(w)
}
