'use client'

import { useEffect, useState } from 'react'
import { Megaphone, X, BadgePercent } from 'lucide-react'
import { listAds } from '@/lib/local-db'
import type { AdItemT } from '@/lib/types'
import { cn } from '@/lib/utils'

/** بنر تبلیغاتی پایین صفحه — با نسخه ویژه حذف می‌شود */
export function AdBanner({ isPremium, hidden = false }: { isPremium: boolean; hidden?: boolean }) {
  const [ad, setAd] = useState<AdItemT | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    if (isPremium) return
    const load = () => {
      const ads = listAds()
      const banners = ads.filter((a) => a.placement === 'banner')
      if (banners.length) setAd(banners[Math.floor(Math.random() * banners.length)])
    }
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [isPremium])

  if (isPremium || dismissed || closed || !ad || hidden) return null

  return (
    <div className="fixed bottom-[76px] left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 px-3">
      <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-lg">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
          <Megaphone className="size-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[13px] font-bold">{ad.title}</p>
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">تبلیغ</span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">{ad.description}</p>
        </div>
        <button
          onClick={() => setClosed(true)}
          className="min-h-[36px] shrink-0 rounded-full bg-primary px-3.5 text-[12px] font-bold text-primary-foreground active:scale-95"
        >
          {ad.ctaText}
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="بستن تبلیغ"
          className="absolute top-1.5 left-1.5 rounded-full bg-muted/80 p-1 text-muted-foreground"
        >
          <X className="size-3" />
        </button>
      </div>
    </div>
  )
}

/** کارت تبلیغ بومی داخل فید */
export function FeedAdCard({ ad }: { ad: AdItemT }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {ad.imageUrl && (
        
        <img src={ad.imageUrl} alt={ad.title} className="h-28 w-full object-cover" loading="lazy" />
      )}
      <div className="flex items-center gap-3 p-3">
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', ad.color === 'orange' ? 'bg-orange-500/15' : 'bg-primary/15')}>
          <BadgePercent className={cn('size-5', ad.color === 'orange' ? 'text-orange-500' : 'text-primary')} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[13px] font-bold">{ad.title}</p>
            <span className="shrink-0 rounded bg-muted px-1 py-px text-[9px] text-muted-foreground">تبلیغ</span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">{ad.description}</p>
        </div>
        <button className="min-h-[36px] shrink-0 rounded-full bg-foreground/10 px-3.5 text-[12px] font-bold hover:bg-foreground/15">
          {ad.ctaText}
        </button>
      </div>
    </div>
  )
}
