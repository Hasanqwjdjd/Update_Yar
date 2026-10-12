'use client'

import { useState } from 'react'
import { User, Search, BellRing, Smartphone, ShieldCheck, FlaskConical, Moon, Palette, RefreshCcw, Clock, Wifi, Database, Store, Plus, Crown, HeartHandshake, Users, Info, ChevronLeft, FileText, Mail, Github as GithubIcon, Check } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useAppStore } from '@/lib/store'
import { faDigits } from '@/lib/persian'
import { cn } from '@/lib/utils'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="mt-4">
      <h2 className="mb-2 px-1 text-[13px] font-bold text-muted-foreground">{title}</h2>
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {children}
      </div>
    </section>
  )
}

function Row({
  icon: Icon,
  title,
  desc,
  control,
  onClick,
  keywords,
}: {
  icon: React.ElementType
  title: string
  desc?: string
  control?: React.ReactNode
  onClick?: () => void
  keywords?: string
}) {
  const inner = (
    <div className="flex min-h-[60px] items-center gap-3 px-4 py-2.5">
      <Icon className="size-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold">{title}</p>
        {desc && <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{desc}</p>}
      </div>
      {control}
      {onClick && !control && <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />}
    </div>
  )
  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-right transition-colors hover:bg-muted/40" data-keywords={keywords}>
        {inner}
      </button>
    )
  }
  return <div data-keywords={keywords}>{inner}</div>
}

