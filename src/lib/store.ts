'use client'

import { create } from 'zustand'
import type { AppSource, DownloadTask, HistoryItem, InstalledApp, SettingsT } from '@/lib/types'
import { addHistory, getSettings, listApps, listHistory, updateSettings as dbUpdateSettings } from '@/lib/local-db'

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
  applyScanResult: (apps: InstalledApp[], history: HistoryItem[]) => void
  setScanning: (v: boolean) => void

  search: SearchState
  toggleSearch: () => void
  setSearchQuery: (q: string) => void

  sourceFilter: AppSource | 'all'
  setSourceFilter: (f: AppSource | 'all') => void

  downloads: Record<string, DownloadTask>
  completedFlash: string[]
  startDownload: (app: InstalledApp) => void
  pauseResume: (appId: string) => void
  cancelDownload: (appId: string) => void
  pauseAll: () => void
  tick: () => void
  recordHistory: (task: DownloadTask) => Promise<void>

  updateSettings: (patch: Partial<SettingsT>) => Promise<void>

  // اعلان‌های شیشه‌ای
  toast: string | null
  showToast: (msg: string) => void
}

const MAX_CONCURRENT = 3
const TICK_MS = 600

// زمان‌بند عمومی شبیه‌ساز دانلود (یک‌بار در ماژول ساخته می‌شود)
let engineStarted = false
let toastTimer: ReturnType<typeof setTimeout> | null = null

export const useAppStore = create<AppStore>((set, get) => {
  const startEngine = () => {
    if (engineStarted) return
    engineStarted = true
    setInterval(() => get().tick(), TICK_MS)
  }

  const releaseQueued = (downloads: Record<string, DownloadTask>) => {
    const active = Object.values(downloads).filter((d) => d.status === 'downloading').length
    let slots = MAX_CONCURRENT - active
    if (slots > 0) {
      for (const d of Object.values(downloads)) {
        if (slots <= 0) break
        if (d.status === 'queued') { d.status = 'downloading'; slots-- }
      }
    }
  }

  return {
    view: 'home',
    setView: (v) => set({ view: v }),

    apps: [],
    history: [],
    settings: null,
    loading: true,
    scanning: false,
    loadAll: async () => {
      try {
        const apps = listApps()
        const history = listHistory()
        const settings = getSettings()
        set({ apps, history, settings, loading: false })
        startEngine()
      } catch {
        set({ loading: false })
      }
    },
    applyScanResult: (apps, history) => set({ apps, history }),
    setScanning: (v) => set({ scanning: v }),

    search: { active: false, query: '' },
    toggleSearch: () => set((s) => ({ search: { active: !s.search.active, query: '' } })),
    setSearchQuery: (q) => set((s) => ({ search: { ...s.search, query: q } })),

    sourceFilter: 'all',
    setSourceFilter: (f) => set({ sourceFilter: f }),

    downloads: {},
    completedFlash: [],
    startDownload: (app) => {
      const { downloads, settings, showToast } = get()
      if (downloads[app.id]) return
      const size = app.newVersion ? Math.round(app.sizeMB * 0.9 * 10) / 10 : app.sizeMB
      const active = Object.values(downloads).filter((d) => d.status === 'downloading').length
      const premium = settings?.isPremium ?? false
      if (active >= (premium ? 5 : MAX_CONCURRENT)) {
        showToast(`«${app.name}» در صف دانلود قرار گرفت`)
        set({
          downloads: {
            ...downloads,
            [app.id]: {
              appId: app.id, name: app.name, iconColor: app.iconColor, iconType: app.iconType,
              source: app.source, sizeMB: size, progress: 0,
              speedMB: Math.round((8 + Math.random() * 7) * 10) / 10,
              fromVersion: app.version, toVersion: app.newVersion ?? app.version,
              status: 'queued',
            },
          },
        })
        return
      }
      set({
        downloads: {
          ...downloads,
          [app.id]: {
            appId: app.id, name: app.name, iconColor: app.iconColor, iconType: app.iconType,
            source: app.source, sizeMB: size, progress: 0,
            speedMB: Math.round((8 + Math.random() * 7) * 10) / 10,
            fromVersion: app.version, toVersion: app.newVersion ?? app.version,
            status: 'downloading',
          },
        },
      })
    },
    pauseResume: (appId) => {
      const downloads = { ...get().downloads }
      const d = downloads[appId]
      if (!d) return
      if (d.status === 'paused') {
        const active = Object.values(downloads).filter((x) => x.status === 'downloading').length
        d.status = active < (get().settings?.isPremium ? 5 : MAX_CONCURRENT) ? 'downloading' : 'queued'
      } else if (d.status !== 'queued') {
        d.status = 'paused'
      } else {
        d.status = 'paused'
      }
      set({ downloads })
      releaseQueued(downloads)
      set({ downloads: { ...downloads } })
    },
    cancelDownload: (appId) => {
      const downloads = { ...get().downloads }
      delete downloads[appId]
      releaseQueued(downloads)
      set({ downloads })
      get().showToast('دانلود لغو شد')
    },
    pauseAll: () => {
      const downloads = { ...get().downloads }
      for (const d of Object.values(downloads)) {
        if (d.status === 'downloading') d.status = 'paused'
      }
      set({ downloads })
      get().showToast('همه دانلودها متوقف شدند')
    },
    tick: () => {
      const { downloads } = get()
      if (Object.keys(downloads).length === 0) return
      const next: Record<string, DownloadTask> = {}
      let changed = false
      const flash: string[] = []
      for (const d of Object.values(downloads)) {
        if (d.status === 'downloading') {
          changed = true
          const step = (d.speedMB * (TICK_MS / 1000) / d.sizeMB) * 100
          const p = Math.min(100, d.progress + step * (0.85 + Math.random() * 0.4))
          if (p >= 100) {
            flash.push(d.appId)
            const t: DownloadTask = { ...d, progress: 100 }
            next[d.appId] = t
            void get().recordHistory(t)
          } else {
            next[d.appId] = { ...d, progress: p, speedMB: Math.round((6 + Math.random() * 9) * 10) / 10 }
          }
        } else {
          next[d.appId] = d
        }
      }
      if (flash.length) {
        // بعد از تکمیل، کارت کمی بعد حذف می‌شود و نسخه برنامه در لیست به‌روز می‌شود
        setTimeout(() => {
          const cur = { ...get().downloads }
          for (const id of flash) delete cur[id]
          releaseQueued(cur)
          set({ downloads: cur, apps: get().apps.map((a) => cur[a.id] ? a : (a.id === flash[0] ? { ...a, version: a.newVersion ?? a.version, newVersion: null } : a)) })
        }, 2200)
        set({
          apps: get().apps.map((a) => (flash.includes(a.id) ? { ...a, version: a.newVersion ?? a.version, newVersion: null } : a)),
          completedFlash: flash,
        })
      }
      if (changed) set({ downloads: next })
    },
    recordHistory: async (task) => {
      try {
        const item = addHistory({
          appName: task.name, iconColor: task.iconColor, iconType: task.iconType,
          package: task.appId, fromVersion: task.fromVersion, toVersion: task.toVersion,
          source: task.source, sizeMB: task.sizeMB, status: 'completed',
          date: new Date().toISOString(),
        })
        set({ history: [item, ...get().history] })
      } catch { /* noop */ }
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
  }
})
