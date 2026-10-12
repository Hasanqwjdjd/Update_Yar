'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Radar, Star, GitBranch } from 'lucide-react'
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
import { listAds, scanUpdates } from '@/lib/local-db'
import type { AdItemT, GithubRepoItem, InstalledApp } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function Page() {
  const view = useAppStore((s) => s.view)
  const settings = useAppStore((s) => s.settings)
  const loadAll = useAppStore((s) => s.loadAll)
  const scanning = useAppStore((s) => s.scanning)
  const setScanning = useAppStore((s) => s.setScanning)
  const applyScanResult = useAppStore((s) => s.applyScanResult)
  const showToast = useAppStore((s) => s.showToast)
  const toast = useAppStore((s) => s.toast)

  const [detailsApp, setDetailsApp] = useState<InstalledApp | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [premiumOpen, setPremiumOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [ads, setAds] = useState<AdItemT[]>([])
  const [repoDetails, setRepoDetails] = useState<GithubRepoItem | null>(null)

  useEffect(() => {
    void loadAll()
    setAds(listAds())
  }, [loadAll])

  // اعمال تم روی سند
  useEffect(() => {
    if (!settings) return
    const root = document.documentElement
    if (settings.syncWithSystem) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const apply = () => root.classList.toggle('dark', mq.matches)
      apply()
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
    root.classList.toggle('dark', settings.darkTheme)
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

  const runScan = useCallback(async () => {
    if (useAppStore.getState().scanning) return
    setScanning(true)
    try {
      // کمی تأخیر برای حس واقعی «بررسی» رادار
      await new Promise((r) => setTimeout(r, 1400))
      const data = scanUpdates()
      applyScanResult(data.apps, data.history)
      showToast(
        data.discovered > 0
          ? `${faDigits(data.discovered)} به‌روزرسانی جدید پیدا شد!`
          : 'همه برنامه‌ها به‌روز هستند ✓'
      )
    } catch {
      showToast('بررسی آپدیت‌ها ناموفق بود')
    } finally {
      setScanning(false)
    }
  }, [applyScanResult, setScanning, showToast])

  // اسکن اولیه بعد از onboarding
  useEffect(() => {
    if (settings?.onboarded) {
      const t = setTimeout(() => { void runScan() }, 800)
      return () => clearTimeout(t)
    }
  }, [settings?.onboarded, runScan])

  const openDetails = useCallback((app: InstalledApp) => setDetailsApp(app), [])

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
      <AdBanner isPremium={settings.isPremium} hidden={view === 'updates'} />

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
            <p className="text-[15px] font-black">در حال بررسی منابع...</p>
            <p className="text-[12px] text-muted-foreground">بازار • مایکت • گوگل‌پلی • گیت‌هاب</p>
          </div>
        </div>
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
        isPremium={settings.isPremium}
        supporterTier={settings.supporterTier}
        onOpenPremium={() => { setProfileOpen(false); setTimeout(() => setPremiumOpen(true), 300) }}
        onOpenSupport={() => { setProfileOpen(false); setTimeout(() => setSupportOpen(true), 300) }}
      />

      <PremiumSheet open={premiumOpen} onOpenChange={setPremiumOpen} />
      <SupportSheet open={supportOpen} onOpenChange={setSupportOpen} />

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
