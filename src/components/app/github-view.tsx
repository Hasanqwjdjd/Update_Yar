'use client'

import { useEffect, useMemo, useState } from 'react'
import { Github as GithubIcon, Star, GitBranch, RefreshCcw, ArrowUpCircle, Download, CheckCircle2, ChevronLeft } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { listRepos, syncReposLive } from '@/lib/local-db'
import { InstalledApps, isNativeApp } from '@/lib/native'
import { faDigits, faNumber } from '@/lib/persian'
import { cn } from '@/lib/utils'
import type { GithubRepoItem } from '@/lib/types'

const LANG_COLORS: Record<string, string> = {
  Kotlin: '#A97BFF', Java: '#b07219', Dart: '#00B4AB', TypeScript: '#3178c6', 'C++': '#f34b7d',
}

/** باز کردن لینک خارجی — روی گوشی در مرورگر سیستم، در وب در تب جدید */
async function openExternal(url: string) {
  if (isNativeApp()) {
    try {
      await InstalledApps.openInStore({ packageName: 'external', store: 'github', url })
      return
    } catch { /* ادامه با وب */ }
  }
  window.open(url, '_blank')
}

export function GithubView({ onOpenRepo }: { onOpenRepo: (repo: GithubRepoItem) => void }) {
  const apps = useAppStore((s) => s.apps)
  const showToast = useAppStore((s) => s.showToast)
  const [filter, setFilter] = useState<'explore' | 'installed' | 'updates'>('explore')
  const [syncing, setSyncing] = useState(false)
  const [repos, setRepos] = useState<GithubRepoItem[] | null>(null)

  // بارگذاری اولیه از کش + سینک زنده از گیت‌هاب
  useEffect(() => {
    setRepos(listRepos())
    let cancelled = false
    void (async () => {
      const { repos: fresh } = await syncReposLive(useAppStore.getState().apps)
      if (!cancelled) setRepos(fresh)
    })()
    return () => { cancelled = true }
  }, [])

  const sync = async () => {
    setSyncing(true)
    try {
      const { repos: fresh, live } = await syncReposLive(useAppStore.getState().apps)
      setRepos(fresh)
      showToast(live ? 'داده زنده از گیت‌هاب دریافت شد ✓' : 'آفلاین — از آخرین داده ذخیره‌شده استفاده شد')
    } catch {
      showToast('بررسی ریلیزها ناموفق بود')
    } finally {
      setSyncing(false)
    }
  }

  const list = useMemo(() => {
    let l = repos ?? []
    if (filter === 'installed') l = l.filter((r) => r.installed)
    if (filter === 'updates') l = l.filter((r) => r.installed && r.isNew)
    return l
  }, [repos, filter])

  // اقدام واقعی: باز کردن صفحه ریلیزها در مرورگر
  const openRepoReleases = (repo: GithubRepoItem) => {
    void openExternal(`https://github.com/${repo.fullName}/releases/latest`)
    showToast('صفحه ریلیزهای گیت‌هاب باز شد')
  }

  return (
    <div className="flex min-h-full flex-col pb-28">
      {/* هدر */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 px-4 pt-3 pb-3 backdrop-blur-xl">
        <div className="flex items-center justify-center gap-2">
          <GithubIcon className="size-6" />
          <h1 className="text-[19px] font-black">گیت‌هاب</h1>
        </div>
        <div className="mx-auto mt-2.5 flex w-fit gap-2 rounded-full bg-muted p-1">
          {([
            { key: 'explore', label: 'اکسپلور' },
            { key: 'installed', label: 'نصب‌شده' },
            { key: 'updates', label: 'آپدیت موجود' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                'min-h-[34px] rounded-full px-4 text-[12px] font-bold transition-all',
                filter === t.key ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <section aria-label="مخازن گیت‌هاب" className="space-y-2.5 px-4 pt-3">
        {!repos ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
          ))
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <GithubIcon className="size-9 text-muted-foreground/40" />
            <p className="text-[14px] font-bold">مخزنی در این دسته نیست</p>
            <p className="text-[12px] text-muted-foreground">مخازن نصب‌شده شما از گیت‌هاب اینجا نمایش داده می‌شوند</p>
          </div>
        ) : (
          list.map((repo) => {
            const slashIdx = repo.fullName.indexOf('/')
            const owner = slashIdx > 0 ? repo.fullName.slice(0, slashIdx) : repo.fullName
            const name = slashIdx > 0 ? repo.fullName.slice(slashIdx + 1) : repo.fullName
            const hasUpdate = repo.installed && repo.isNew
            return (
              <div key={repo.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card-foreground/8">
                    <GithubIcon className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] text-muted-foreground">{owner} /</p>
                    <p className="truncate text-[15px] font-black">{name}</p>
                    <p className="num mt-0.5 text-[11px] text-muted-foreground">
                      نسخه نصب‌شده: {repo.installedVersion ? faDigits(repo.installedVersion) : 'نصب نشده'}
                      {hasUpdate && <> • جدیدترین: <b className="text-primary num">{faDigits(repo.latestVersion)}</b></>}
                    </p>
                  </div>
                  {repo.isNew && (
                    <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground">جدید</span>
                  )}
                </div>

                <p className="mt-2.5 line-clamp-2 text-[12px] leading-6 text-muted-foreground">{repo.description}</p>

                <div className="mt-2.5 flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="size-2.5 rounded-full" style={{ background: LANG_COLORS[repo.language] ?? '#888' }} />
                    {repo.language}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="size-3.5 text-amber-400" />
                    {faNumber(repo.stars)}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitBranch className="size-3.5" /> ریلیز پایدار
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {hasUpdate ? (
                    <button
                      onClick={() => openRepoReleases(repo)}
                      className="flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-black text-primary-foreground active:scale-[0.99]"
                    >
                      <ArrowUpCircle className="size-4" />
                      دریافت از گیت‌هاب
                    </button>
                  ) : repo.installed ? (
                    <button
                      disabled
                      className="flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary/10 text-[13px] font-black text-primary"
                    >
                      <CheckCircle2 className="size-4" /> به‌روز است
                    </button>
                  ) : (
                    <button
                      onClick={() => openRepoReleases(repo)}
                      className="flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl border border-primary/40 text-[13px] font-black text-primary active:scale-[0.99]"
                    >
                      <Download className="size-4" /> صفحه ریلیز
                    </button>
                  )}
                  <button
                    onClick={() => onOpenRepo(repo)}
                    className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-border text-[12px] font-bold text-muted-foreground"
                  >
                    مشاهده چنج‌لاگ
                    <ChevronLeft className="size-3.5" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </section>

      {/* دکمه سینک شناور */}
      <button
        onClick={sync}
        disabled={syncing}
        aria-label="بررسی ریلیزهای جدید"
        className={cn(
          'fixed left-[calc(50%-190px+16px)] z-20 flex size-13 items-center justify-center rounded-2xl bg-primary p-3.5 text-primary-foreground shadow-xl shadow-primary/25 transition-all active:scale-95 max-[450px]:left-4',
          useAppStore.getState().settings?.isPremium ? 'bottom-24' : 'bottom-[150px]'
        )}
      >
        <RefreshCcw className={cn('size-6', syncing && 'animate-spin')} />
      </button>
    </div>
  )
}

export function RepoChangelogSheet({ repo }: { repo: GithubRepoItem | null }) {
  if (!repo) return null
  return (
    <div className="space-y-3">
      <p className="text-[14px] font-black">{repo.fullName}</p>
      <p className="num text-[12px] text-muted-foreground">نسخه {faDigits(repo.latestVersion)}</p>
      {repo.changelog ? (
        <ul className="space-y-1.5">
          {repo.changelog.split('\n').filter(Boolean).map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px] leading-6 text-muted-foreground">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {line.replace(/^[-*]\s*/, '')}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-muted-foreground">چنج‌لاگی ثبت نشده — برای جزئیات صفحه ریلیز را باز کنید</p>
      )}
    </div>
  )
}
