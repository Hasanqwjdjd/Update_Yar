'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Crown, Check, Zap, RefreshCcw, Gauge, Loader2, PartyPopper, KeyRound, ExternalLink, AlertTriangle, Hourglass } from 'lucide-react'
import { cn } from '@/lib/utils'
import { faDigits, faNumber } from '@/lib/persian'
import { useAppStore } from '@/lib/store'
import { updateSettings, isPremiumActive } from '@/lib/local-db'
import {
  startZarinpalPayment, checkPendingPayment, cancelPendingPayment,
  hasPendingPayment,
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

type Step = 'plans' | 'merchant' | 'waiting' | 'done'

export function PremiumSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const settings = useAppStore((s) => s.settings)
  const updateSettingsStore = useAppStore((s) => s.updateSettings)
  const refreshSettings = useAppStore((s) => s.refreshSettings)
  const showToast = useAppStore((s) => s.showToast)
  const paymentDone = useAppStore((s) => s.paymentDone)
  const clearPaymentDone = useAppStore((s) => s.clearPaymentDone)
  const isPremium = isPremiumActive(settings)

  const [step, setStep] = useState<Step>('plans')
  const [plan, setPlan] = useState<(typeof PLANS)[number]>(PLANS[1])
  const [merchant, setMerchant] = useState(settings?.zarinpalMerchant ?? '')
  const [busy, setBusy] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  // اگر پرداخت از سر گرفته شد (کاربر از درگاه برگشت) → نمایش رسید
  useEffect(() => {
    if (paymentDone?.kind === 'premium') {
      const t = setTimeout(() => setStep('done'), 0)
      return () => clearTimeout(t)
    }
  }, [paymentDone])

  // اگر پرداخت در انتظار وجود دارد و کاربر برگشته → بررسی
  useEffect(() => {
    if (open && step === 'plans' && hasPendingPayment() && document.visibilityState === 'visible') {
      void (async () => {
        const r = await checkPendingPayment()
        if (r.ok && r.done) {
          refreshSettings()
          useAppStore.getState().setPaymentDone(r.done)
        }
      })()
    }
  }, [open, step, refreshSettings])

  const reset = () => {
    onOpenChange(false)
    setTimeout(() => { setStep('plans'); setPayError(null) }, 400)
  }

  const saveMerchant = async () => {
    const v = merchant.trim()
    if (v.length < 20) {
      showToast('کد مرچنت معتبر نیست (معمولاً یک رشته‌ی طولانی مثل a1b2c3... است)')
      return
    }
    await updateSettingsStore({ zarinpalMerchant: v })
    refreshSettings()
    setStep('plans')
    void beginPay()
  }

  const beginPay = async () => {
    const m = useAppStore.getState().settings?.zarinpalMerchant ?? ''
    if (!m) {
      setStep('merchant')
      return
    }
    setBusy(true)
    setPayError(null)
    const res = await startZarinpalPayment({
      merchantId: m,
      amountToman: plan.price,
      description: `خرید اشتراک ${plan.label} آپدیت‌یار ویژه`,
      kind: 'premium',
      plan: plan.key,
    })
    setBusy(false)
    if (res.ok) {
      setStep('waiting')
    } else {
      setPayError(res.error)
      showToast(res.error)
    }
  }

  const manualCheck = async () => {
    setBusy(true)
    const r = await checkPendingPayment()
    setBusy(false)
    if (r.ok && r.done) {
      refreshSettings()
      useAppStore.getState().setPaymentDone(r.done)
      setStep('done')
    } else if (r.error === 'none') {
      showToast('پرداختی در انتظار بررسی نیست')
      setStep('plans')
    } else {
      showToast('هنوز پرداختی ثبت نشده — در صفحه زارین‌پال پرداخت را کامل کنید')
    }
  }

  const abandonPayment = () => {
    cancelPendingPayment()
    setStep('plans')
    showToast('پرداخت لغو شد')
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setTimeout(() => { setStep('plans'); setPayError(null) }, 400) }}>
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
              {busy ? <Loader2 className="size-5 animate-spin" /> : <Crown className="size-5" />}
              {busy ? 'در حال اتصال به درگاه...' : `خرید اشتراک ${plan.label} — ${faNumber(plan.price)} تومان`}
            </button>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              پرداخت امن از طریق درگاه رسمی زارین‌پال • اشتراک فقط پس از تأیید درگاه فعال می‌شود
            </p>
          </div>
        )}

        {step === 'merchant' && (
          <div className="max-h-[60vh] overflow-y-auto px-5 pb-4">
            <button onClick={() => setStep('plans')} className="mb-3 text-xs text-primary">→ بازگشت به پلن‌ها</button>
            <div className="mb-3 flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
              <KeyRound className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <p className="text-[11px] leading-5 text-amber-600 dark:text-amber-400">
                برای پرداخت واقعی، «کد مرچنت» زارین‌پال لازم است. آن را از پنل
                zarinpal.com ← درگاه‌ها کپی کنید. این کد فقط روی همین گوشی ذخیره می‌شود.
              </p>
            </div>
            <input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="کد مرچنت زارین‌پال"
              dir="ltr"
              className="w-full rounded-2xl border border-border bg-background/60 px-4 py-3 text-left text-[13px] outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={() => void window.open('https://www.zarinpal.com/panel', '_blank')}
              className="mt-2 flex items-center gap-1 text-[11px] text-primary"
            >
              <ExternalLink className="size-3.5" />
              باز کردن پنل زارین‌پال
            </button>
            <button
              onClick={() => void saveMerchant()}
              className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-black text-primary-foreground active:scale-[0.98]"
            >
              ذخیره و ادامه به پرداخت
            </button>
          </div>
        )}

        {step === 'waiting' && (
          <div className="max-h-[60vh] px-5 pb-4">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-background/50 p-5 text-center">
              <Hourglass className="size-9 text-primary" />
              <p className="text-[14px] font-black">صفحه پرداخت زارین‌پال باز شد</p>
              <p className="text-[12px] leading-6 text-muted-foreground">
                پرداخت را در مرورگر کامل کنید. همین که به برنامه برگردید، رسید به‌صورت
                خودکار بررسی و اشتراک فعال می‌شود.
              </p>
              <p className="num text-[11px] text-muted-foreground">
                مبلغ: {faNumber(plan.price)} تومان
              </p>
            </div>
            {payError && (
              <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-destructive/10 p-2.5 text-[11px] leading-5 text-destructive">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                {payError}
              </p>
            )}
            <button
              onClick={() => void manualCheck()}
              disabled={busy}
              className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[14px] font-black text-primary-foreground disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              پرداخت را بررسی کن
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
              کد رهگیری زارین‌پال: <b className="num">{faDigits(paymentDone.refId)}</b>
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
