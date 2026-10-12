'use client'

import { useMemo } from 'react'
import { Search, User, History, RefreshCcw, ArrowUpCircle, Play, Loader2, X, Radar } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { AppIcon } from './app-icon'
import { SourceBadge } from './source-badge'
import { FeedAdCard } from './ad-banner'
import { faDigits } from '@/lib/persian'
import type { AdItemT, AppSource, InstalledApp } from '@/lib/types'
import { cn } from '@/lib/utils'

const SOURCE_CHIPS: Array<{ key: AppSource | 'all'; label: string }> = [
  { key: 'all', label: 'همه' },
  { key: 'googleplay', label: 'گوگل‌پلی' },
  { key: 'bazaar', label: 'بازار' },
  { key: 'myket', label: 'مایکت' },
  { key: 'github', label: 'گیت‌هاب' },
  { key: 'system', label: 'سیستمی' },
]

export function HomeView({
  ads,
  onOpenDetails,
  onOpenProfile,
}: {
  ads: AdItemT[]
  onOpenDetails: (app: InstalledApp) => void
  onOpenProfile: () => void
}) {
  const apps = useAppStore((s) => s.apps)
  const loading = useAppStore((s) => s.loading)
  const scanning = useAppStore((s) => s.scanning)
  const search = useAppStore((s) => s.search)
  const toggleSearch = useAppStore((s) => s.toggleSearch)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const sourceFilter = useAppStore((s) => s.sourceFilter)
  const setSourceFilter = useAppStore((s) => s.setSourceFilter)
  const updateApp = useAppStore((s) => s.updateApp)
  const launchApp = useAppStore((s) => s.launchApp)
  const updateAll = useAppStore((s) => s.updateAll)
  const setView = useAppStore((s) => s.setView)
  const settings = useAppStore((s) => s.settings)
  const runScan = useAppStore((s) => s.runScan)

  const updateCount = apps.filter((a) => a.newVersion).length

  const filtered = useMemo(() => {
    let list = apps
    if (sourceFilter === 'all') list = list.filter((a) => !a.system)
    else list = list.filter((a) => a.source === sourceFilter)
    if (search.query.trim()) {
      const q = search.query.trim().toLowerCase()
      list = list.filter(
        (a) => a.name.toLowerCase().includes(q) || a.nameEn.toLowerCase().includes(q) || a.package.toLowerCase().includes(q)
      )
    }
    return list
  }, [apps, sourceFilter, search.query])

  const feedAds = ads.filter((a) => a.placement === 'feed')

  const startAll = () => {
    const pending = apps.filter((a) => a.newVersion)
    if (pending.length > 0) void updateAll(pending)
  }

  return (
    <div className="flex min-h-full flex-col pb-28">
      {/* هدر */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 px-4 pt-3 pb-2 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            
            <img src="/icon.png" alt="لوگوی آپدیت‌یار" className="size-9 rounded-xl" />
            <h1 className="text-[19px] font-black">آپدیت‌یار</h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleSearch}
              aria-label="جستجو"
              className="flex size-10 items-center justify-center rounded-full text-foreground/80 hover:bg-muted"
            >
              {search.active ? <X className="size-[22px]" /> : <Search className="size-[22px]" />}
            </button>
            <button
              onClick={() => setView('history')}
              aria-label="تاریخچه آپدیت‌ها"
              className="flex size-10 items-center justify-center rounded-full text-foreground/80 hover:bg-muted"
            >
              <History className="size-[21px]" />
            </button>
            <button
              onClick={onOpenProfile}
              aria-label="حساب کاربری"
              className="flex size-10 items-center justify-center rounded-full text-foreground/80 hover:bg-muted"
            >
              <User className="size-[22px]" />
            </button>
          </div>
        </div>

        {search.active && (
          <div className="mt-2 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={search.query}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی در برنامه‌ها..."
                className="min-h-[44px] w-full bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        )}
      </header>

      {/* خلاصه به‌روزرسانی‌ها */}
      <section aria-label="خلاصه به‌روزرسانی" className="px-4 pt-3">
        <div className="flex items-center justify-between rounded-3xl border border-border bg-card p-4">
          <div>
            <p className="text-[16px] font-black">
              {loading ? 'در حال بارگذاری...' : updateCount > 0 ? `${faDigits(updateCount)} به‌روزرسانی موجود است` : 'همه برنامه‌ها به‌روز هستند'}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              از بازار، مایکت، گوگل‌پلی و گیت‌هاب
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startAll}
              disabled={updateCount === 0 || loading}
              aria-label="به‌روزرسانی همه"
              className="flex min-h-[42px] items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-black text-primary-foreground transition-all active:scale-95 disabled:opacity-40"
            >
              <RefreshCcw className="size-4" />
              به‌روزرسانی همه
            </button>
          </div>
        </div>
      </section>

      {/* فیلتر منابع */}
      <section aria-label="فیلتر منابع" className="px-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold">فیدها بر اساس منبع</h2>
          <button
            onClick={() => void runScan()}
            disabled={scanning}
            className="flex items-center gap-1 text-[11px] font-bold text-primary"
          >
            {scanning ? <Loader2 className="size-3.5 animate-spin" /> : <Radar className="size-3.5" />}
            بررسی آپدیت
          </button>
        </div>
        <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
          {SOURCE_CHIPS.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setSourceFilter(chip.key)}
              className={cn(
                'min-h-[36px] shrink-0 rounded-full border px-4 text-[12px] font-bold transition-all',
                sourceFilter === chip.key
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </section>

      {/* لیست برنامه‌ها */}
      <section aria-label="لیست برنامه‌ها" className="mt-2 flex-1 space-y-2 px-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
              <div className="size-11 animate-pulse rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-9 w-16 animate-pulse rounded-full bg-muted" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <Search className="size-8 text-muted-foreground/50" />
            <p className="text-[14px] font-bold">برنامه‌ای پیدا نشد</p>
            <p className="text-[12px] text-muted-foreground">عبارت دیگری را جستجو کنید یا فیلتر را تغییر دهید</p>
          </div>
        ) : (
          filtered.map((app, idx) => (
            <div key={app.id}>
              <AppFeedCard
                app={app}
                onUpdate={() => void updateApp(app)}
                onLaunch={() => void launchApp(app)}
                onOpen={() => onOpenDetails(app)}
              />
              {!settings?.isPremium && feedAds.length > 0 && (idx + 1) % 5 === 0 && (
                <div className="mt-2">
                  <FeedAdCard ad={feedAds[(Math.floor(idx / 5)) % feedAds.length]} />
                </div>
              )}
            </div>
          ))
        )}
      </section>

      {/* دکمه شناور بررسی */}
      <button
        onClick={() => void runScan()}
        disabled={scanning}
        aria-label="بررسی به‌روزرسانی"
        className={cn(
          'fixed left-[calc(50%-190px+16px)] z-20 flex size-13 items-center justify-center rounded-2xl bg-primary p-3.5 text-primary-foreground shadow-xl shadow-primary/25 transition-all active:scale-95 max-[450px]:left-4',
          settings?.isPremium ? 'bottom-24' : 'bottom-[150px]'
        )}
      >
        {scanning ? <Loader2 className="size-6 animate-spin" /> : <Radar className="size-6" />}
      </button>
    </div>
  )
}

function AppFeedCard({
  app,
  onUpdate,
  onLaunch,
  onOpen,
}: {
  app: InstalledApp
  onUpdate: () => void
  onLaunch: () => void
  onOpen: () => void
}) {
  const hasUpdate = Boolean(app.newVersion)
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 transition-colors">
      <button onClick={onOpen} aria-label={`جزئیات ${app.name}`} className="shrink-0">
        <AppIcon type={app.iconType} color={app.iconColor} icon={app.iconBase64} />
      </button>
      <button onClick={onOpen} className="min-w-0 flex-1 text-right">
        <p className="truncate text-[14px] font-bold">{app.name}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="num shrink-0">نسخه {faDigits(app.version)}</span>
          <span className="shrink-0">•</span>
          <SourceBadge source={app.source} />
        </div>
      </button>
      {hasUpdate ? (
        <button
          onClick={onUpdate}
          aria-label={`به‌روزرسانی ${app.name}`}
          className="flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-black text-primary-foreground transition-all active:scale-95"
        >
          <ArrowUpCircle className="size-4" />
          آپدیت
        </button>
      ) : (
        <button
          onClick={onLaunch}
          aria-label={`باز کردن ${app.name}`}
          className="flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted px-4 text-[13px] font-bold text-foreground/80 transition-all active:scale-95"
        >
          <Play className="size-3.5" />
          باز
        </button>
      )}
    </div>
  )
}
