'use client'

/**
 * دیتابیس محلی «آپدیت‌یار» — نسخه ۲ (واقعی)
 *
 * روی گوشی: لیست برنامه‌ها از پلاگین نیتیو (برنامه‌های واقعاً نصب‌شده) خوانده می‌شود
 * و فقط کش می‌شود. تشخیص آپدیت با «کاتالوگ مرجع» (آخرین نسخه‌ی شناخته‌شده هر برنامه)
 * انجام می‌شود. سینک گیت‌هاب، داده‌ی زنده از API گیت‌هاب می‌گیرد.
 *
 * در مرورگر (پیش‌نمایش وب): پلاگین نیتیو وجود ندارد → داده نمایشی fallback
 */

import type { AdItemT, GithubRepoItem, HistoryItem, InstalledApp, SettingsT, SupporterItem } from '@/lib/types'
import type { NativeAppInfo } from '@/lib/native'

const STORAGE_KEY = 'updatayar-db-v2'

// ---------- کاتالوگ مرجع (آخرین نسخه‌ی شناخته‌شده برنامه‌ها) ----------

interface CatalogEntry {
  pkg: string
  name: string
  nameEn: string
  latest: string
  changelog?: string
  source: InstalledApp['source']
  category: string
  developer: string
  iconColor: string
  iconType: string
}

export const CATALOG: CatalogEntry[] = [
  { name: 'دیجی‌کالا', nameEn: 'Digikala', pkg: 'com.digikala', latest: '6.5.0', changelog: 'بهبود جستجوی هوشمند، رفع مشکل پرداخت و افزودن بخش پیشنهاد ویژه', source: 'bazaar', category: 'خرید', developer: 'دیجی‌کالا', iconColor: 'rose', iconType: 'ShoppingBag' },
  { name: 'اینستاگرام', nameEn: 'Instagram', pkg: 'com.instagram.android', latest: '357.0.0', changelog: 'افزودن افکت‌های جدید استوری و بهبود سرعت پخش ریلز', source: 'googleplay', category: 'شبکه اجتماعی', developer: 'Instagram', iconColor: 'pink', iconType: 'Camera' },
  { name: 'تلگرام', nameEn: 'Telegram', pkg: 'org.telegram.messenger', latest: '10.7.1', changelog: 'تغییرات بهتر در پوشه‌ها و قابلیت جدید برای ویرایش عکس‌ها', source: 'googleplay', category: 'پیام‌رسان', developer: 'Telegram FZ-LLC', iconColor: 'sky', iconType: 'Send' },
  { name: 'اسنپ', nameEn: 'Snapp', pkg: 'app.snapp.passenger', latest: '6.1.3', changelog: 'بهبود تعیین موقعیت دقیق مبدأ و رفع اشکال کیف پول', source: 'bazaar', category: 'حمل‌ونقل', developer: 'اسنپ', iconColor: 'emerald', iconType: 'MapPin' },
  { name: 'اسنپ‌فود', nameEn: 'SnappFood', pkg: 'com.snappfood', latest: '5.3.0', source: 'bazaar', category: 'سفارش غذا', developer: 'اسنپ‌فود', iconColor: 'pink', iconType: 'UtensilsCrossed' },
  { name: 'بله', nameEn: 'Bale', pkg: 'app.bale.messenger', latest: '3.6.0', changelog: 'افزودن پرداخت قبض در چت‌ها و بهبود تماس تصویری', source: 'myket', category: 'پیام‌رسان', developer: 'بله', iconColor: 'emerald', iconType: 'MessageCircle' },
  { name: 'آپارات', nameEn: 'Aparat', pkg: 'com.aparat', latest: '6.0.1', changelog: 'پخش خودکار جدید، رفع پرش ویدیو و حالت شب بهتر', source: 'bazaar', category: 'ویدیو', developer: 'آپارات', iconColor: 'red', iconType: 'Play' },
  { name: 'سروش‌پلاس', nameEn: 'Soroush Plus', pkg: 'com.soroush.plus', latest: '3.2.0', changelog: 'بهبود سرعت ارسال پیام و رفع مشکلات نوتیفیکیشن', source: 'custom', category: 'پیام‌رسان', developer: 'سروش', iconColor: 'blue', iconType: 'MessageSquare' },
  { name: 'ترب', nameEn: 'Torob', pkg: 'com.torob.mobile', latest: '4.2.0', source: 'bazaar', category: 'خرید', developer: 'ترب', iconColor: 'blue', iconType: 'Search' },
  { name: 'بانک ملت', nameEn: 'Bank Mellat', pkg: 'com.mellat.bbank', latest: '10.3.0', changelog: 'افزودن انتقال کارت‌به‌کارت سریع و بهبود امنیت ورود', source: 'myket', category: 'مالی', developer: 'بانک ملت', iconColor: 'red', iconType: 'CreditCard' },
  { name: 'فیلیمو', nameEn: 'Filimo', pkg: 'com.filimo', latest: '8.3.0', changelog: 'دانلود آفلاین سریع‌تر و زیرنویس جدید', source: 'bazaar', category: 'سرگرمی', developer: 'فیلیمو', iconColor: 'violet', iconType: 'Film' },
  { name: 'واتساپ', nameEn: 'WhatsApp', pkg: 'com.whatsapp', latest: '2.24.21', source: 'googleplay', category: 'پیام‌رسان', developer: 'Meta', iconColor: 'emerald', iconType: 'Phone' },
  { name: 'گوگل مپس', nameEn: 'Google Maps', pkg: 'com.google.android.apps.maps', latest: '11.220.01', source: 'googleplay', category: 'نقشه', developer: 'Google LLC', iconColor: 'emerald', iconType: 'Map' },
  { name: 'یوتیوب', nameEn: 'YouTube', pkg: 'com.google.android.youtube', latest: '19.06.2', changelog: 'بهبود پخش 4K و مدیریت صف جدید', source: 'googleplay', category: 'ویدیو', developer: 'Google LLC', iconColor: 'red', iconType: 'Youtube' },
  { name: 'نیوپایپ', nameEn: 'NewPipe', pkg: 'org.schabi.newpipe', latest: '0.27.2', changelog: 'رفع مشکل پخش ویدیوهای یوتیوب و بهبود پشتیبانی از پس‌زمینه', source: 'github', category: 'ویدیو', developer: 'Team NewPipe', iconColor: 'red', iconType: 'Clapperboard' },
  { name: 'فلوریس‌برد', nameEn: 'FlorisBoard', pkg: 'dev.patrickgold.florisboard', latest: '0.4.3', changelog: 'بهبود پیشنهاد کلمات فارسی و پشتیبانی از تم‌های دینامیک', source: 'github', category: 'ابزار', developer: 'patrickgold', iconColor: 'violet', iconType: 'Keyboard' },
]

