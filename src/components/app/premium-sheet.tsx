'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Crown, Check, Zap, RefreshCcw, Gauge, Loader2, PartyPopper, ExternalLink, AlertTriangle, ReceiptText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { faDigits, faNumber } from '@/lib/persian'
import { useAppStore } from '@/lib/store'
import { isPremiumActive } from '@/lib/local-db'
import {
  startDonitoPayment, confirmDonitoPayment, cancelPendingPayment,
  getPendingPayment,
} from '@/lib/payment'

const PLANS = [
  { key: 'monthly' as const, label: 'ماهانه', price: 19000, note: 'یک ماه دسترسی کامل', discount: null as string | null },
  { key: 'yearly' as const, label: 'سالانه', price: 149000, note: 'معادل ۱۲٬۴۰۰ تومان در ماه', discount: '۳۵٪ تخفیف' },
  { key: 'lifetime' as const, label: 'مادام‌العمر', price: 349000, note: 'یک بار پرداخت، همیشه فعال', discount: 'بهترین انتخاب' },
]

const FEATURES = [
  { icon: Zap, text: 'بررسی خودکار آپدیت‌ها هر ۶ ساعت' },
  { icon: RefreshCcw, text: 'اولویت دریافت آپدیت‌های گیت‌هاب' },
  { icon: Gauge, text: 'نمایش چنج‌لاگ کامل و پیش‌نمایش ریلیزها' },
  { icon: Check, text: 'پشتیبانی از انتشارهای نسخه‌های آینده بدون محدودیت' },
]

type Step = 'plans' | 'confirm' | 'done'

