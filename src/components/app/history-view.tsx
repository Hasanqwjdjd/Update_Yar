'use client'

import { useMemo, useState } from 'react'
import { Search, User, CheckCircle2, XCircle, Filter, FileDown } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { AppIcon } from './app-icon'
import { faDigits, faSize, faTime, faJalaliDate } from '@/lib/persian'
import { cn } from '@/lib/utils'
import type { HistoryItem } from '@/lib/types'

const SOURCE_NAME: Record<string, string> = {
  googleplay: 'گوگل‌پلی', bazaar: 'کافه‌بازار', myket: 'مایکت', github: 'گیت‌هاب', system: 'سیستمی', custom: 'منبع سفارشی',
}

function groupHistory(history: HistoryItem[]) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const groups: Array<{ title: string; items: HistoryItem[] }> = [
    { title: 'این هفته', items: [] },
    { title: 'هفته گذشته', items: [] },
    { title: 'قدیمی‌تر', items: [] },
  ]
  for (const h of history) {
    const d = new Date(h.date).getTime()
    const daysAgo = Math.floor((startOfToday - new Date(new Date(h.date).getFullYear(), new Date(h.date).getMonth(), new Date(h.date).getDate()).getTime()) / 86400000)
    if (daysAgo < 7 || (startOfToday - d) < 7 * 86400000) groups[0].items.push(h)
    else if (daysAgo < 14) groups[1].items.push(h)
    else groups[2].items.push(h)
  }
  return groups.filter((g) => g.items.length > 0)
}

export function HistoryView({ onOpenProfile }: { onOpenProfile: () => void }) {
  const history = useAppStore((s) => s.history)
  const showToast = useAppStore((s) => s.showToast)
  const [statusFilter, setFilter] = useState<'all' | 'completed' | 'failed'>('all')
  const [query, setQuery] = useState('')
  const [showFilter, setShowFilter] = useState(false)

  const filtered = useMemo(() => {
    let list = history
    if (statusFilter !== 'all') list = list.filter((h) => h.status === statusFilter)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((h) => h.appName.toLowerCase().includes(q))
    }
    return list
  }, [history, statusFilter, query])

  const groups = useMemo(() => groupHistory(filtered), [filtered])

  const exportReport = () => {
    try {
      const lines = filtered.map((h) => `${h.appName}: ${h.fromVersion} → ${h.toVersion} (${SOURCE_NAME[h.source] ?? h.source}) - ${h.status === 'completed' ? 'موفق' : 'ناموفق'} - ${faJalaliDate(h.date)}`)
      const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'updateyar-report.csv'
      a.click()
      URL.revokeObjectURL(url)
      showToast('گزارش تاریخچه دانلود شد')
    } catch {
      showToast('خروجی گرفتن ناموفق بود')
    }
  }

  return (
    <div className="flex min-h-full flex-col pb-28">
      {/* هدر */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 px-4 pt-3 pb-2 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="w-9" />
          <h1 className="text-[19px] font-black">تاریخچه آپدیت‌ها</h1>
          <div className="flex items-center gap-1">
            <button onClick={exportReport} aria-label="خروجی گرفتن گزارش" className="flex size-10 items-center justify-center rounded-full text-foreground/80 hover:bg-muted">
              <FileDown className="size-[21px]" />
            </button>
            <button onClick={onOpenProfile} aria-label="حساب کاربری" className="flex size-10 items-center justify-center rounded-full text-foreground/80 hover:bg-muted">
              <User className="size-[22px]" />
            </button>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجو در تاریخچه..."
              className="min-h-[42px] w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={() => setShowFilter((v) => !v)}
            aria-label="فیلتر وضعیت"
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card',
              statusFilter !== 'all' && 'border-primary text-primary'
            )}
          >
            <Filter className="size-4.5" />
          </button>
        </div>

        {showFilter && (
          <div className="mt-2 flex gap-2">
            {([
              { key: 'all', label: 'همه' },
              { key: 'completed', label: 'موفق' },
              { key: 'failed', label: 'ناموفق' },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'min-h-[34px] rounded-full border px-3.5 text-[12px] font-bold',
                  statusFilter === f.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <section aria-label="تاریخچه" className="flex-1 px-4 pt-3">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Search className="size-8 text-muted-foreground/50" />
            <p className="text-[14px] font-bold">تاریخچه‌ای پیدا نشد</p>
            <p className="text-[12px] text-muted-foreground">بعد از اولین آپدیت، اینجا نمایش داده می‌شود</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.title} className="mb-5">
              <h2 className="mb-2 text-[13px] font-bold text-muted-foreground">{group.title}</h2>
              <div className="space-y-2">
                {group.items.map((h) => (
                  <div key={h.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
                    <AppIcon type={h.iconType} color={h.iconColor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[13px] font-bold">{h.appName}</p>
                        <span className={cn(
                          'shrink-0 rounded-full px-1.5 py-px text-[9px] font-bold',
                          h.status === 'completed' ? 'bg-primary/12 text-primary' : 'bg-destructive/12 text-destructive'
                        )}>
                          {SOURCE_NAME[h.source] ?? h.source}
                        </span>
                      </div>
                      <p className="num mt-0.5 text-[10.5px] text-muted-foreground">
                        {faDigits(h.fromVersion)} ← {faDigits(h.toVersion)} • {faSize(h.sizeMB)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {h.status === 'completed' ? (
                        <CheckCircle2 className="size-5 text-primary" />
                      ) : (
                        <XCircle className="size-5 text-destructive" />
                      )}
                      <span className="num text-[9.5px] text-muted-foreground">
                        {faTime(h.date)} • {faJalaliDate(h.date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
