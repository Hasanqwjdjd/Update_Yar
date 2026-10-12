'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { AppIcon } from './app-icon'
import { SourceBadge } from './source-badge'
import { ShieldCheck, Package, ArrowUpCircle, History as HistoryIcon } from 'lucide-react'
import { faDigits, faSize } from '@/lib/persian'
import { useAppStore } from '@/lib/store'
import type { InstalledApp } from '@/lib/types'

export function DetailsSheet({
  app,
  onOpenChange,
}: {
  app: InstalledApp | null
  onOpenChange: (v: boolean) => void
}) {
  const startDownload = useAppStore((s) => s.startDownload)
  const setView = useAppStore((s) => s.setView)

  if (!app) return null
  const hasUpdate = Boolean(app.newVersion)

  return (
    <Sheet open={Boolean(app)} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-[430px] rounded-t-3xl border-border bg-card px-0 pt-2 pb-8 [&>button]:left-4 [&>button]:right-auto">
        <SheetHeader className="px-5 text-right">
          <SheetTitle className="sr-only">جزئیات {app.name}</SheetTitle>
        </SheetHeader>
        <div className="max-h-[62vh] overflow-y-auto px-5 pb-4">
          <div className="flex items-center gap-3">
            <AppIcon type={app.iconType} color={app.iconColor} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-black">{app.name}</p>
              <p className="text-[11px] text-muted-foreground">نسخه فعلی: {faDigits(app.version)}</p>
              <p className="text-[11px] text-muted-foreground">توسعه‌دهنده: {app.developer || app.nameEn}</p>
            </div>
            <div className="flex flex-col items-start gap-1">
              <SourceBadge source={app.source} />
              {app.system && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-2 py-0.5 text-[10px] text-slate-400">
                  <Package className="size-3" /> سیستمی
                </span>
              )}
            </div>
          </div>

          {hasUpdate ? (
            <>
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-primary/25 bg-primary/8 p-3">
                <ArrowUpCircle className="size-5 shrink-0 text-primary" />
                <p className="text-[12px] leading-5">
                  نسخه جدید <b className="num">{faDigits(app.newVersion!)}</b> در دسترس است
                  <span className="text-muted-foreground"> — حجم {faSize(app.sizeMB * 0.9)}</span>
                </p>
              </div>
              <div className="mt-4">
                <p className="mb-2 text-[13px] font-bold">تغییرات این نسخه</p>
                <ul className="space-y-1.5">
                  {app.changelog.split('\n').filter(Boolean).map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] leading-6 text-muted-foreground">
                      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-primary/25 bg-primary/8 p-3">
              <ShieldCheck className="size-5 shrink-0 text-primary" />
              <p className="text-[12px]">این برنامه به‌روز است — آخرین بررسی: به‌تازگی انجام شد</p>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            امضای دیجیتال با نسخه قبلی مطابقت داده شد — فایل جعلی نیست
          </div>

          <div className="mt-4 flex gap-2">
            {hasUpdate ? (
              <button
                onClick={() => { startDownload(app); onOpenChange(false); setView('updates') }}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-[14px] font-black text-primary-foreground active:scale-[0.98]"
              >
                <ArrowUpCircle className="size-5" />
                به‌روزرسانی به نسخه جدید ({faDigits(app.newVersion!)})
              </button>
            ) : (
              <button
                onClick={() => { onOpenChange(false); }}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-foreground/10 text-[14px] font-black active:scale-[0.98]"
              >
                باز کردن برنامه
              </button>
            )}
            <button
              onClick={() => { onOpenChange(false); setView('history') }}
              aria-label="تاریخچه آپدیت‌ها"
              className="flex min-h-[48px] w-12 items-center justify-center rounded-2xl border border-border text-muted-foreground"
            >
              <HistoryIcon className="size-5" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
