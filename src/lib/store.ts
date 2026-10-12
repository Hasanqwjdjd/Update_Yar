'use client'

import { create } from 'zustand'
import type { AppSource, HistoryItem, InstalledApp, SettingsT } from '@/lib/types'
import {
  addHistory, getSettings, listHistory, loadAppsCache,
  updateSettings as dbUpdateSettings, saveAppsCache,
} from '@/lib/local-db'
import { InstalledApps, isNativeApp } from '@/lib/native'
import { faDigits } from '@/lib/persian'
import type { PaymentDone } from '@/lib/payment'

export type View = 'home' | 'updates' | 'github' | 'history' | 'settings'

export type ScanError = 'permission' | 'timeout' | 'failed' | null

export interface SearchState {
  active: boolean
  query: string
}

/** سقف زمانی اسکن — تا هیچ‌وقت اپ روی اورلی اسکن گیر نکند */
const SCAN_TIMEOUT_MS = 45000

function withTimeout<T>(p: Promise<T>, ms: number, tag = 'timeout'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(tag)), ms)
    p.then(
      (v) => { clearTimeout(t); resolve(v) },
      (e) => { clearTimeout(t); reject(e) },
    )
  })
}

interface AppStore {
  view: View
  setView: (v: View) => void

  apps: InstalledApp[]
  history: HistoryItem[]
  settings: SettingsT | null
  loading: boolean
  scanning: boolean
  scanError: ScanError
  loadAll: () => Promise<void>
  /** اجرای اسکن واقعی برنامه‌ها — از همه‌ی دکمه‌ها صدا زده می‌شود */
  runScan: () => Promise<void>
  applyScanResult: (apps: InstalledApp[]) => void

  search: SearchState
  toggleSearch: () => void
  setSearchQuery: (q: string) => void

  sourceFilter: AppSource | 'all'
  setSourceFilter: (f: AppSource | 'all') => void

  /** باز کردن صفحه‌ی برنامه در فروشگاه (اقدام واقعی روی گوشی) */
  updateApp: (app: InstalledApp) => Promise<void>
  /** به‌روزرسانی همه — صفحه فروشگاه اولین برنامه باز می‌شود */
  updateAll: (apps: InstalledApp[]) => Promise<void>
  /** اجرای واقعی برنامه روی گوشی */
  launchApp: (app: InstalledApp) => Promise<void>

  updateSettings: (patch: Partial<SettingsT>) => Promise<void>
  /** بازخوانی تنظیمات از دیتابیس محلی (بعد از فعال‌شدن اشتراک و...) */
  refreshSettings: () => void

  /** نتیجه‌ی پرداخت موفق (پس از تأیید درگاه) — شیت‌ها به آن واکنش نشان می‌دهند */
  paymentDone: PaymentDone | null
  setPaymentDone: (r: PaymentDone) => void
  clearPaymentDone: () => void

