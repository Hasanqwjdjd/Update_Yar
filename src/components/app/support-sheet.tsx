'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { HeartHandshake, Check, Loader2, PartyPopper, AlertTriangle, Hourglass, KeyRound, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { faDigits, faNumber } from '@/lib/persian'
import { useAppStore } from '@/lib/store'
import { listSupporters } from '@/lib/local-db'
import {
  startZarinpalPayment, checkPendingPayment, cancelPendingPayment,
  hasPendingPayment,
} from '@/lib/payment'
import type { SupporterItem } from '@/lib/types'

const ONE_TIME_AMOUNTS = [10000, 25000, 50000, 100000]

type Step = 'form' | 'merchant' | 'waiting' | 'done'

export function SupportSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const refreshSettings = useAppStore((s) => s.refreshSettings)
  const showToast = useAppStore((s) => s.showToast)
  const paymentDone = useAppStore((s) => s.paymentDone)

  const [amount, setAmount] = useState(25000)
  const [customAmount, setCustomAmount] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [merchant, setMerchant] = useState(settings?.zarinpalMerchant ?? '')
  const [step, setStep] = useState<Step>('form')
  const [busy, setBusy] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [supporters, setSupporters] = useState<SupporterItem[]>([])

  useEffect(() => {
    if (open && supporters.length === 0) {
      const t = setTimeout(() => setSupporters(listSupporters()), 0)
      return () => clearTimeout(t)
    }
  }, [open, supporters.length])

  // رسید پرداخت (وقتی کاربر از درگاه برگردد)
  useEffect(() => {
    if (paymentDone?.kind === 'support') {
      const t = setTimeout(() => {
        setStep('done')
        setSupporters(listSupporters())
      }, 0)
      return () => clearTimeout(t)
    }
  }, [paymentDone])

  const finalAmount = customAmount ? Number(customAmount) : amount

  const reset = () => {
    onOpenChange(false)
    setTimeout(() => { setStep('form'); setPayError(null) }, 400)
  }

  const saveMerchant = async () => {
    const v = merchant.trim()
    if (v.length < 20) {
      showToast('کد مرچنت معتبر نیست')
      return
    }
    await updateSettings({ zarinpalMerchant: v })
    refreshSettings()
    setStep('form')
    void pay()
  }

  const pay = async () => {
    const m = useAppStore.getState().settings?.zarinpalMerchant ?? ''
    if (!m) {
      setStep('merchant')
      return
    }
    if (!Number.isFinite(finalAmount) || finalAmount < 1000) {
      showToast('مبلغ را درست وارد کنید (حداقل ۱٬۰۰۰ تومان)')
      return
    }
    setBusy(true)
    setPayError(null)
    const res = await startZarinpalPayment({
      merchantId: m,
      amountToman: finalAmount,
      description: 'حمایت مالی از توسعه آپدیت‌یار',
      kind: 'support',
      supporter: { name: name || undefined, message: message || undefined },
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
      setSupporters(listSupporters())
    } else if (r.error === 'none') {
      setStep('form')
    } else {
      showToast('هنوز پرداختی ثبت نشده — در صفحه زارین‌پال پرداخت را کامل کنید')
    }
  }

  const abandonPayment = () => {
    cancelPendingPayment()
    setStep('form')
    showToast('پرداخت لغو شد')
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setTimeout(() => { setStep('form'); setPayError(null) }, 400) }}>
      <SheetContent side="bottom" className="mx-auto max-w-[430px] rounded-t-3xl border-border bg-card px-0 pt-2 pb-8 [&>button]:left-4 [&>button]:right-auto">
        <SheetHeader className="px-5 pb-2 text-right">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <HeartHandshake className="size-5 text-primary" />
            حمایت از آپدیت‌یار
          </SheetTitle>
          <SheetDescription>توسعه آپدیت‌یار با حمایت شما ادامه پیدا می‌کند</SheetDescription>
        </SheetHeader>

        {step === 'form' && (
          <div className="max-h-[62vh] overflow-y-auto px-5 pb-4">
            <div className="grid grid-cols-4 gap-2">
              {ONE_TIME_AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => { setAmount(a); setCustomAmount('') }}
                  className={cn(
                    'rounded-xl border py-2.5 text-center text-[12px] font-bold transition-all num',
                    amount === a && !customAmount ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30' : 'border-border bg-background/50'
                  )}
                >
                  {faDigits(a / 1000)}
                  <span className="block text-[9px] font-normal text-muted-foreground">هزار تومان</span>
                </button>
              ))}
            </div>

            <input
              inputMode="numeric"
              placeholder="مبلغ دلخواه (تومان)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value.replace(/\D/g, ''))}
              className="mt-2 w-full rounded-2xl border border-border bg-background/50 px-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-primary/40"
            />

            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                placeholder="نام شما (اختیاری)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background/50 px-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                placeholder="پیام شما (اختیاری)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background/50 px-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="mt-3 flex items-center justify-between rounded-2xl bg-muted p-3.5">
              <span className="text-[13px] text-muted-foreground">مبلغ حمایت</span>
              <span className="text-[15px] font-black num">{faNumber(finalAmount)} تومان</span>
            </div>

            <button
              onClick={() => void pay()}
              disabled={busy}
              className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-black text-primary-foreground active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-5 animate-spin" /> : <HeartHandshake className="size-5" />}
              {busy ? 'در حال اتصال به درگاه...' : `پرداخت ${faNumber(finalAmount)} تومان از طریق زارین‌پال`}
            </button>
            <p className="mt-2 text-center text-[10px] leading-4 text-muted-foreground">
              پرداخت از درگاه رسمی زارین‌پال انجام می‌شود و فقط پس از تأیید درگاه،
              نام شما در دیوار حامیان همین برنامه ثبت می‌شود.
            </p>

            {supporters.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[12px] font-bold text-muted-foreground">حامیان این گوشی ❤️</p>
                <div className="flex flex-wrap gap-1.5">
                  {supporters.slice(0, 8).map((s) => (
                    <span key={s.id} className="rounded-full bg-muted px-2.5 py-1 text-[10px]">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'merchant' && (
          <div className="max-h-[62vh] overflow-y-auto px-5 pb-4">
            <button onClick={() => setStep('form')} className="mb-3 text-xs text-primary">→ بازگشت</button>
            <div className="mb-3 flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
              <KeyRound className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <p className="text-[11px] leading-5 text-amber-600 dark:text-amber-400">
                برای دریافت واقعی حمایت‌ها، «کد مرچنت» زارین‌پال لازم است (پنل zarinpal.com ← درگاه‌ها).
                کد فقط روی همین گوشی ذخیره می‌شود.
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
              onClick={() => void saveMerchant()}
              className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-black text-primary-foreground active:scale-[0.98]"
            >
              ذخیره و ادامه به پرداخت
            </button>
          </div>
        )}

        {step === 'waiting' && (
          <div className="max-h-[62vh] px-5 pb-4">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-background/50 p-5 text-center">
              <Hourglass className="size-9 text-primary" />
              <p className="text-[14px] font-black">صفحه پرداخت زارین‌پال باز شد</p>
              <p className="text-[12px] leading-6 text-muted-foreground">
                پرداخت را در مرورگر کامل کنید؛ همین که به برنامه برگردید، حمایت شما
                به‌صورت خودکار بررسی و ثبت می‌شود.
              </p>
              <p className="num text-[11px] text-muted-foreground">مبلغ: {faNumber(finalAmount)} تومان</p>
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

        {step === 'done' && paymentDone?.kind === 'support' && (
          <div className="flex flex-col items-center gap-3 px-5 py-10">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/15">
              <PartyPopper className="size-8 text-primary" />
            </div>
            <p className="text-lg font-black">حمایت شما تأیید و ثبت شد!</p>
            <p className="text-center text-[13px] leading-6 text-muted-foreground">
              {(name || 'دوست عزیز')}، از شما سپاسگزاریم. نام شما در دیوار حامیان ثبت شد ❤️
              <br />
              کد رهگیری: <b className="num">{faDigits(paymentDone.refId)}</b>
            </p>
            <div className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-[11px] text-muted-foreground">
              <Users className="size-3.5" />
              {faDigits(supporters.length)} حامی روی همین گوشی ثبت شده است
            </div>
            <button
              onClick={reset}
              className="mt-2 min-h-[44px] w-full rounded-2xl bg-primary text-[15px] font-black text-primary-foreground"
            >
              بستن
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
