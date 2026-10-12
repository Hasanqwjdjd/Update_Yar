'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Radar, Star, GitBranch, ShieldAlert, RefreshCcw, Settings2, PartyPopper } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import { BottomNav } from '@/components/app/bottom-nav'
import { HomeView } from '@/components/app/home-view'
import { UpdatesView } from '@/components/app/updates-view'
import { GithubView, RepoChangelogSheet } from '@/components/app/github-view'
import { HistoryView } from '@/components/app/history-view'
import { SettingsView } from '@/components/app/settings-view'
import { Onboarding } from '@/components/app/onboarding'
import { DetailsSheet } from '@/components/app/details-sheet'
import { ProfileSheet } from '@/components/app/profile-sheet'
import { PremiumSheet } from '@/components/app/premium-sheet'
import { SupportSheet } from '@/components/app/support-sheet'
import { AdBanner } from '@/components/app/ad-banner'
import { faDigits, faNumber } from '@/lib/persian'
import { listAds, isPremiumActive } from '@/lib/local-db'
import type { AdItemT, GithubRepoItem, InstalledApp } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function Page() {
  const view = useAppStore((s) => s.view)
  const settings = useAppStore((s) => s.settings)
  const loadAll = useAppStore((s) => s.loadAll)
  const runScan = useAppStore((s) => s.runScan)
  const scanning = useAppStore((s) => s.scanning)
  const scanError = useAppStore((s) => s.scanError)
  const paymentDone = useAppStore((s) => s.paymentDone)
  const clearPaymentDone = useAppStore((s) => s.clearPaymentDone)
  const toast = useAppStore((s) => s.toast)
  const [detailsApp, setDetailsApp] = useState<InstalledApp | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [premiumOpen, setPremiumOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const ads = useMemo(() => listAds(), [])
  const [repoDetails, setRepoDetails] = useState<GithubRepoItem | null>(null)

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  // ---- اعمال تم روی سند (شامل زمان‌بندی «تم تیره در شب») ----
  useEffect(() => {
    if (!settings) return
    const root = document.documentElement

    const isNightTime = () => {
      const h = new Date().getHours() // ساعت محلی گوشی
      return h >= 20 || h < 7 // از ۲۰ شب تا ۷ صبح
    }

    const applyTheme = () => {
      let dark: boolean
      if (settings.scheduledTheme === 'night') {
        // زمان‌بندی: تم تیره فقط شب‌ها (۲۰ تا ۷) — روز از تنظیم تم تیره پیروی می‌کند
        dark = isNightTime() ? true : settings.darkTheme
      } else if (settings.scheduledTheme === 'auto' || settings.syncWithSystem) {
        dark = window.matchMedia('(prefers-color-scheme: dark)').matches
      } else {
        dark = settings.darkTheme
      }
      root.classList.toggle('dark', dark)
    }

    applyTheme()
    // هر دقیقه دوباره ارزیابی می‌شود تا گذر زمان (مثلاً رسیدن ساعت ۲۰) بلافاصله اعمال شود
    const iv = setInterval(applyTheme, 60000)
    const onVis = () => { if (!document.hidden) applyTheme() }
    document.addEventListener('visibilitychange', onVis)

    if (settings.scheduledTheme === 'auto' || settings.syncWithSystem) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', applyTheme)
      return () => {
        clearInterval(iv)
        document.removeEventListener('visibilitychange', onVis)
        mq.removeEventListener('change', applyTheme)
      }
    }
    return () => {
      clearInterval(iv)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [settings])

  useEffect(() => {
    if (!settings) return
    document.documentElement.setAttribute('data-accent', settings.accentTheme)
  }, [settings])

  // جلوگیری از اسکرول پس‌زمینه هنگام باز بودن شیت
  const isSheetOpen = Boolean(detailsApp) || profileOpen || premiumOpen || supportOpen
  useEffect(() => {
    document.body.style.overflow = isSheetOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isSheetOpen])

  // اسکن اولیه بعد از onboarding
  useEffect(() => {
    if (settings?.onboarded) {
      const t = setTimeout(() => { void runScan() }, 800)
      return () => clearTimeout(t)
    }
  }, [settings?.onboarded, runScan])

  const openDetails = useCallback((app: InstalledApp) => setDetailsApp(app), [])

  // دیالوگ موفقیت پرداخت (سراسری)
  const paymentBanner = paymentDone && (
    <Dialog open onOpenChange={() => clearPaymentDone()}>
      <DialogContent className="max-w-[360px] rounded-3xl border-border bg-card" dir="rtl">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/15">
            <PartyPopper className="size-7 text-primary" />
          </div>
          <DialogTitle className="text-[16px]">پرداخت با موفقیت تأیید شد</DialogTitle>
          <DialogDescription className="text-center text-[12px] leading-6">
            {paymentDone.kind === 'premium'
              ? 'اشتراک ویژه آپدیت‌یار فعال شد. از حمایت شما سپاسگزاریم!'
              : 'حمایت شما ثبت شد و نام شما در دیوار حامیان درج شد. سپاسگزاریم!'}
            <br />
            کد رهگیری: <b className="num">{faDigits(paymentDone.refId)}</b>
            <br />
            مبلغ: <b className="num">{faNumber(paymentDone.amountToman)}</b> تومان
          </DialogDescription>
        </DialogHeader>
        <button
          onClick={() => clearPaymentDone()}
          className="min-h-[44px] w-full rounded-2xl bg-primary text-[14px] font-black text-primary-foreground"
        >
          عالیه!
        </button>
      </DialogContent>
    </Dialog>
  )

  if (!settings) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </main>
    )
  }

  if (!settings.onboarded) {
    return (
      <main className="mx-auto min-h-screen max-w-[430px] bg-background">
        <Onboarding
          onFinish={() => {
            void useAppStore.getState().updateSettings({ onboarded: true }).then(() => runScan())
          }}
        />
      </main>
    )
  }

  const premiumActive = isPremiumActive(settings)

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-background shadow-2xl shadow-black/20 sm:border-x sm:border-border">
      {view === 'home' && (
        <HomeView ads={ads} onOpenDetails={openDetails} onOpenProfile={() => setProfileOpen(true)} />
      )}
      {view === 'updates' && <UpdatesView onOpenDetails={openDetails} />}
      {view === 'github' && <GithubView onOpenRepo={setRepoDetails} />}
      {view === 'history' && <HistoryView onOpenProfile={() => setProfileOpen(true)} />}
      {view === 'settings' && (
        <SettingsView
          onOpenProfile={() => setProfileOpen(true)}
          onOpenPremium={() => setPremiumOpen(true)}
          onOpenSupport={() => setSupportOpen(true)}
        />
      )}

      <BottomNav />
      <AdBanner isPremium={premiumActive} hidden={view === 'updates'} />

      {/* اورلی بررسی آپدیت */}
      {scanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex size-28 items-center justify-center">
              <span className="radar-ring absolute inset-0 rounded-full border-2 border-primary/50" />
              <span className="radar-ring absolute inset-0 rounded-full border-2 border-primary/40" style={{ animationDelay: '0.5s' }} />
              <span className="radar-ring absolute inset-0 rounded-full border-2 border-primary/30" style={{ animationDelay: '1s' }} />
              <Radar className="size-12 text-primary" />
            </div>
            <p className="text-[15px] font-black">در حال خواندن برنامه‌های نصب‌شده...</p>
            <p className="text-[12px] text-muted-foreground">حافظه گوشی • کاتالوگ نسخه‌ها • گیت‌هاب</p>
          </div>
        </div>
      )}

      {/* دیالوگ خطای اسکن — با راهنمای واقعی */}
      {!scanning && scanError && (
        <Dialog open onOpenChange={() => useAppStore.setState({ scanError: null })}>
          <DialogContent className="max-w-[380px] rounded-3xl border-border bg-card" dir="rtl">
            <DialogHeader className="items-start text-right">
              <DialogTitle className="flex items-center gap-2 text-[16px]">
                <ShieldAlert className="size-5 text-amber-500" />
                {scanError === 'permission' ? 'دسترسی به لیست برنامه‌ها داده نشد' : 'اسکن برنامه‌ها انجام نشد'}
              </DialogTitle>
              <DialogDescription className="text-right text-[12px] leading-6">
                {scanError === 'permission' ? (
                  <>
                    گوشی‌های شیائومی/اندروید ۱۱ به بعد برای دیدن لیست برنامه‌ها اجازه‌ی
                    «اطلاعات برنامه‌های نصب‌شده» می‌خواهند. در تنظیمات، به
                    <b> برنامه‌ها ← آپدیت‌یار </b> بروید و در «سایر دسترسی‌ها» گزینه‌ی
                    <b> دریافت اطلاعات برنامه‌های نصب‌شده </b> را فعال کنید.
                  </>
                ) : scanError === 'timeout' ? (
                  'خواندن برنامه‌ها بیش از حد طول کشید. گوشی را برای چند لحظه رها کنید و دوباره تلاش کنید.'
                ) : (
                  'خواندن برنامه‌ها با خطا مواجه شد. دوباره تلاش کنید؛ اگر تکرار شد گوشی را ری‌استارت کنید.'
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              {(scanError === 'permission' || scanError === 'failed') && isNativeApp() && (
                <button
                  onClick={() => { void InstalledApps.openAppSettings() }}
                  className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-2xl border border-border text-[13px] font-bold"
                >
                  <Settings2 className="size-4" />
                  رفتن به تنظیمات
                </button>
              )}
              <button
                onClick={() => { void runScan() }}
                className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-[13px] font-black text-primary-foreground"
              >
                <RefreshCcw className="size-4" />
                تلاش دوباره
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* توست */}
      {toast && (
        <div className="fixed bottom-32 left-1/2 z-50 w-max max-w-[85vw] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4">
          <div className="rounded-full border border-border bg-foreground px-5 py-2.5 text-[13px] font-bold text-background shadow-xl">
            {toast}
          </div>
        </div>
      )}

      <DetailsSheet app={detailsApp} onOpenChange={(v) => !v && setDetailsApp(null)} />

      <ProfileSheet
        open={profileOpen}
        onOpenChange={setProfileOpen}
        isPremium={premiumActive}
        supporterTier={settings.supporterTier}
        onOpenPremium={() => { setProfileOpen(false); setTimeout(() => setPremiumOpen(true), 300) }}
        onOpenSupport={() => { setProfileOpen(false); setTimeout(() => setSupportOpen(true), 300) }}
      />

      <PremiumSheet open={premiumOpen} onOpenChange={setPremiumOpen} />
      <SupportSheet open={supportOpen} onOpenChange={setSupportOpen} />
      {paymentBanner}

      {/* چنج‌لاگ مخزن گیت‌هاب */}
      <Dialog open={Boolean(repoDetails)} onOpenChange={(v) => !v && setRepoDetails(null)}>
        <DialogContent className="max-w-[400px] rounded-3xl border-border bg-card" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2 text-[16px]">
              <Star className="size-4 text-amber-400" />
              چنج‌لاگ آخرین ریلیز
            </DialogTitle>
            <DialogDescription>
              {repoDetails?.fullName} — {repoDetails && <span className="num">نسخه {faDigits(repoDetails.latestVersion)}</span>}
            </DialogDescription>
          </DialogHeader>
          {repoDetails && (
            <>
              <RepoChangelogSheet repo={repoDetails} />
              <div className="flex items-center gap-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="size-3.5 text-amber-400" /> {faNumber(repoDetails.stars)}
                </span>
                <span className="flex items-center gap-1">
                  <GitBranch className="size-3.5" /> {repoDetails.language}
                </span>
                <span className={cn('ms-auto flex items-center gap-1', repoDetails.installed ? 'text-primary' : '')}>
                  {repoDetails.installed ? 'نصب‌شده روی دستگاه' : 'نصب نشده'}
                </span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