const CATALOG_BY_PKG = new Map<string, CatalogEntry>()
for (const c of CATALOG) {
  CATALOG_BY_PKG.set((c).pkg, c)
}

// ---------- مخازن گیت‌هاب دنبال‌شده ----------

const REPOS_SEED: Array<Omit<GithubRepoItem, 'id'>> = [
  { fullName: 'material-components/material-components-android', description: 'کتابخانه اجزای ماژولار برای اندروید بر پایه Material Design 3', latestVersion: '1.12.0', installedVersion: null, stars: 16400, language: 'Kotlin', isNew: false, installed: false, changelog: '', appPackage: 'com.material.components' },
  { fullName: 'tachiyomiorg/tachiyomi', description: 'خواننده مانگا آزاد و متن‌باز برای اندروید', latestVersion: 'r5021', installedVersion: null, stars: 31000, language: 'Kotlin', isNew: false, installed: false, changelog: '', appPackage: 'org.tachiyomi' },
  { fullName: 'videolan/vlc-android', description: 'پخش‌کننده رسانه VLC برای اندروید', latestVersion: '3.5.7', installedVersion: null, stars: 2800, language: 'Kotlin', isNew: false, installed: false, changelog: '', appPackage: 'org.videolan.vlc' },
  { fullName: 'ReVancedTeam/ReVanced-Manager', description: 'سازنده پچ‌های ReVanced برای اپلیکیشن‌های اندروید', latestVersion: '1.22.0', installedVersion: null, stars: 18500, language: 'Dart', isNew: false, installed: false, changelog: '', appPackage: 'app.revanced.manager.flutter' },
  { fullName: 'florisboard/florisboard', description: 'کیبورد متن‌باز سبک و فارسی‌پسند برای اندروید', latestVersion: '0.4.3', installedVersion: null, stars: 6900, language: 'Kotlin', isNew: false, installed: false, changelog: '', appPackage: 'dev.patrickgold.florisboard' },
  { fullName: 'teamnewpipe/NewPipe', description: 'رابط سبک و آزاد برای یوتیوب بدون تبلیغات', latestVersion: '0.27.2', installedVersion: null, stars: 33000, language: 'Java', isNew: false, installed: false, changelog: '', appPackage: 'org.schabi.newpipe' },
]

// ---------- حامیان نمونه (بخش حمایت مالی) ----------

