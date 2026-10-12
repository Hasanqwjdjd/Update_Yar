'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { HeartHandshake, Check, Loader2, PartyPopper, CreditCard, Wallet, Landmark, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { faDigits, faNumber } from '@/lib/persian'
import { useAppStore } from '@/lib/store'
import { addSupporter, listSupporters } from '@/lib/local-db'
import type { SupporterItem } from '@/lib/types'

const ONE_TIME_AMOUNTS = [10000, 25000, 50000, 100000]
const TIERS = [
  { key: 'bronze', label: 'برنزی', price: 50000, perks: ['نشان برنزی کنار نام شما', 'حذف تبلیغات'] },
  { key: 'silver', label: 'نقره‌ای', price: 100000, perks: ['همه مزایای برنزی', 'دسترسی زودهنگام به ویژگی‌های جدید'] },
  { key: 'gold', label: 'طلایی', price: 250000, perks: ['همه مزایای نقره‌ای', 'پشتیبانی مستقیم از توسعه‌دهنده', 'جایگاه ویژه در دیوار حامیان'] },
]

const GATEWAYS = [
  { key: 'zarinpal', label: 'زرین‌پال', icon: CreditCard },
  { key: 'idpay', label: 'آیدی‌پی', icon: Wallet },
  { key: 'card', label: 'کارت مستقیم', icon: Landmark },
]

export function SupportSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const showToast = useAppStore((s) => s.showToast)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const [mode, setMode] = useState<'once' | 'tier'>('once')
  const [amount, setAmount] = useState(25000)
  const [customAmount, setCustomAmount] = useState('')
  const [tier, setTier] = useState('bronze')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [gateway, setGateway] = useState('zarinpal')
  const [step, setStep] = useState<'form' | 'gateway' | 'processing' | 'done'>('form')
  const [supporters, setSupporters] = useState<SupporterItem[]>([])

  useEffect(() => {
    if (open && supporters.length === 0) {
      const t = setTimeout(() => setSupporters(listSupporters()), 0)
      return () => clearTimeout(t)
    }
  }, [open, supporters.length])

  const finalAmount = mode === 'once' ? (customAmount ? Number(customAmount) : amount) : TIERS.find((t) => t.key === tier)!.price

  const pay = () => {
    setStep('processing')
    setTimeout(async () => {
      const tierKey = mode === 'tier' ? tier : 'one-time'
      try {
        addSupporter({
          name: name || 'کاربر ناشناس',
          tier: tierKey as SupporterItem['tier'],
          amount: finalAmount,
          message: message || null,
        })
        await updateSettings({ supporterTier: tierKey })
        setSupporters(listSupporters())
      } catch { /* noop */ }
      setStep('done')
      showToast('حمایت شما ثبت شد. سپاسگزاریم! ❤️')
    }, 2200)
  }

  const close = () => {
    onOpenChange(false)
    setTimeout(() => setStep('form'), 400)
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setTimeout(() => setStep('form'), 400) }}>
      <SheetContent side="bottom" className="mx-auto max-w-[430px] rounded-t-3xl border-border bg-card px-0 pt-2 pb-8 [&>button]:left-4 [&>button]:right-auto">
        <SheetHeader className="px-5 pb-2 text-right">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <HeartHandshake className="size-5 text-primary" />
            حمایت از آپدیت‌یار
          </SheetTitle>
          <SheetDescription>سرورها و توسعه آپدیت‌یار با حمایت شما نگه داشته می‌شود</SheetDescription>
        </SheetHeader>

        {step === 'form' && (
          <div className="max-h-[62vh] overflow-y-auto px-5 pb-4">
            <div className="mb-3 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
              <button
                onClick={() => setMode('once')}
                className={cn('min-h-[40px] rounded-xl text-[13px] font-bold transition-all', mode === 'once' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
              >
                حمایت یکباره
              </button>
              <button
                onClick={() => setMode('tier')}
                className={cn('min-h-[40px] rounded-xl text-[13px] font-bold transition-all', mode === 'tier' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
              >
                عضویت ماهانه
              </button>
            </div>

            {mode === 'once' ? (
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
            ) : (
              <div className="space-y-2">
                {TIERS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTier(t.key)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl border p-3 text-right transition-all',
                      tier === t.key ? 'border-primary bg-primary/10 ring-2 ring-primary/30' : 'border-border bg-background/50'
                    )}
                  >
                    <div className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-xl text-white',
                      t.key === 'gold' && 'bg-amber-500', t.key === 'silver' && 'bg-slate-400', t.key === 'bronze' && 'bg-amber-700'
                    )}>
                      <Users className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold">{t.label} — {faNumber(t.price)} تومان / ماه</p>
                      <p className="truncate text-[10px] text-muted-foreground">{t.perks.join(' • ')}</p>
                    </div>
                    {tier === t.key && <Check className="size-4 shrink-0 text-primary" />}
                  </button>
                ))}
              </div>
            )}

            {mode === 'once' && (
              <input
                inputMode="numeric"
                placeholder="مبلغ دلخواه (تومان)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value.replace(/\D/g, ''))}
                className="mt-2 w-full rounded-2xl border border-border bg-background/50 px-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-primary/40"
              />
            )}

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
              onClick={() => setStep('gateway')}
              className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-black text-primary-foreground active:scale-[0.98]"
            >
              <HeartHandshake className="size-5" />
              حمایت می‌کنم
            </button>

            {supporters.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[12px] font-bold text-muted-foreground">آخرین حامیان ❤️</p>
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

        {step === 'gateway' && (
          <div className="max-h-[62vh] overflow-y-auto px-5 pb-4">
            <button onClick={() => setStep('form')} className="mb-3 text-xs text-primary">→ بازگشت</button>
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
            <button
              onClick={pay}
              className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-black text-primary-foreground active:scale-[0.98]"
            >
              پرداخت {faNumber(finalAmount)} تومان
            </button>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center gap-4 px-5 py-12">
            <Loader2 className="size-12 animate-spin text-primary" />
            <p className="text-[15px] font-bold">در حال اتصال به درگاه {GATEWAYS.find((g) => g.key === gateway)?.label}...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center gap-3 px-5 py-10">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/15">
              <PartyPopper className="size-8 text-primary" />
            </div>
            <p className="text-lg font-black">حمایت شما ثبت شد!</p>
            <p className="text-center text-[13px] text-muted-foreground">
              {name || 'دوست عزیز'}، از شما سپاسگزاریم. نام شما در دیوار حامیان ثبت شد ❤️
            </p>
            <button
              onClick={close}
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