export function SettingsView({
  onOpenProfile,
  onOpenPremium,
  onOpenSupport,
}: {
  onOpenProfile: () => void
  onOpenPremium: () => void
  onOpenSupport: () => void
}) {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const showToast = useAppStore((s) => s.showToast)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const matches = (kw?: string) => (q ? (kw ? kw.toLowerCase().includes(q) : false) : true)

  if (!settings) return <div className="py-20 text-center text-muted-foreground">در حال بارگذاری تنظیمات...</div>

  const s = settings

  return (
    <div className="flex min-h-full flex-col pb-28">
      {/* هدر */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 px-4 pt-3 pb-3 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="w-10" />
          <h1 className="text-[19px] font-black">تنظیمات</h1>
          <button onClick={onOpenProfile} aria-label="حساب کاربری" className="flex size-10 items-center justify-center rounded-full text-foreground/80 hover:bg-muted">
            <User className="size-[22px]" />
          </button>
        </div>
        <div className="mt-2.5 flex items-center gap-2 rounded-full border border-border bg-card px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در تنظیمات"
            className="min-h-[42px] w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
          />
        </div>
      </header>

      <div className="flex-1 px-4">
        {/* اعلان‌ها */}
        {matches('اعلان نوتیفیکیشن') && (
          <Section title="اعلان‌ها">
            <Row
              icon={BellRing}
              title="فعال‌سازی نوتیفیکیشن‌ها"
              desc="دریافت اعلان درباره به‌روزرسانی‌ها"
              keywords="اعلان نوتیفیکیشن فعال‌سازی"
              control={<Switch checked={s.notifications} onCheckedChange={(v) => updateSettings({ notifications: v })} />}
            />
            <Row
              icon={Smartphone}
              title="آپدیت‌های جدید"
              desc="اعلان هنگام انتشار نسخه جدید"
              keywords="آپدیت جدید اعلان"
              control={<Switch checked={s.notifyNewUpdates} onCheckedChange={(v) => updateSettings({ notifyNewUpdates: v })} disabled={!s.notifications} />}
            />
            <Row
              icon={ShieldCheck}
              title="تغییرات امنیتی"
              desc="اعلان فوری برای وصله‌های امنیتی"
              keywords="امنیتی وصله"
              control={<Switch checked={s.notifySecurity} onCheckedChange={(v) => updateSettings({ notifySecurity: v })} disabled={!s.notifications} />}
            />
            <Row
              icon={FlaskConical}
              title="آپدیت‌های بتا"
              desc="آپدیت‌های بتا محرمانه می‌شود"
              keywords="بتا آزمایشی"
              control={<Switch checked={s.notifyBeta} onCheckedChange={(v) => updateSettings({ notifyBeta: v })} disabled={!s.notifications} />}
            />
          </Section>
        )}

        {/* ظاهر */}
        {matches('ظاهر تم تیره رنگ شب روز') && (
          <Section title="ظاهر">
            <Row
              icon={Moon}
              title="تم تیره"
              desc="تم تیره پیش‌فرض است"
              keywords="تم تیره شب دارک"
              control={<Switch checked={s.darkTheme} onCheckedChange={(v) => updateSettings({ darkTheme: v, syncWithSystem: false })} />}
            />
            <div className="flex min-h-[68px] items-center gap-3 px-4 py-2.5" data-keywords="اسپدر رنگ سبز بنفش آبی">
              <Palette className="size-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold">اسپدر رنگ</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">رنگ اصلی برنامه را انتخاب کنید</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {([
                  { key: 'green', class: 'bg-emerald-500' },
                  { key: 'purple', class: 'bg-violet-500' },
                  { key: 'blue', class: 'bg-blue-500' },
                ] as const).map((c) => (
                  <button
                    key={c.key}
                    onClick={() => updateSettings({ accentTheme: c.key })}
                    aria-label={`رنگ ${c.key === 'green' ? 'سبز' : c.key === 'purple' ? 'بنفش' : 'آبی'}`}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-full transition-all',
                      c.class,
                      s.accentTheme === c.key && 'ring-2 ring-offset-2 ring-offset-background ring-foreground/60'
                    )}
                  >
                    {s.accentTheme === c.key && <Check className="size-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>
            <Row
              icon={RefreshCcw}
              title="همگام‌سازی با سیستم"
              desc="تم برنامه با تم گوشی هماهنگ شود"
              keywords="همگام‌سازی سیستم"
              control={<Switch checked={s.syncWithSystem} onCheckedChange={(v) => updateSettings({ syncWithSystem: v })} />}
            />
            <Row
              icon={Clock}
              title="زمان‌بندی تم"
              desc={s.scheduledTheme === 'night' ? 'تم تیره فقط شب‌ها' : s.scheduledTheme === 'auto' ? 'خودکار بر اساس ساعت' : 'بدون زمان‌بندی'}
              keywords="زمان‌بندی تم"
              onClick={() => {
                const next = s.scheduledTheme === 'manual' ? 'night' : s.scheduledTheme === 'night' ? 'auto' : 'manual'
                updateSettings({ scheduledTheme: next })
                showToast(`زمان‌بندی تم: ${next === 'night' ? 'فقط شب‌ها' : next === 'auto' ? 'خودکار' : 'خاموش'}`)
              }}
            />
          </Section>
        )}

        {/* دانلود و بررسی */}
        {matches('دانلود کم‌مصرف داده وای‌فای خودکار زمان‌بندی بررسی') && (
          <Section title="دانلود و بررسی">
            <Row
              icon={Wifi}
              title="آپدیت خودکار فقط وای‌فای"
              desc="بدون مصرف اینترنت سیم‌کارت"
              keywords="وای فای خودکار وایفای"
              control={<Switch checked={s.autoUpdateWifi} onCheckedChange={(v) => updateSettings({ autoUpdateWifi: v })} />}
            />
            <Row
              icon={Database}
              title="حالت کم‌مصرف داده"
              desc="فقط بررسی متادیتا بدون دانلود"
              keywords="کم مصرف داده"
              control={<Switch checked={s.dataSaver} onCheckedChange={(v) => updateSettings({ dataSaver: v })} />}
            />
            <Row
              icon={Clock}
              title="زمان‌بندی بررسی آپدیت"
              desc={s.scheduledChecks === 'daily' ? 'روزانه' : s.scheduledChecks === 'weekly' ? 'هفتگی' : 'خاموش'}
              keywords="زمان‌بندی بررسی"
              onClick={() => {
                const next = s.scheduledChecks === 'off' ? 'daily' : s.scheduledChecks === 'daily' ? 'weekly' : 'off'
                updateSettings({ scheduledChecks: next })
                showToast(`بررسی خودکار: ${next === 'daily' ? 'روزانه' : next === 'weekly' ? 'هفتگی' : 'خاموش'}`)
              }}
            />
          </Section>
        )}

        {/* منابع آپدیت */}
        {matches('منبع فروشگاه گوگل پلی بازار مایکت گیت‌هاب سفارشی') && (
          <Section title="منابع آپدیت">
            <Row
              icon={Store}
              title="فروشگاه‌های رسمی"
              keywords="فروشگاه رسمی"
              control={<Switch checked={s.sourceBazaar && s.sourceMyket} onCheckedChange={(v) => updateSettings({ sourceBazaar: v, sourceMyket: v })} />}
            />
            <Row
              icon={Store}
              title="گوگل پلی"
              keywords="گوگل پلی"
              control={<Switch checked={s.sourceGooglePlay} onCheckedChange={(v) => updateSettings({ sourceGooglePlay: v })} />}
            />
            <Row
              icon={Store}
              title="بازار"
              keywords="بازار کافه"
              control={<Switch checked={s.sourceBazaar} onCheckedChange={(v) => updateSettings({ sourceBazaar: v })} />}
            />
            <Row
              icon={Store}
              title="مایکت"
              keywords="مایکت"
              control={<Switch checked={s.sourceMyket} onCheckedChange={(v) => updateSettings({ sourceMyket: v })} />}
            />
            <Row
              icon={GithubIcon}
              title="گیت‌هاب"
              keywords="گیت هاب"
              control={<Switch checked={s.sourceGithub} onCheckedChange={(v) => updateSettings({ sourceGithub: v })} />}
            />
            <Row
              icon={Plus}
              title="افزودن منبع"
              desc="منابع سفارشی مثل APKMirror"
              keywords="افزودن منبع سفارشی"
              onClick={() => showToast('افزودن منبع سفارشی در نسخه بعدی فعال می‌شود')}
            />
          </Section>
        )}

        {/* حساب و درآمد */}
        <Section title="حساب و حمایت">
          <Row
            icon={Crown}
            title="اشتراک ویژه آپدیت‌یار"
            desc={s.isPremium ? 'اشتراک شما فعال است ✓' : 'حذف تبلیغات + امکانات ویژه — از ۱۹٬۰۰۰ تومان'}
            keywords="اشتراک ویژه پریمیوم"
            onClick={onOpenPremium}
            control={
              <span className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black',
                s.isPremium ? 'bg-primary/12 text-primary' : 'bg-primary text-primary-foreground'
              )}>
                {s.isPremium ? 'فعال' : 'خرید'}
              </span>
            }
          />
          <Row
            icon={HeartHandshake}
            title="حمایت از توسعه‌دهنده"
            desc={s.supporterTier ? 'سطح حمایت شما فعال است ✓' : 'حمایت یکباره یا عضویت ماهانه'}
            keywords="حمایت مالی دونیت"
            onClick={onOpenSupport}
          />
          <Row
            icon={Users}
            title="دیوار حامیان"
            desc="لیست حمایت‌کنندگان برنامه"
            keywords="حامیان"
            onClick={onOpenProfile}
          />
        </Section>

        {/* درباره */}
        <Section title="منابع آپدیت و درباره">
          <Row
            icon={Info}
            title={`نسخه ${faDigits('1.3.1')} (آخرین)`}
            desc="تیم توسعه آپدیت‌یار"
            keywords="نسخه درباره"
          />
          <Row
            icon={FileText}
            title="قوانین و حریم خصوصی"
            desc="ما هیچ داده شخصی جمع‌آوری نمی‌کنیم"
            keywords="قوانین حریم خصوصی"
            onClick={() => showToast('قوانین کامل در انتشار نهایی ارائه می‌شود')}
          />
          <Row
            icon={Mail}
            title="تماس با ما"
            desc="support@updateyar.ir"
            keywords="تماس ایمیل پشتیبانی"
            onClick={() => showToast('ایمیل شما در برنامه ایمیل باز می‌شود')}
          />
          <Row
            icon={GithubIcon}
            title="سورس پروژه در گیت‌هاب"
            desc="github.com/updateyar/app"
            keywords="گیت هاب سورس"
            onClick={() => showToast('به‌زودی منتشر می‌شود!')}
          />
        </Section>

        <p className="py-6 text-center text-[10px] leading-5 text-muted-foreground">
          ساخته‌شده با ❤️ برای جامعه فارسی‌زبان
          <br />
          آپدیت‌یار © ۱۴۰۴ — همه حقوق محفوظ است
        </p>
      </div>
    </div>
  )
}