const SUPPORTERS_SEED: Array<Omit<SupporterItem, 'id' | 'createdAt'>> = [
  { name: 'محمدرضا احمدی', tier: 'gold', amount: 250000, message: 'بهترین برنامه مدیریت آپدیت! 🚀' },
  { name: 'سارا کریمی', tier: 'silver', amount: 100000, message: null },
  { name: 'حسین نجفی', tier: 'bronze', amount: 50000, message: 'دمتون گرم، کارتون حرف نداره' },
  { name: 'کاربر ناشناس', tier: 'one-time', amount: 25000, message: null },
  { name: 'فاطمه صادقی', tier: 'silver', amount: 100000, message: 'امیدوارم همیشه فعال باشید' },
  { name: 'علی رضایی', tier: 'one-time', amount: 10000, message: null },
]

// ---------- شکل داده ذخیره‌شده ----------

interface DBShape {
  version: number
  /** کش آخرین اسکن — برنامه‌های واقعی گوشی */
  apps: InstalledApp[]
  history: HistoryItem[]
  repos: GithubRepoItem[]
  settings: SettingsT
}

function defaultSettings(now: number): SettingsT {
  return {
    notifications: true,
    notifyNewUpdates: true,
    notifySecurity: true,
    notifyBeta: false,
    darkTheme: true,
    accentTheme: 'green',
    syncWithSystem: false,
    scheduledTheme: 'manual',
    dataSaver: false,
    autoUpdateWifi: true,
    scheduledChecks: 'daily',
    sourceGooglePlay: true,
    sourceBazaar: true,
    sourceMyket: true,
    sourceGithub: true,
    sourceCustom: false,
    isPremium: false,
    premiumPlan: null,
    supporterTier: null,
    onboarded: false,
  }
}

function uid(): string {
  return 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

function buildSeed(): DBShape {
  return {
    version: 2,
    apps: [],
    history: [],
    repos: REPOS_SEED.map((r, i) => ({ ...r, id: 'repo-' + i })),
    settings: defaultSettings(Date.now()),
  }
}

// ---------- خواندن/نوشتن ----------

let cache: DBShape | null = null

function load(): DBShape {
  if (cache) return cache
  if (typeof window === 'undefined') {
    return buildSeed()
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      cache = JSON.parse(raw) as DBShape
      return cache
    }
  } catch { /* داده خراب — بازسازی */ }
  cache = buildSeed()
  save()
  return cache
}

function save(): void {
  if (typeof window === 'undefined' || !cache) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch { /* پر بودن حافظه — نادیده بگیر */ }
}

// ---------- ابزار مقایسه نسخه ----------

/** آیا نسخه‌ی candidate از current جدیدتر است؟ (مقایسه عددی قطعه‌به‌قطعه) */
export function isNewerVersion(candidate: string, current: string): boolean {
  const clean = (v: string) => v.replace(/^v/i, '').split(/[.\-+_]/).map((x) => parseInt(x, 10) || 0)
  const a = clean(candidate)
  const b = clean(current)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    if (x !== y) return x > y
  }
  return false
}

// ---------- ساخت لیست برنامه‌ها از داده‌ی نیتیو گوشی ----------

export function buildAppsFromNative(natives: NativeAppInfo[]): InstalledApp[] {
  return natives
    .map((n) => {
      const cat = CATALOG_BY_PKG.get(n.packageName)
      const hasUpdate = cat ? isNewerVersion(cat.latest, n.versionName) : false
      const app: InstalledApp = {
        id: 'app-' + n.packageName,
        name: cat?.name ?? n.appName,
        nameEn: cat?.nameEn ?? n.appName,
        package: n.packageName,
        version: n.versionName,
        newVersion: hasUpdate && cat ? cat.latest : null,
        changelog: hasUpdate && cat?.changelog ? cat.changelog : '',
        sizeMB: n.sizeMB,
        iconColor: cat?.iconColor ?? 'slate',
        iconType: cat?.iconType ?? 'Package',
        iconBase64: n.iconBase64 ?? null,
        source: cat?.source ?? (n.isSystem ? 'system' : 'bazaar'),
        category: cat?.category ?? 'برنامه',
        developer: cat?.developer ?? '—',
        installedAt: new Date(n.installTime).toISOString(),
        lastCheck: new Date().toISOString(),
        system: n.isSystem,
      }
      return app
    })
    .sort((a, b) => {
      if (Boolean(a.newVersion) !== Boolean(b.newVersion)) return a.newVersion ? -1 : 1
      if (a.system !== b.system) return a.system ? 1 : -1
      return a.name.localeCompare(b.name, 'fa')
    })
}

