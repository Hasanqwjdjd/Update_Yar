'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ShieldCheck, Store, Download, BellRing, CheckCircle2, AlertCircle, SkipForward } from 'lucide-react'
import { faDigits } from '@/lib/persian'
import { APP_VERSION } from '@/lib/config'
import { InstalledApps, isNativeApp } from '@/lib/native'
import { cn } from '@/lib/utils'

const SLIDES = [
  {
    title: 'همه آپدیت‌ها، یک‌جا',
    desc: 'آپدیت‌یار لیست همه برنامه‌های گوشی شما را بررسی می‌کند و نسخه‌های جدید را از بازار، مایکت، گوگل‌پلی و گیت‌هاب پیدا می‌کند.',
    image: '/icon.png',
    chip: null,
  },
  {
    title: 'دادن دسترسی‌ها',
    desc: 'برای اجرای درست، دسترسی‌های زیر را با دکمه‌ی پایین به برنامه بدهید:',
    image: null,
    chip: 'permissions',
  },
  {
    title: 'آماده‌اید؟',
    desc: 'اولین بررسی خودکار انجام می‌شود. هر زمان بخواهید می‌توانید منابع را در تنظیمات تغییر دهید.',
    image: null,
    chip: 'ready',
  },
]

export function Onboarding({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0)
  const slide = SLIDES[step]

  // وضعیت واقعی دسترسی‌ها (روی گوشی از پلاگین خوانده می‌شود)
  const [perm, setPerm] = useState<{ notifications: boolean | null; canInstall: boolean | null }>({
    notifications: null,
    canInstall: null,
  })
  const [requested, setRequested] = useState(false)

  const refreshStatus = useCallback(() => {
    if (!isNativeApp()) return
    void InstalledApps.getPermissionStatus()
      .then((s) => setPerm({ notifications: s.notifications, canInstall: s.canInstall }))
      .catch(() => { /* noop */ })
  }, [])

  useEffect(() => {
    if (step === 1) refreshStatus()
  }, [step, refreshStatus])

  // وقتی کاربر از تنظیمات سیستم برمی‌گردد، وضعیت تازه می‌شود
  useEffect(() => {
    const onVis = () => { if (!document.hidden && step === 1) refreshStatus() }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [step, refreshStatus])

  /** درخواست واقعی هر دو دسترسی روی گوشی */
  const grantPermissions = async () => {
    if (!isNativeApp()) {
      setRequested(true)
      setStep(2)
      return
    }
    setRequested(true)
    // ۱) اعلان‌ها (اندروید ۱۳+)
    if (perm.notifications === false) {
      try { await InstalledApps.requestNotifications() } catch { /* noop */ }
    }
    // ۲) نصب بسته‌های ناشناس
    if (perm.canInstall === false) {
      try { await InstalledApps.openInstallPermissionSettings() } catch { /* noop */ }
    }
    refreshStatus()
  }

  const next = () => (step < SLIDES.length - 1 ? setStep(step + 1) : onFinish())

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pb-10 pt-16">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {slide.image && (

          <img src={slide.image} alt="" className="mb-8 size-40 rounded-3xl shadow-2xl shadow-primary/20" />
        )}

        {slide.chip === 'permissions' && (
          <div className="mb-6 w-full space-y-2.5 text-right">
            <button
              onClick={() => { if (isNativeApp() && perm.canInstall === false) void InstalledApps.openInstallPermissionSettings() }}
              className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-right"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12">
                <Download className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold">نصب مستقیم آپدیت</p>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  اجازه نصب بسته‌های APK بدون باز کردن فروشگاه
                </p>
                {perm.canInstall !== null && (
                  <span className={cn(
                    'mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                    perm.canInstall ? 'bg-primary/12 text-primary' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  )}>
                    {perm.canInstall ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
                    {perm.canInstall ? 'داده شد ✓' : 'لازم است فعال کنید ← لمس کنید'}
                  </span>
                )}
              </div>
            </button>
            <div className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12">
                <Store className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-[14px] font-bold">مشاهده برنامه‌های نصب‌شده</p>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  برای نمایش لیست برنامه‌ها و نسخه فعلی آن‌ها — این دسترسی در نصب خودکار اعمال می‌شود
                </p>
              </div>
            </div>
            <button
              onClick={() => { if (isNativeApp() && perm.notifications === false) void InstalledApps.requestNotifications().then(refreshStatus) }}
              className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-right"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12">
                <BellRing className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold">اعلان‌ها</p>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  برای اطلاع‌رسانی آپدیت‌های جدید و مهم
                </p>
                {perm.notifications !== null && (
                  <span className={cn(
                    'mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                    perm.notifications ? 'bg-primary/12 text-primary' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  )}>
                    {perm.notifications ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
                    {perm.notifications ? 'داده شد ✓' : 'لازم است اجازه بدهید ← لمس کنید'}
                  </span>
                )}
              </div>
            </button>
            <p className="pt-1 text-center text-[10px] text-muted-foreground">
              آپدیت‌یار هیچ داده‌ای به سرور ارسال نمی‌کند و همه پردازش‌ها روی گوشی شما انجام می‌شود.
            </p>
          </div>
        )}

        {slide.chip === 'ready' && (
          <div className="mb-6 flex w-full flex-col items-center gap-3">
            <div className="relative flex size-32 items-center justify-center">
              <span className="radar-ring absolute inset-0 rounded-full border-2 border-primary/40" />
              <span className="radar-ring absolute inset-0 rounded-full border-2 border-primary/40" style={{ animationDelay: '0.8s' }} />

              <img src="/icon.png" alt="" className="size-20 rounded-2xl shadow-xl shadow-primary/25" />
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary">
              <ShieldCheck className="size-3.5" />
              خواندن مستقیم نسخه‌ها از حافظه‌ی گوشی
            </div>
          </div>
        )}

        <h1 className="text-[24px] font-black leading-tight">{slide.title}</h1>
        <p className="mt-3 max-w-[300px] text-[14px] leading-7 text-muted-foreground">{slide.desc}</p>

        {step === 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {['کافه‌بازار', 'مایکت', 'گوگل‌پلی', 'گیت‌هاب'].map((s) => (
              <span key={s} className="rounded-full border border-border bg-card px-3.5 py-1.5 text-[12px] font-bold text-muted-foreground">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <span key={i} className={cn('h-2 rounded-full transition-all', i === step ? 'w-7 bg-primary' : 'w-2 bg-muted')} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {step === 1 && (
            <button
              onClick={next}
              className="flex min-h-[50px] items-center gap-1.5 rounded-2xl border border-border px-4 text-[13px] font-bold text-muted-foreground"
            >
              <SkipForward className="size-4" />
              بعداً
            </button>
          )}
          {step === 1 && isNativeApp() && !requested ? (
            <button
              onClick={() => { void grantPermissions() }}
              className="flex min-h-[50px] items-center gap-2 rounded-2xl bg-primary px-7 text-[15px] font-black text-primary-foreground transition-transform active:scale-95"
            >
              دادن دسترسی‌ها
              <ShieldCheck className="size-5" />
            </button>
          ) : (
            <button
              onClick={next}
              className="flex min-h-[50px] items-center gap-2 rounded-2xl bg-primary px-7 text-[15px] font-black text-primary-foreground transition-transform active:scale-95"
            >
              {step < SLIDES.length - 1 ? 'بعدی' : 'شروع کن'}
              <ArrowLeft className="size-5" />
            </button>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-[10px] text-muted-foreground num">
        نسخه {faDigits(APP_VERSION)} • سازگار با اندروید ۸ به بالا
      </p>
    </div>
  )
}
