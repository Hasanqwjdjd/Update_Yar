'use client'

import { Home, RefreshCcw, Github, Settings2, History } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { faDigits } from '@/lib/persian'

export function BottomNav() {
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const apps = useAppStore((s) => s.apps)
  const downloads = useAppStore((s) => s.downloads)

  const updateCount = apps.filter((a) => a.newVersion).length
  const activeDownloads = Object.values(downloads).filter((d) => d.status !== 'paused').length

  const items = [
    { key: 'home' as const, label: 'خانه', icon: Home, badge: 0 },
    { key: 'updates' as const, label: 'به‌روزرسانی‌ها', icon: RefreshCcw, badge: updateCount + activeDownloads },
    { key: 'github' as const, label: 'گیت‌هاب', icon: Github, badge: 0 },
    { key: 'history' as const, label: 'تاریخچه', icon: History, badge: 0 },
    { key: 'settings' as const, label: 'تنظیمات', icon: Settings2, badge: 0 },
  ]

  return (
    <nav
      aria-label="ناوبری اصلی"
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-popover/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
    >
      <div className="flex items-stretch justify-around px-1 pt-1.5 pb-1.5">
        {items.map((item) => {
          const active = view === item.key
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex min-h-[52px] min-w-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="relative">
                <item.icon className="size-[22px]" strokeWidth={active ? 2.4 : 2} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -left-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
                    {faDigits(item.badge > 99 ? '99+' : item.badge)}
                  </span>
                )}
              </span>
              <span className={cn('text-[10px] leading-none', active && 'font-bold')}>
                {item.label}
              </span>
              {active && (
                <span className="absolute -top-1.5 h-1 w-8 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
