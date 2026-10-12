'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { HeartHandshake, Check, Loader2, PartyPopper, AlertTriangle, ReceiptText, Users, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { faDigits, faNumber } from '@/lib/persian'
import { useAppStore } from '@/lib/store'
import { listSupporters } from '@/lib/local-db'
import {
  startDonitoPayment, confirmDonitoPayment, cancelPendingPayment,
  getPendingPayment,
} from '@/lib/payment'
import type { SupporterItem } from '@/lib/types'

const ONE_TIME_AMOUNTS = [10000, 25000, 50000, 100000]

type Step = 'form' | 'confirm' | 'done'

export function SupportSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const showToast = useAppStore((s) => s.showToast)
  const paymentDone = useAppStore((s) => s.paymentDone)

  const [amount, setAmount] = useState(25000)
  const [customAmount, setCustomAmount] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [busy, setBusy] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [refId, setRefId] = useState('')
  const [supporters, setSupporters] = useState<SupporterItem[]>([])

  useEffect(() => {
    if (open && supporters.length === 0) {
      const t = setTimeout(() => setSupporters(listSupporters()), 0)
      return () => clearTimeout(t)
    }
  }, [open, supporters.length])

  // اگر پرداختی در انتظار است (کاربر از درگاه برگشته) → مستقیم به مرحله‌ی رسید
  useEffect(() => {
    if (open && step === 'form' && getPendingPayment()) {
      const t = setTimeout(() => setStep('confirm'), 0)
      return () => clearTimeout(t)
    }
  }, [open, step])

  // رسید پرداخت
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
    setTimeout(() => { setStep('form'); setPayError(null); setRefId('') }, 400)
  }

  const pay = async () => {
    if (!Number.isFinite(finalAmount) || finalAmount < 1000) {
      showToast('مبلغ را درست وارد کنید (حداقل ۱٬۰۰۰ تومان)')
      return
    }
    setBusy(true)
    setPayError(null)
    const res = await startDonitoPayment({
      amountToman: finalAmount,
      description: 'حمایت مالی از توسعه آپدیت‌یار',
      kind: 'support',
      supporter: { name: name || undefined, message: message || undefined },
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
      useAppStore.getState().setPaymentDone(r.done)
      setStep('done')
      setSupporters(listSupporters())
    } else {
      setPayError(r.error ?? 'ثبت حمایت ناموفق بود')
    }
  }

  const abandonPayment = () => {
    cancelPendingPayment()
    setStep('form')
    setRefId('')
    showToast('پرداخت لغو شد')
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setTimeout(() => { setStep('form'); setPayError(null); setRefId('') }, 400) }}>
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
              {busy ? <Loader2 className="size-5 animate-spin" /> : <ExternalLink className="size-5" />}
              {busy ? 'در حال باز کردن درگاه...' : `پرداخت ${faNumber(finalAmount)} تومان از طریق درگاه آنلاین`}
            </button>
            <p className="mt-2 text-center text-[10px] leading-4 text-muted-foreground">
              پرداخت از درگاه رسمی برنامه (دونیتو) انجام و مستقیماً به حساب توسعه‌دهنده واریز می‌شود؛
              پس از پرداخت، با وارد کردن شماره رسید، نام شما در دیوار حامیان ثبت می‌شود.
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

        {step === 'confirm' && (
          <div className="max-h-[62vh] overflow-y-auto px-5 pb-4">
            <div className="mb-3 flex items-start gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-3">
              <ReceiptText className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-[11px] leading-5 text-foreground/80">
                صفحه‌ی درگاه باز شد. مبلغ <b className="num">{faNumber(finalAmount)} تومان</b> را پرداخت کنید،
                سپس به اینجا برگردید و <b>شماره رسید/پیگیری</b> درگاه را وارد کنید تا حمایت شما ثبت شود.
              </p>
            </div>
            <button
              onClick={() => void pay()}
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
              ثبت رسید و درج در دیوار حامیان
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
              از شما سپاسگزاریم. نام شما در دیوار حامیان ثبت شد ❤️
              <br />
              شماره رسید درگاه: <b className="num">{faDigits(paymentDone.refId)}</b>
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
