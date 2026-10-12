'use client'

import { useMemo, useState } from 'react'
import { Pause, Play, X, RefreshCcw, ArrowUpCircle, ChevronDown, ChevronUp, PauseCircle, Hourglass } from 'lucide-react'
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
  const downloads = useAppStore((s) => s.downloads)
  const startDownload = useAppStore((s) => s.startDownload)
  const pauseResume = useAppStore((s) => s.pauseResume)
  const cancelDownload = useAppStore((s) => s.cancelDownload)
  const pauseAll = useAppStore((s) => s.pauseAll)
  const [cat, setCat] = useState<AppSource | 'all'>('all')
  const [showActive, setShowActive] = useState(true)

  const activeTasks = Object.values(downloads)
  const downloadingCount = activeTasks.filter((t) => t.status !== 'paused').length
  const hasActive = activeTasks.length > 0

  const updates = useMemo(() => {
    let list = apps.filter((a) => a.newVersion)
    if (cat !== 'all') list = list.filter((a) => a.source === cat)
    return list
  }, [apps, cat])

  const totalUpdateCount = apps.filter((a) => a.newVersion).length

  const startAll = () => {
    updates.filter((a) => !downloads[a.id]).forEach((a) => startDownload(a))
  }

  return (
    <div className="flex min-h-full flex-col pb-28">
      {/* هدر */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 px-4 pt-3 pb-3 backdrop-blur-xl">
        <h1 className="text-center text-[18px] font-black">
          {hasActive ? 'در حال به‌روزرسانی' : 'به‌روزرسانی‌های موجود'}
        </h1>
      </header>

      {/* دانلودهای فعال */}
      {hasActive && (
        <section aria-label="دانلودهای فعال" className="px-4 pt-3">
          <button
            onClick={() => setShowActive((v) => !v)}
            className="mb-2 flex w-full items-center justify-between text-[13px] font-bold text-muted-foreground"
          >
            <span>
              {faDigits(downloadingCount)} دانلود فعال
              {activeTasks.some((t) => t.status === 'paused') && ' • متوقف‌شده'}
            </span>
            {showActive ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          {showActive && (
            <div className="space-y-2">
              {activeTasks.slice(0, 1).map((t) => (
                <ActiveTaskCard key={t.appId} task={t} featured onPause={() => pauseResume(t.appId)} onCancel={() => cancelDownload(t.appId)} />
              ))}
              {activeTasks.slice(1).map((t) => (
                <ActiveTaskMini key={t.appId} task={t} onPause={() => pauseResume(t.appId)} onCancel={() => cancelDownload(t.appId)} />
              ))}
              {downloadingCount > 1 && (
                <button
                  onClick={pauseAll}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[13px] font-bold text-muted-foreground active:scale-[0.99]"
                >
                  <PauseCircle className="size-4" />
                  توقف همه دانلودها
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* لیست به‌روزرسانی‌های موجود */}
      <section aria-label="لیست به‌روزرسانی‌های موجود" className="px-4 pt-3">
        <div className="text-center">
          <p className="text-[17px] font-black">
            {totalUpdateCount > 0 ? `${faDigits(totalUpdateCount)} آپدیت جدید` : 'آپدیت جدیدی نیست'}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {faDigits(apps.length)} برنامه نصب‌شده بررسی شد
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
            updates.map((app) => {
              const task = downloads[app.id]
              return (
                <div key={app.id} className="rounded-2xl border border-border bg-card p-3.5">
                  <button onClick={() => onOpenDetails(app)} className="flex w-full items-center gap-3 text-right">
                    <AppIcon type={app.iconType} color={app.iconColor} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-bold">{app.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{app.category} • {faSize(app.sizeMB * 0.9)}</p>
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
                  {task && task.status !== 'queued' ? (
                    <div className="mt-2.5">
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${task.progress}%` }} />
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="num text-[10px] text-muted-foreground">{faDigits(Math.round(task.progress))}٪</span>
                        <div className="flex gap-1.5">
                          <button onClick={() => pauseResume(app.id)} aria-label="توقف" className="flex min-h-[32px] items-center gap-1 rounded-full bg-muted px-3 text-[11px] font-bold">
                            {task.status === 'paused' ? <Play className="size-3" /> : <Pause className="size-3" />}
                            {task.status === 'paused' ? 'ادامه' : 'توقف'}
                          </button>
                          <button onClick={() => cancelDownload(app.id)} aria-label="لغو" className="flex min-h-[32px] items-center gap-1 rounded-full bg-destructive/10 px-3 text-[11px] font-bold text-destructive">
                            <X className="size-3" /> لغو
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startDownload(app)}
                      disabled={Boolean(task) && task!.status === 'queued'}
                      className={cn(
                        'mt-2.5 flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl bg-primary/12 py-2.5 text-[13px] font-black text-primary active:scale-[0.99]',
                        task?.status === 'queued' && 'opacity-60'
                      )}
                    >
                      {task?.status === 'queued' ? (
                        <><Hourglass className="size-4" /> در صف دانلود</>
                      ) : (
                        <><ArrowUpCircle className="size-4" /> به‌روزرسانی</>
                      )}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* نوار پایین به‌روزرسانی همه */}
      {updates.length > 0 && !hasActive && (
        <div className="fixed bottom-[76px] left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 px-4">
          <button
            onClick={startAll}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[14px] font-black text-primary-foreground shadow-xl shadow-primary/25 transition-transform active:scale-[0.98]"
          >
            <RefreshCcw className="size-4.5" />
            به‌روزرسانی همه، {faDigits(updates.length)} برنامه
          </button>
        </div>
      )}
    </div>
  )
}

function ActiveTaskCard({
  task,
  featured,
  onPause,
  onCancel,
}: {
  task: { name: string; iconColor: string; iconType: string; source: string; sizeMB: number; progress: number; speedMB: number; status: string; fromVersion: string; toVersion: string }
  featured?: boolean
  onPause: () => void
  onCancel: () => void
}) {
  return (
    <div className={cn('rounded-3xl border p-4', featured ? 'border-primary/30 bg-primary/5' : 'border-border bg-card')}>
      <div className="flex items-center gap-3">
        <AppIcon type={task.iconType} color={task.iconColor} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-black">{task.name}</p>
          <p className="num mt-0.5 text-[11px] text-muted-foreground">
            {faDigits(task.fromVersion)} ← {faDigits(task.toVersion)} • {faSize(task.sizeMB)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {task.source === 'googleplay' ? 'گوگل‌پلی' : task.source === 'bazaar' ? 'کافه‌بازار' : task.source === 'myket' ? 'مایکت' : task.source === 'github' ? 'گیت‌هاب' : 'منبع سفارشی'}
          </p>
        </div>
        {task.status === 'paused' ? (
          <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-500">متوقف</span>
        ) : task.status === 'queued' ? (
          <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">در صف</span>
        ) : (
          <span className="num text-[13px] font-black text-primary">{faDigits(Math.round(task.progress))}٪</span>
        )}
      </div>

      <div className="mt-3">
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all duration-500', task.status === 'paused' ? 'bg-amber-500' : 'bg-primary')}
            style={{ width: `${task.progress}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="num">
            {task.status === 'downloading' ? `سرعت ${faDigits(task.speedMB)} مگابایت/ثانیه — ${faDigits(Math.round(task.progress))}٪ کامل شده` : task.status === 'paused' ? 'دانلود متوقف شده است' : 'در انتظار نوبت دانلود'}
          </span>
          <span className="num">{faDigits(Math.round((task.progress / 100) * task.sizeMB))} از {faDigits(task.sizeMB)}</span>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={onPause}
          className="flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-2xl bg-foreground/8 text-[13px] font-bold active:scale-[0.98]"
        >
          {task.status === 'paused' ? <><Play className="size-4" /> ادامه</> : <><Pause className="size-4" /> توقف</>}
        </button>
        <button
          onClick={onCancel}
          className="flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-2xl bg-destructive/10 text-[13px] font-bold text-destructive active:scale-[0.98]"
        >
          <X className="size-4" /> لغو
        </button>
      </div>
    </div>
  )
}

function ActiveTaskMini({
  task,
  onPause,
  onCancel,
}: {
  task: { appId: string; name: string; iconColor: string; iconType: string; source: string; sizeMB: number; progress: number; speedMB: number; status: string }
  onPause: () => void
  onCancel: () => void
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-2.5">
        <AppIcon type={task.iconType} color={task.iconColor} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold">{task.name}</p>
          <p className="num text-[10px] text-muted-foreground">{faSize(task.sizeMB)}</p>
        </div>
        <span className={cn('num shrink-0 text-[11px] font-black', task.status === 'paused' ? 'text-amber-500' : 'text-primary')}>
          {faDigits(Math.round(task.progress))}٪
        </span>
        {task.status !== 'queued' ? (
          <button onClick={onPause} aria-label="توقف" className="flex min-h-[34px] items-center rounded-full bg-muted px-3 text-[11px] font-bold">
            {task.status === 'paused' ? <Play className="size-3" /> : <Pause className="size-3" />}
            {task.status === 'paused' ? 'ادامه' : 'توقف'}
          </button>
        ) : (
          <button onClick={onCancel} aria-label="لغو" className="flex min-h-[34px] items-center rounded-full bg-muted px-3 text-[11px] font-bold">
            <X className="size-3" /> لغو
          </button>
        )}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-500', task.status === 'paused' ? 'bg-amber-500' : 'bg-primary')}
          style={{ width: `${task.progress}%` }}
        />
      </div>
    </div>
  )
}
