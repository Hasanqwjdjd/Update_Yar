'use client'

/**
 * پل ارتباط با پلاگین نیتیو اندروید (InstalledAppsPlugin.java)
 *
 * روی گوشی: قابلیت‌های واقعی — خواندن برنامه‌های نصب‌شده، اجرای اپ، باز کردن فروشگاه
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
  listInstalledApps(): Promise<{ apps: NativeAppInfo[] }>
  openApp(options: { packageName: string }): Promise<void>
  openInStore(options: { packageName: string; store: string; url?: string }): Promise<void>
}

export const InstalledApps = registerPlugin<InstalledAppsPluginInterface>('InstalledApps')

/** آیا داخل اپ اندروید اجرا می‌شویم؟ (نه مرورگر) */
export const isNativeApp = (): boolean => Capacitor.isNativePlatform()
