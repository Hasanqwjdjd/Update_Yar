'use client'

import { create } from 'zustand'
import type { AppSource, HistoryItem, InstalledApp, SettingsT } from '@/lib/types'
import {
  addHistory, getSettings, listHistory, loadAppsCache,
  updateSettings as dbUpdateSettings, saveAppsCache,
} from '@/lib/local-db'
import { InstalledApps, isNativeApp } from '@/lib/native'

export type View = 'home' | 'updates' | 'github' | 'history' | 'settings'

export interface SearchState {
  active: boolean
  query: string
}

interface AppStore {
  view: View
  setView: (v: View) => void

  apps: InstalledApp[]
  history: HistoryItem[]
  settings: SettingsT | null
  loading: boolean
  scanning: boolean
  loadAll: () => Promise<void>
  applyScanResult: (apps: InstalledApp[]) => void
  setScanning: (v: boolean) => void

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
  loadAll: async () => {
    try {
      const cached = loadAppsCache()
      const history = listHistory()
      const settings = getSettings()
      set({ apps: cached, history, settings, loading: cached.length > 0 ? false : true })
      // اگر هیچ کشی نیست، اسکن اولیه انجام می‌شود (روی گوشی)
      if (cached.length === 0) {
        if (isNativeApp()) {
          try {
            const { apps: natives } = await InstalledApps.listInstalledApps()
            const { buildAppsFromNative } = await import('@/lib/local-db')
            const apps = buildAppsFromNative(natives)
            saveAppsCache(apps)
            set({ apps, loading: false })
            return
          } catch { /* اسکن صفحه اصلی هم انجام می‌دهد */ }
        }
        set({ loading: false })
      }
    } catch {
      set({ loading: false })
    }
  },
  applyScanResult: (apps) => set({ apps }),
  setScanning: (v) => set({ scanning: v }),

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

  toast: null,
  showToast: (msg) => {
    if (toastTimer) clearTimeout(toastTimer)
    set({ toast: msg })
    toastTimer = setTimeout(() => set({ toast: null }), 2600)
  },
}))