  // اعلان‌های شیشه‌ای
  toast: string | null
  showToast: (msg: string) => void
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

export const useAppStore = create<AppStore>((set, get) => ({
  view: 'home',
  setView: (v) => set({ view: v }),

  apps: [],
  history: [],
  settings: null,
  loading: true,
  scanning: false,
  scanError: null,
  loadAll: async () => {
    try {
      const cached = loadAppsCache()
      const history = listHistory()
      const settings = getSettings()
      set({ apps: cached, history, settings, loading: cached.length > 0 ? false : true })
      // اگر هیچ کشی نیست، اسکن اولیه انجام می‌شود (روی گوشی)
      if (cached.length === 0 && isNativeApp()) {
        void get().runScan()
      } else if (cached.length === 0) {
        set({ loading: false })
      }
    } catch {
      set({ loading: false })
    }
  },

  runScan: async () => {
    if (get().scanning) return
    set({ scanning: true, scanError: null })
    const { showToast } = get()
    try {
      if (!isNativeApp()) {
        // پیش‌نمایش وب — داده نمایشی (روی گوشی، اسکن واقعی انجام می‌شود)
        await new Promise((r) => setTimeout(r, 700))
        const { demoApps } = await import('@/lib/local-db')
        set({ apps: demoApps(), loading: false })
        showToast('پیش‌نمایش وب — نسخه اندروید گوشی واقعی شما را اسکن می‌کند')
        return
      }

      // اسکن واقعی: خواندن برنامه‌های نصب‌شده از خود گوشی (با سقف زمانی)
      const scan = await withTimeout(
        InstalledApps.listInstalledApps(),
        SCAN_TIMEOUT_MS,
        'timeout',
      )
      const { buildAppsFromNative } = await import('@/lib/local-db')
      const apps = buildAppsFromNative(scan?.apps ?? [])
      saveAppsCache(apps)
      set({ apps, loading: false })
      const updateCount = apps.filter((a) => a.newVersion).length
      showToast(
        updateCount > 0
          ? `${faDigits(apps.length)} برنامه بررسی شد — ${faDigits(updateCount)} به‌روزرسانی موجود است`
          : `${faDigits(apps.length)} برنامه بررسی شد — همه به‌روز هستند ✓`
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('PERMISSION_DENIED')) {
        set({ scanError: 'permission' })
      } else if (msg === 'timeout') {
        set({ scanError: 'timeout' })
      } else {
        set({ scanError: 'failed' })
      }
    } finally {
      set({ scanning: false })
    }
  },

  applyScanResult: (apps) => set({ apps }),

  search: { active: false, query: '' },
  toggleSearch: () => set((s) => ({ search: { active: !s.search.active, query: '' } })),
  setSearchQuery: (q) => set((s) => ({ search: { ...s.search, query: q } })),

  sourceFilter: 'all',
  setSourceFilter: (f) => set({ sourceFilter: f }),

  updateApp: async (app) => {
    const { showToast } = get()
    try {
      if (isNativeApp()) {
        await InstalledApps.openInStore({
          packageName: app.package,
          store: app.source,
          url: app.source === 'github'
            ? `https://github.com/search?q=${encodeURIComponent(app.nameEn || app.name)}&type=repositories`
            : undefined,
        })
      } else {
        // وب: باز کردن صفحه فروشگاه در تب جدید
        const url = app.source === 'googleplay'
          ? `https://play.google.com/store/apps/details?id=${app.package}`
          : app.source === 'myket'
            ? `https://myket.ir/app/${app.package}`
            : app.source === 'github'
              ? `https://github.com/search?q=${encodeURIComponent(app.nameEn || app.name)}&type=repositories`
              : `https://cafebazaar.ir/app/${app.package}`
        window.open(url, '_blank')
      }
      // ثبت رویداد واقعی در تاریخچه
      const item = addHistory({
        appName: app.name,
        iconColor: app.iconColor,
        iconType: app.iconType,
        package: app.package,
        fromVersion: app.version,
        toVersion: app.newVersion ?? app.version,
        source: app.source,
        sizeMB: app.sizeMB,
        status: 'completed',
        date: new Date().toISOString(),
      })
      set({ history: [item, ...get().history].slice(0, 100) })
      const storeName = app.source === 'googleplay' ? 'گوگل‌پلی' : app.source === 'myket' ? 'مایکت' : app.source === 'github' ? 'گیت‌هاب' : 'کافه‌بازار'
      showToast(`صفحه ${storeName} برای «${app.name}» باز شد`)
    } catch {
      showToast('باز کردن فروشگاه ناموفق بود')
    }
  },

  updateAll: async (updates) => {
    if (updates.length === 0) return
    await get().updateApp(updates[0])
    if (updates.length > 1) {
      get().showToast(`پس از این آپدیت، ${updates.length - 1} برنامه‌ی دیگر هم در انتظار است`)
    }
  },

  launchApp: async (app) => {
    const { showToast } = get()
    try {
      if (isNativeApp()) {
        await InstalledApps.openApp({ packageName: app.package })
      } else {
        showToast('اجرای برنامه فقط روی گوشی ممکن است')
      }
    } catch {
      showToast(`اجرای «${app.name}» ممکن نشد`)
    }
  },

  updateSettings: async (patch) => {
    const current = get().settings
    if (!current) return
    const fresh = dbUpdateSettings(patch)
    set({ settings: { ...current, ...fresh } })
  },

  refreshSettings: () => {
    set({ settings: getSettings() })
  },

  paymentDone: null,
  setPaymentDone: (r) => set({ paymentDone: r }),
  clearPaymentDone: () => set({ paymentDone: null }),

  toast: null,
  showToast: (msg) => {
    if (toastTimer) clearTimeout(toastTimer)
    set({ toast: msg })
    toastTimer = setTimeout(() => set({ toast: null }), 3200)
  },
}))
