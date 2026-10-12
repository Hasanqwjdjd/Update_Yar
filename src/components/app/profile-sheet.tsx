'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Crown, HeartHandshake, Users, Info, ChevronLeft, Sparkles, ShieldCheck, Github, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { faDigits, faNumber } from '@/lib/persian'
import { listSupporters } from '@/lib/local-db'
import type { SupporterItem } from '@/lib/types'

const TIER_LABELS: Record<string, string> = {
  gold: 'طلایی', silver: 'نقره‌ای', bronze: 'برنزی', 'one-time': 'حمایت یکباره',
}

export function ProfileSheet({
  open,
  onOpenChange,
  isPremium,
  supporterTier,
  onOpenPremium,
  onOpenSupport,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  isPremium: boolean
  supporterTier: string | null
  onOpenPremium: () => void
  onOpenSupport: () => void
}) {
  const [showSupporters, setShowSupporters] = useState(false)
  const [supporters, setSupporters] = useState<SupporterItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && showSupporters && supporters.length === 0) {
      const t = setTimeout(() => {
        setSupporters(listSupporters())
        setLoading(false)
      }, 0)
      return () => clearTimeout(t)
    }
  }, [open, showSupporters, supporters.length])

  const totalSupport = supporters.reduce((sum, s) => sum + s.amount, 0)

  const items = [
    {
      icon: Crown,
      title: 'اشتراک ویژه آپدیت‌یار',
      desc: isPremium ? 'فعال است — بدون تبلیغ و با امکانات ویژه' : 'حذف تبلیغات، آپدیت خودکار و سرعت بالاتر',
      badge: isPremium ? 'ویژه' : undefined,
      onClick: onOpenPremium,
    },
    {
      icon: HeartHandshake,
      title: 'حمایت مالی از توسعه‌دهنده',
      desc: supporterTier ? `سطح حمایت شما: ${TIER_LABELS[supporterTier] ?? supporterTier}` : 'با حمایت شما، آپدیت‌یار همیشه فعال می‌ماند',
      onClick: onOpenSupport,
    },
    {
      icon: Users,
      title: 'دیوار حامیان',
      desc: `${supporters.length ? faDigits(supporters.length) + ' نفر' : 'لیست'} حمایت‌کننده تاکنون${supporters.length ? ` — ${faNumber(totalSupport)} تومان` : ''}`,
      onClick: () => setShowSupporters(true),
    },
    {
      icon: Info,
      title: 'درباره آپدیت‌یار',
      desc: 'نسخه ۱.۳.۱ — ساخته‌شده با ❤️ برای جامعه فارسی‌زبان',
      onClick: () => {},
    },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-[430px] rounded-t-3xl border-border bg-card px-0 pt-2 pb-8 [&>button]:left-4 [&>button]:right-auto">
        <SheetHeader className="px-5 pb-2 text-right">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-primary" />
            حساب کاربری
          </SheetTitle>
          <SheetDescription>مدیریت اشتراک، حمایت و اطلاعات برنامه</SheetDescription>
        </SheetHeader>

        {showSupporters ? (
          <div className="max-h-[60vh] overflow-y-auto px-5 pb-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold">دیوار حامیان</h3>
              <button onClick={() => setShowSupporters(false)} className="text-xs text-primary">بازگشت</button>
            </div>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-2">
                {supporters.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 p-3">
                    <div className={cn(
                      'flex size-10 items-center justify-center rounded-xl text-white',
                      s.tier === 'gold' && 'bg-amber-500', s.tier === 'silver' && 'bg-slate-400',
                      s.tier === 'bronze' && 'bg-amber-700', s.tier === 'one-time' && 'bg-primary'
                    )}>
                      <HeartHandshake className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{s.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {TIER_LABELS[s.tier] ?? s.tier} — {faNumber(s.amount)} تومان
                        {s.message ? ` — «${s.message}»` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-h-[65vh] space-y-2 overflow-y-auto px-5 pb-4">
            {items.map((item) => (
              <button
                key={item.title}
                onClick={item.onClick}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background/50 p-3.5 text-right transition-colors hover:bg-background/80"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12">
                  <item.icon className="size-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[14px] font-bold">{item.title}</p>
                    {item.badge && (
                      <span className="shrink-0 rounded-full bg-primary px-2 py-px text-[10px] font-bold text-primary-foreground">{item.badge}</span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/50 p-3.5">
              <ShieldCheck className="size-5 shrink-0 text-primary" />
              <p className="text-[11px] leading-5 text-muted-foreground">
                آپدیت‌یار هیچ اطلاعات شخصی جمع‌آوری نمی‌کند. تمام پرداخت‌ها از طریق درگاه‌های رسمی
                (زرین‌پال / آیدی‌پی) انجام می‌شود.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/50 p-3.5">
              <Github className="size-5 shrink-0 text-foreground" />
              <p className="text-[11px] text-muted-foreground">سورس کامل پروژه در گیت‌هاب منتشر می‌شود.</p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
