'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Crown, HeartHandshake, Users, Info, ChevronLeft, Sparkles, ShieldCheck, Github, ExternalLink, ReceiptText, Mail } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { faDigits, faNumber } from '@/lib/persian'
import { listSupporters, listPayments } from '@/lib/local-db'
import { openExternal } from '@/lib/native'
import { APP_VERSION, REPO_URL, SUPPORT_EMAIL } from '@/lib/config'
import type { SupporterItem, PaymentRecord } from '@/lib/types'

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
  const [aboutOpen, setAboutOpen] = useState(false)
  const [payments, setPayments] = useState<PaymentRecord[]>([])

  useEffect(() => {
    if (open && showSupporters && supporters.length === 0) {
      const t = setTimeout(() => setSupporters(listSupporters()), 0)
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
      desc: supporters.length
        ? `${faDigits(supporters.length)} حامی — ${faNumber(totalSupport)} تومان`
        : 'هنوز حامیانی نیستند — اولین نفر باشید',
      onClick: () => {
        setSupporters(listSupporters())
        setShowSupporters(true)
      },
    },
    {
      icon: ReceiptText,
      title: 'رسیدهای پرداخت من',
      desc: payments.length ? `${faDigits(payments.length)} پرداخت تأییدشده` : 'پرداختی ثبت نشده است',
      onClick: () => setAboutOpen(true),
    },
    {
      icon: Info,
      title: 'درباره آپدیت‌یار',
      desc: `نسخه ${faDigits(APP_VERSION)} — ساخته‌شده با ❤️ برای جامعه فارسی‌زبان`,
      onClick: () => setAboutOpen(true),
    },
  ]

  // باز شدن شیت → خواندن رسیدها
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setPayments(listPayments()), 0)
      return () => clearTimeout(t)
    }
  }, [open])

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
            {supporters.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <HeartHandshake className="size-8 text-muted-foreground/40" />
                <p className="text-[13px] font-bold">هنوز حامیانی نیستند</p>
                <p className="max-w-[240px] text-[11px] leading-5 text-muted-foreground">
                  حمایت‌های واقعی (پس از تأیید درگاه) همراه با نام حامی در همین‌جا نمایش داده می‌شود
                </p>
                <button
                  onClick={() => { setShowSupporters(false); onOpenSupport() }}
                  className="mt-1 flex min-h-[40px] items-center gap-2 rounded-full bg-primary px-5 text-[12px] font-black text-primary-foreground"
                >
                  <HeartHandshake className="size-4" />
                  اولین حامی باشم
                </button>
              </div>
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
                آپدیت‌یار هیچ اطلاعات شخصی جمع‌آوری نمی‌کند. پرداخت‌ها فقط از طریق درگاه رسمی
                زارین‌پال انجام و پس از تأیید درگاه فعال می‌شوند.
              </p>
            </div>
            <button
              onClick={() => { void openExternal(REPO_URL) }}
              className="flex w-full items-center gap-2 rounded-2xl border border-border bg-background/50 p-3.5 text-right"
            >
              <Github className="size-5 shrink-0 text-foreground" />
              <p className="min-w-0 flex-1 text-[11px] leading-5 text-muted-foreground">
                سورس کامل پروژه در گیت‌هاب — <span dir="ltr">Hasanqwjdjd/Hasan-Vpn</span>
              </p>
              <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* دیالوگ درباره + رسیدها */}
        <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
          <DialogContent className="max-w-[380px] rounded-3xl border-border bg-card" dir="rtl">
            <DialogHeader className="items-start text-right">
              <DialogTitle className="flex items-center gap-2 text-[16px]">
                <Info className="size-5 text-primary" />
                درباره آپدیت‌یار
              </DialogTitle>
              <DialogDescription className="text-right text-[12px] leading-6">
                نسخه {faDigits(APP_VERSION)} — مدیریت هوشمند آپدیت برنامه‌ها، کاملاً آفلاین.
                همه‌ی داده‌ها فقط روی همین گوشی ذخیره می‌شوند.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <p className="text-[12px] font-bold text-muted-foreground">رسیدهای پرداخت تأییدشده</p>
              {payments.length === 0 ? (
                <p className="rounded-2xl border border-border bg-background/50 p-3 text-[11px] text-muted-foreground">هنوز پرداختی تأیید نشده است.</p>
              ) : (
                payments.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-border bg-background/50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-bold">
                        {r.kind === 'premium' ? `اشتراک ویژه (${r.plan === 'monthly' ? 'ماهانه' : r.plan === 'yearly' ? 'سالانه' : 'مادام‌العمر'})` : 'حمایت مالی'}
                      </p>
                      <p className="num text-[12px] font-black text-primary">{faNumber(r.amountToman)} تومان</p>
                    </div>
                    <p className="num mt-1 text-[10px] text-muted-foreground">
                      رهگیری: {faDigits(r.refId)} • {faDigits(new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short' }).format(new Date(r.date)))}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 border-t border-border pt-3">
              <button
                onClick={() => { void openExternal(`mailto:${SUPPORT_EMAIL}`) }}
                className="flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-2xl border border-border text-[12px] font-bold"
              >
                <Mail className="size-4" />
                ایمیل به پشتیبانی
              </button>
              <button
                onClick={() => { void openExternal(REPO_URL) }}
                className="flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-[12px] font-black text-primary-foreground"
              >
                <Github className="size-4" />
                سورس پروژه
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  )
}
