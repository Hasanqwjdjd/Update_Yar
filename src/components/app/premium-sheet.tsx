'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Crown, Check, Zap, ShieldOff, RefreshCcw, Gauge, Loader2, PartyPopper, Landmark, Wallet, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { faDigits, faNumber } from '@/lib/persian'
import { useAppStore } from '@/lib/store'
import { activatePremium } from '@/lib/local-db'

const PLANS = [
  { key: 'monthly' as const, label: 'ماهانه', price: 19000, note: 'یک ماه دسترسی کامل', discount: null as string | null },
  { key: 'yearly' as const, label: 'سالانه', price: 149000, note: 'معادل ۱۲٬۴۰۰ تومان در ماه', discount: '۳۵٪ تخفیف' },
  { key: 'lifetime' as const, label: 'مادام‌العمر', price: 349000, note: 'یک بار پرداخت، همیشه فعال', discount: 'بهترین انتخاب' },
]

const FEATURES = [
  { icon: ShieldOff, text: 'حذف کامل تبلیغات' },
  { icon: RefreshCcw, text: 'بررسی خودکار آپدیت‌ها هر ۶ ساعت' },
  { icon: Gauge, text: 'صف دانلود بدون محدودیت (۵ دانلود همزمان)' },
  { icon: Zap, text: 'اولویت دریافت آپدیت‌های گیت‌هاب' },
]

const GATEWAYS = [
  { key: 'zarinpal', label: 'زرین‌پال', icon: CreditCard },
  { key: 'idpay', label: 'آیدی‌پی', icon: Wallet },
  { key: 'card', label: 'کارت مستقیم', icon: Landmark },
]

export function PremiumSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const updateSettings = useAppStore((s) => s.updateSettings)
  const isPremium = useAppStore((s) => s.settings?.isPremium ?? false)
  const showToast = useAppStore((s) => s.showToast)
  const [step, setStep] = useState<'plans' | 'gateway' | 'processing' | 'done'>('plans')
  const [plan, setPlan] = useState<(typeof PLANS)[number]>(PLANS[1])
  const [gateway, setGateway] = useState('zarinpal')

  const start = () => {
    setStep('processing')
    setTimeout(async () => {
      try {
        await updateSettings({ isPremium: true, premiumPlan: plan.key })
        activatePremium(plan.key)
      } catch { /* noop */ }
      setStep('done')
      showToast('اشتراک ویژه فعال شد! 🎉')
    }, 2200)
  }

  const reset = () => {
    onOpenChange(false)
    setTimeout(() => setStep('plans'), 400)
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setTimeout(() => setStep('plans'), 400) }}>
      <SheetContent side="bottom" className="mx-auto max-w-[430px] rounded-t-3xl border-border bg-card px-0 pt-2 pb-8 [&>button]:left-4 [&>button]:right-auto">
        <SheetHeader className="px-5 pb-2 text-right">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Crown className="size-5 text-primary" />
            آپدیت‌یار ویژه
          </SheetTitle>
          <SheetDescription>
            {isPremium && step === 'plans' ? 'اشتراک شما فعال است. از حمایت شما سپاسگزاریم!' : 'از تمام امکانات بدون محدودیت استفاده کنید'}
          </SheetDescription>
        </SheetHeader>

        {step === 'plans' && (
          <div className="max-h-[60vh] overflow-y-auto px-5 pb-4">
            {isPremium && (
              <div className="mb-3 flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-3">
                <PartyPopper className="size-5 text-primary" />
                <p className="text-[12px] font-bold text-primary">اشتراک ویژه شما فعال است</p>
              </div>
            )}
            <div className="space-y-2">
              {FEATURES.map((f) => (
                <div key={f.text} className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/12">
                    <f.icon className="size-4 text-primary" />
                  </div>
                  <p className="text-[13px]">{f.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {PLANS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPlan(p)}
                  className={cn(
                    'relative rounded-2xl border p-3 text-center transition-all',
                    plan.key === p.key
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-border bg-background/50'
                  )}
                >
                  {p.discount && (
                    <span className="absolute -top-2 right-1/2 translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2 py-px text-[9px] font-bold text-primary-foreground">
                      {p.discount}
                    </span>
                  )}
                  <p className="text-[13px] font-bold">{p.label}</p>
                  <p className="mt-1 text-[13px] font-black text-primary num">{faNumber(p.price)}</p>
                  <p className="text-[9px] text-muted-foreground">تومان</p>
                </button>
              ))}
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">{plan.note}</p>

            <button
              onClick={() => (isPremium ? reset() : setStep('gateway'))}
              className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-black text-primary-foreground transition-transform active:scale-[0.98]"
            >
              <Crown className="size-5" />
              {isPremium ? 'بستن' : `خرید اشتراک ${plan.label} — ${faNumber(plan.price)} تومان`}
            </button>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              پرداخت امن از طریق درگاه‌های رسمی • امکان لغو در هر زمان
            </p>
          </div>
        )}

        {step === 'gateway' && (
          <div className="max-h-[60vh] overflow-y-auto px-5 pb-4">
            <button onClick={() => setStep('plans')} className="mb-3 text-xs text-primary">→ بازگشت به پلن‌ها</button>
            <div className="space-y-2">
              {GATEWAYS.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setGateway(g.key)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl border p-3.5 transition-all',
                    gateway === g.key ? 'border-primary bg-primary/10 ring-2 ring-primary/30' : 'border-border bg-background/50'
                  )}
                >
                  <g.icon className="size-5 text-foreground" />
                  <span className="flex-1 text-right text-[14px] font-bold">{g.label}</span>
                  {gateway === g.key && <Check className="size-5 text-primary" />}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-muted p-3.5">
              <span className="text-[13px] text-muted-foreground">مبلغ قابل پرداخت</span>
              <span className="text-[15px] font-black num">{faNumber(plan.price)} تومان</span>
            </div>
            <button
              onClick={start}
              className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-black text-primary-foreground active:scale-[0.98]"
            >
              پرداخت {faNumber(plan.price)} تومان
            </button>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center gap-4 px-5 py-12">
            <div className="relative">
              <Loader2 className="size-12 animate-spin text-primary" />
            </div>
            <p className="text-[15px] font-bold">در حال اتصال به درگاه {GATEWAYS.find((g) => g.key === gateway)?.label}...</p>
            <p className="text-[12px] text-muted-foreground">لطفاً صفحه را ببندید یا رفرش نکنید</p>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center gap-3 px-5 py-10">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/15">
              <PartyPopper className="size-8 text-primary" />
            </div>
            <p className="text-lg font-black">پرداخت موفق بود!</p>
            <p className="text-center text-[13px] text-muted-foreground">
              اشتراک {plan.label} آپدیت‌یار ویژه فعال شد.
              <br />
              فاکتور به شماره {faDigits(Math.floor(100000 + Math.random() * 899999))} ثبت گردید.
            </p>
            <button
              onClick={reset}
              className="mt-2 min-h-[44px] w-full rounded-2xl bg-primary text-[15px] font-black text-primary-foreground"
            >
              عالیه! بستن
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