/** ذخیره کش برنامه‌ها در حافظه محلی */
export function saveAppsCache(apps: InstalledApp[]): void {
  const db = load()
  db.apps = apps
  save()
}

/** خواندن کش برنامه‌ها (برای نمایش سریع قبل از اسکن) */
export function loadAppsCache(): InstalledApp[] {
  return [...load().apps]
}

// ---------- حالت نمایشی (فقط پیش‌نمایش وب — روی گوشی استفاده نمی‌شود) ----------

export function demoApps(): InstalledApp[] {
  const now = Date.now()
  const rows: Array<{ pkg: string; version: string; hasUpdate: boolean; sizeMB: number }> = [
    { pkg: 'com.digikala', version: '6.4.1', hasUpdate: true, sizeMB: 65.3 },
    { pkg: 'com.instagram.android', version: '356.0.0', hasUpdate: true, sizeMB: 85.4 },
    { pkg: 'org.telegram.messenger', version: '10.6.4', hasUpdate: true, sizeMB: 62.2 },
    { pkg: 'app.snapp.passenger', version: '6.1.0', hasUpdate: true, sizeMB: 48.1 },
    { pkg: 'com.snappfood', version: '5.2.1', hasUpdate: false, sizeMB: 41.8 },
    { pkg: 'app.bale.messenger', version: '3.5.2', hasUpdate: true, sizeMB: 38.9 },
    { pkg: 'com.aparat', version: '5.9.0', hasUpdate: true, sizeMB: 34.6 },
    { pkg: 'com.soroush.plus', version: '3.1.8', hasUpdate: true, sizeMB: 28.4 },
    { pkg: 'com.torob.mobile', version: '4.1.2', hasUpdate: false, sizeMB: 22.7 },
    { pkg: 'com.mellat.bbank', version: '10.2.0', hasUpdate: true, sizeMB: 31.5 },
    { pkg: 'com.filimo', version: '8.2.3', hasUpdate: true, sizeMB: 29.8 },
    { pkg: 'com.whatsapp', version: '2.24.20', hasUpdate: false, sizeMB: 74.2 },
    { pkg: 'com.google.android.apps.maps', version: '11.115.01', hasUpdate: false, sizeMB: 96.7 },
    { pkg: 'com.google.android.youtube', version: '19.05.36', hasUpdate: true, sizeMB: 118.3 },
    { pkg: 'org.schabi.newpipe', version: '0.27.0', hasUpdate: true, sizeMB: 12.8 },
    { pkg: 'dev.patrickgold.florisboard', version: '0.4.2', hasUpdate: false, sizeMB: 16.1 },
  ]
  return rows.map((r, i) => {
    const cat = CATALOG_BY_PKG.get(r.pkg)!
    const app: InstalledApp = {
      id: 'demo-' + i,
      name: cat.name,
      nameEn: cat.nameEn,
      package: r.pkg,
      version: r.version,
      newVersion: r.hasUpdate ? cat.latest : null,
      changelog: r.hasUpdate && cat.changelog ? cat.changelog : '',
      sizeMB: r.sizeMB,
      iconColor: cat.iconColor,
      iconType: cat.iconType,
      iconBase64: null,
      source: cat.source,
      category: cat.category,
      developer: cat.developer,
      installedAt: new Date(now - (i + 1) * 86400000).toISOString(),
      lastCheck: new Date(now - 3600000).toISOString(),
      system: false,
    }
    return app
  })
}

// ---------- تاریخچه (فقط رویدادهای واقعی کاربر) ----------

export function listHistory(): HistoryItem[] {
  return [...load().history].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 100)
}

export function addHistory(item: Omit<HistoryItem, 'id'>): HistoryItem {
  const db = load()
  const full: HistoryItem = { ...item, id: uid() }
  db.history = [full, ...db.history].slice(0, 100)
  save()
  return full
}

export function clearHistory(): void {
  load().history = []
  save()
}

// ---------- تنظیمات ----------

export function getSettings(): SettingsT {
  return load().settings
}

const ALLOWED_KEYS = [
  'notifications', 'notifyNewUpdates', 'notifySecurity', 'notifyBeta',
  'darkTheme', 'accentTheme', 'syncWithSystem', 'scheduledTheme',
  'dataSaver', 'autoUpdateWifi', 'scheduledChecks',
  'sourceGooglePlay', 'sourceBazaar', 'sourceMyket', 'sourceGithub', 'sourceCustom',
  'isPremium', 'premiumPlan', 'supporterTier', 'onboarded',
] as const

