'use client'

import { useState } from 'react'
import { ArrowLeft, ShieldCheck, Store, Download, BellRing } from 'lucide-react'
import { faDigits } from '@/lib/persian'
import { cn } from '@/lib/utils'

const SLIDES = [
  {
    title: 'همه آپدیت‌ها، یک‌جا',
    desc: 'آپدیت‌یار لیست همه برنامه‌های گوشی شما را بررسی می‌کند و نسخه‌های جدید را از بازار، مایکت، گوگل‌پلی و گیت‌هاب پیدا می‌کند.',
    image: '/icon.png',
    chip: null,
  },
  {
    title: 'مجوزهای شفاف',
    desc: 'برای اجرای درست، آپدیت‌یار به این دسترسی‌ها نیاز دارد:',
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

const PERMISSIONS = [
  { icon: Download, title: 'نصب مستقیم آپدیت', desc: 'اجازه نصب بسته‌های APK بدون باز کردن فروشگاه (REQUEST_INSTALL_PACKAGES)' },
  { icon: Store, title: 'مشاهده برنامه‌های نصب‌شده', desc: 'برای نمایش لیست برنامه‌ها و نسخه فعلی آن‌ها (QUERY_ALL_PACKAGES)' },
  { icon: BellRing, title: 'اعلان‌ها', desc: 'برای اطلاع‌رسانی آپدیت‌های جدید و مهم' },
]

export function Onboarding({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0)
  const slide = SLIDES[step]

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pb-10 pt-16">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {slide.image && (
          
          <img src={slide.image} alt="" className="mb-8 size-40 rounded-3xl shadow-2xl shadow-primary/20" />
        )}

        {slide.chip === 'permissions' && (
          <div className="mb-6 w-full space-y-2.5 text-right">
            {PERMISSIONS.map((p) => (
              <div key={p.title} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12">
                  <p.icon className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-[14px] font-bold">{p.title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            ))}
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
              بررسی امنیت فایل قبل از نصب
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
        <button
          onClick={() => (step < SLIDES.length - 1 ? setStep(step + 1) : onFinish())}
          className="flex min-h-[50px] items-center gap-2 rounded-2xl bg-primary px-7 text-[15px] font-black text-primary-foreground transition-transform active:scale-95"
        >
          {step < SLIDES.length - 1 ? 'بعدی' : 'شروع کن'}
          <ArrowLeft className="size-5" />
        </button>
      </div>

      <p className="mt-4 text-center text-[10px] text-muted-foreground num">
        نسخه {faDigits('1.3.1')} • سازگار با اندروید ۸ به بالا
      </p>
    </div>
  )
}
