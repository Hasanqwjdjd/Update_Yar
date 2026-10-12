'use client'

import { useMemo, useState } from 'react'
import { RefreshCcw, ArrowUpCircle } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { AppIcon } from './app-icon'
import { faDigits, faSize } from '@/lib/persian'
import { cn } from '@/lib/utils'
import type { AppSource, InstalledApp } from '@/lib/types'

const CAT_CHIPS: Array<{ key: AppSource | 'all'; label: string }> = [
  { key: 'all', label: 'همه' },
  { key: 'googleplay', label: 'گوگل‌پلی' },
  { key: 'bazaar', label: 'بازار' },
  { key: 'myket', label: 'مایکت' },
  { key: 'github', label: 'گیت‌هاب' },
  { key: 'system', label: 'سیستمی' },
]

export function UpdatesView({ onOpenDetails }: { onOpenDetails: (app: InstalledApp) => void }) {
  const apps = useAppStore((s) => s.apps)
  const updateApp = useAppStore((s) => s.updateApp)
  const updateAll = useAppStore((s) => s.updateAll)
  const [cat, setCat] = useState<AppSource | 'all'>('all')

  const updates = useMemo(() => {
    let list = apps.filter((a) => a.newVersion)
    if (cat !== 'all') list = list.filter((a) => a.source === cat)
    return list
  }, [apps, cat])

  const totalUpdateCount = apps.filter((a) => a.newVersion).length

  const startAll = () => {
    if (updates.length > 0) void updateAll(updates)
  }

  return (
    <div className="flex min-h-full flex-col pb-28">
      {/* هدر */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 px-4 pt-3 pb-3 backdrop-blur-xl">
        <h1 className="text-center text-[18px] font-black">به‌روزرسانی‌های موجود</h1>
      </header>

      {/* لیست به‌روزرسانی‌های موجود */}
      <section aria-label="لیست به‌روزرسانی‌های موجود" className="px-4 pt-3">
        <div className="text-center">
          <p className="text-[17px] font-black">
            {totalUpdateCount > 0 ? `${faDigits(totalUpdateCount)} آپدیت جدید` : 'آپدیت جدیدی نیست'}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {faDigits(apps.filter((a) => !a.system).length)} برنامه نصب‌شده بررسی شد
          </p>
        </div>

        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {CAT_CHIPS.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setCat(chip.key)}
              className={cn(
                'min-h-[34px] shrink-0 rounded-full border px-4 text-[12px] font-bold transition-all',
                cat === chip.key
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground'
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-2.5">
          {updates.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <RefreshCcw className="size-8 text-muted-foreground/40" />
              <p className="text-[14px] font-bold">همه چیز به‌روز است!</p>
              <p className="text-[12px] text-muted-foreground">برای بررسی مجدد، از صفحه خانه «بررسی آپدیت» را بزنید</p>
            </div>
          ) : (
            updates.map((app) => (
              <div key={app.id} className="rounded-2xl border border-border bg-card p-3.5">
                <button onClick={() => onOpenDetails(app)} className="flex w-full items-center gap-3 text-right">
                  <AppIcon type={app.iconType} color={app.iconColor} icon={app.iconBase64} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold">{app.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {app.category}{app.sizeMB > 0 ? ` • ${faSize(app.sizeMB)}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-xl bg-muted px-3 py-1.5 text-center">
                    <p className="num text-[10px] text-muted-foreground">نسخه فعلی {faDigits(app.version)}</p>
                    <p className="num text-[12px] font-bold text-primary">جدید {faDigits(app.newVersion!)}</p>
                  </div>
                </button>
                {app.changelog && (
                  <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-muted-foreground">
                    <b className="text-foreground/70">تغییرات:</b> {app.changelog.split('\n')[0]}
                  </p>
                )}
                <button
                  onClick={() => void updateApp(app)}
                  className="mt-2.5 flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl bg-primary/12 py-2.5 text-[13px] font-black text-primary active:scale-[0.99]"
                >
                  <ArrowUpCircle className="size-4" />
                  به‌روزرسانی در فروشگاه
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* نوار پایین به‌روزرسانی همه */}
      {updates.length > 0 && (
        <div className="fixed bottom-[76px] left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 px-4">
          <button
            onClick={startAll}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[14px] font-black text-primary-foreground shadow-xl shadow-primary/25 transition-transform active:scale-[0.98]"
          >
            <RefreshCcw className="size-4.5" />
            به‌روزرسانی اولین برنامه ({faDigits(updates.length)} در صف)
          </button>
        </div>
      )}
    </div>
  )
}