export function updateSettings(patch: Partial<SettingsT>): SettingsT {
  const db = load()
  const clean: Record<string, unknown> = {}
  for (const key of ALLOWED_KEYS) {
    if (key in (patch as Record<string, unknown>)) clean[key] = (patch as Record<string, unknown>)[key]
  }
  db.settings = { ...db.settings, ...(clean as Partial<SettingsT>) }
  save()
  return db.settings
}

// ---------- گیت‌هاب (داده زنده از API گیت‌هاب) ----------

export function listRepos(): GithubRepoItem[] {
  return [...load().repos]
}

interface LiveRepoInfo {
  stars?: number
  description?: string
  tag?: string
  notes?: string
}

async function fetchRepoLive(fullName: string): Promise<LiveRepoInfo | null> {
  try {
    const [repoRes, relRes] = await Promise.allSettled([
      fetch(`https://api.github.com/repos/${fullName}`),
      fetch(`https://api.github.com/repos/${fullName}/releases/latest`),
    ])
    const out: LiveRepoInfo = {}
    if (repoRes.status === 'fulfilled' && repoRes.value.ok) {
      const j = (await repoRes.value.json()) as { stargazers_count?: number; description?: string }
      out.stars = j.stargazers_count
      out.description = j.description ?? undefined
    }
    if (relRes.status === 'fulfilled' && relRes.value.ok) {
      const j = (await relRes.value.json()) as { tag_name?: string; body?: string }
      out.tag = j.tag_name
      out.notes = j.body
    }
    return out
  } catch {
    return null
  }
}

/**
 * سینک واقعی: داده زنده از api.github.com + وضعیت نصب واقعی از برنامه‌های گوشی.
 * اگر اینترنت نبود، همان کش قبلی برمی‌گردد (false).
 */
export async function syncReposLive(installedApps: InstalledApp[]): Promise<{ repos: GithubRepoItem[]; live: boolean }> {
  const db = load()
  const repos = [...db.repos]

  const results = await Promise.allSettled(repos.map((r) => fetchRepoLive(r.fullName)))
  let liveCount = 0

  repos.forEach((repo, i) => {
    const res = results[i]
    if (res.status === 'fulfilled' && res.value && (res.value.tag || res.value.stars !== undefined)) {
      liveCount++
      if (res.value.stars !== undefined) repo.stars = res.value.stars
      if (res.value.description) repo.description = res.value.description
      if (res.value.tag) repo.latestVersion = res.value.tag.replace(/^v/i, '')
      if (res.value.notes) {
        repo.changelog = res.value.notes
          .replace(/\r/g, '')
          .split('\n')
          .filter((l) => !l.startsWith('<!--'))
          .join('\n')
          .slice(0, 600)
      }
    }
    // وضعیت نصب واقعی
    const installedApp = installedApps.find((a) => a.package && a.package === repo.appPackage)
    repo.installed = Boolean(installedApp)
    repo.installedVersion = installedApp ? installedApp.version : null
    repo.isNew = Boolean(
      repo.installedVersion &&
      isNewerVersion(repo.latestVersion, repo.installedVersion)
    )
  })

  if (liveCount > 0) {
    db.repos = repos
    save()
    return { repos, live: true }
  }
  return { repos, live: false }
}

// ---------- تبلیغات (خالی — تا برند واقعی اضافه شود) ----------

export function listAds(): AdItemT[] {
  return []
}

// ---------- حامیان ----------

export function listSupporters(): SupporterItem[] {
  const now = Date.now()
  const day = 86400000
  return SUPPORTERS_SEED.map((s, i) => ({
    ...s,
    id: 'sup-' + i,
    createdAt: new Date(now - (i + 2) * day).toISOString(),
  })).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function addSupporter(input: { name: string; tier: SupporterItem['tier']; amount: number; message?: string | null }): SupporterItem {
  const item: SupporterItem = {
    id: uid(),
    name: input.name,
    tier: input.tier,
    amount: input.amount,
    message: input.message ?? null,
    createdAt: new Date().toISOString(),
  }
  return item
}

// ---------- اشتراک ویژه (فعال‌سازی محلی — پرداخت واقعی متصل نیست) ----------

export function activatePremium(plan: 'monthly' | 'yearly' | 'lifetime'): SettingsT {
  const db = load()
  db.settings.isPremium = true
  db.settings.premiumPlan = plan
  save()
  return db.settings
}

export function cancelPremium(): SettingsT {
  const db = load()
  db.settings.isPremium = false
  db.settings.premiumPlan = null
  save()
  return db.settings
}