export function PremiumSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const settings = useAppStore((s) => s.settings)
  const refreshSettings = useAppStore((s) => s.refreshSettings)
  const showToast = useAppStore((s) => s.showToast)
  const paymentDone = useAppStore((s) => s.paymentDone)
  const clearPaymentDone = useAppStore((s) => s.clearPaymentDone)
  const isPremium = isPremiumActive(settings)

  const [step, setStep] = useState<Step>('plans')
  const [plan, setPlan] = useState<(typeof PLANS)[number]>(PLANS[1])
  const [busy, setBusy] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [refId, setRefId] = useState('')

  // اگر پرداخت قبلاً در انتظار است (کاربر از درگاه برگشته) → مستقیم به مرحله‌ی رسید
  useEffect(() => {
    if (open && step === 'plans' && getPendingPayment()) {
      const t = setTimeout(() => setStep('confirm'), 0)
      return () => clearTimeout(t)
    }
  }, [open, step])

  const reset = () => {
    onOpenChange(false)
    setTimeout(() => { setStep('plans'); setPayError(null); setRefId('') }, 400)
  }

  const beginPay = async () => {
    setBusy(true)
    setPayError(null)
    const res = await startDonitoPayment({
      amountToman: plan.price,
      description: `خرید اشتراک ${plan.label} آپدیت‌یار ویژه`,
      kind: 'premium',
      plan: plan.key,
    })
    setBusy(false)
    if (res.ok) {
      setStep('confirm')
    } else {
      setPayError(res.error)
      showToast(res.error)
    }
  }

  const confirmPay = () => {
    setBusy(true)
    setPayError(null)
    const r = confirmDonitoPayment(refId)
    setBusy(false)
    if (r.ok && r.done) {
      refreshSettings()
      useAppStore.getState().setPaymentDone(r.done)
      setStep('done')
    } else {
      setPayError(r.error ?? 'تأیید پرداخت ناموفق بود')
    }
  }

  const abandonPayment = () => {
    cancelPendingPayment()
    setStep('plans')
    setRefId('')
    showToast('پرداخت لغو شد')
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setTimeout(() => { setStep('plans'); setPayError(null); setRefId('') }, 400) }}>
      <SheetContent side="bottom" className="mx-auto max-w-[430px] rounded-t-3xl border-border bg-card px-0 pt-2 pb-8 [&>button]:left-4 [&>button]:right-auto">
        <SheetHeader className="px-5 pb-2 text-right">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Crown className="size-5 text-primary" />
            آپدیت‌یار ویژه
          </SheetTitle>
          <SheetDescription>
            {isPremium ? 'اشتراک شما فعال است. از حمایت شما سپاسگزاریم!' : 'از تمام امکانات بدون محدودیت استفاده کنید'}
          </SheetDescription>
        </SheetHeader>

        {step === 'plans' && (
          <div className="max-h-[60vh] overflow-y-auto px-5 pb-4">
            {isPremium && (
              <div className="mb-3 flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-3">
                <PartyPopper className="size-5 text-primary" />
                <p className="text-[12px] font-bold text-primary">
                  اشتراک ویژه شما فعال است
                  {settings?.premiumUntil && <> تا <span className="num">{faDigits(new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(settings.premiumUntil)))}</span></>}
                </p>
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
              onClick={() => { if (!isPremium) void beginPay() }}
              disabled={busy}
              className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-black text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-5 animate-spin" /> : <ExternalLink className="size-5" />}
              {busy ? 'در حال باز کردن درگاه...' : `خرید اشتراک ${plan.label} — ${faNumber(plan.price)} تومان`}
            </button>
            <p className="mt-2 text-center text-[10px] leading-4 text-muted-foreground">
              پرداخت آنلاین از طریق درگاه رسمی برنامه انجام و مستقیماً به حساب توسعه‌دهنده واریز می‌شود.
            </p>
          </div>
        )}

        {step === 'confirm' && (
          <div className="max-h-[60vh] overflow-y-auto px-5 pb-4">
            <div className="mb-3 flex items-start gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-3">
              <ReceiptText className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-[11px] leading-5 text-foreground/80">
                صفحه‌ی درگاه باز شد. مبلغ <b className="num">{faNumber(plan.price)} تومان</b> را پرداخت کنید
                («درگاه پرداخت دونیتو»). سپس به این صفحه برگردید و <b>شماره رسید/پیگیری</b> که در درگاه
                دریافت کردید را در کادر زیر وارد کنید تا اشتراک فوراً فعال شود.
              </p>
            </div>
            <button
              onClick={() => void beginPay()}
              className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-border bg-background/50 py-2.5 text-[12px] font-bold text-primary"
            >
              <ExternalLink className="size-4" />
              صفحه‌ی درگاه باز نشد؟ دوباره باز کن
            </button>

            <input
              inputMode="numeric"
              value={refId}
              onChange={(e) => { setRefId(e.target.value); setPayError(null) }}
              placeholder="شماره رسید / پیگیری پرداخت"
              dir="ltr"
              className="w-full rounded-2xl border border-border bg-background/60 px-4 py-3 text-left text-[13px] outline-none focus:ring-2 focus:ring-primary/40"
            />
            {payError && (
              <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-destructive/10 p-2.5 text-[11px] leading-5 text-destructive">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                {payError}
              </p>
            )}
            <button
              onClick={confirmPay}
              disabled={busy || refId.trim().length < 4}
              className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[14px] font-black text-primary-foreground disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              ثبت رسید و فعال‌سازی اشتراک
            </button>
            <button
              onClick={abandonPayment}
              className="mt-2 min-h-[40px] w-full rounded-2xl text-[12px] font-bold text-muted-foreground"
            >
              انصراف از پرداخت
            </button>
          </div>
        )}

        {step === 'done' && paymentDone?.kind === 'premium' && (
          <div className="flex flex-col items-center gap-3 px-5 py-10">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/15">
              <PartyPopper className="size-8 text-primary" />
            </div>
            <p className="text-lg font-black">پرداخت موفق و تأیید شد!</p>
            <p className="text-center text-[13px] leading-6 text-muted-foreground">
              اشتراک <b>{PLANS.find((p) => p.key === paymentDone.plan)?.label ?? ''}</b> آپدیت‌یار ویژه فعال شد.
              <br />
              شماره رسید درگاه: <b className="num">{faDigits(paymentDone.refId)}</b>
            </p>
            <button
              onClick={() => { clearPaymentDone(); reset() }}
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
