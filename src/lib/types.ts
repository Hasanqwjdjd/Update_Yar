// انواع مشترک برنامه آپدیت‌یار

export type AppSource = 'googleplay' | 'bazaar' | 'myket' | 'github' | 'system' | 'custom'

export interface InstalledApp {
  id: string
  name: string
  nameEn: string
  package: string
  version: string
  newVersion: string | null
  changelog: string
  sizeMB: number
  iconColor: string
  iconType: string
  /** آیکون واقعی برنامه (base64 PNG) — فقط روی گوشی از پلاگین نیتیو می‌آید */
  iconBase64?: string | null
  source: AppSource
  category: string
  developer: string
  installedAt: string
  lastCheck: string | null
  system: boolean
}

export interface HistoryItem {
  id: string
  appName: string
  iconColor: string
  iconType: string
  package: string
  fromVersion: string
  toVersion: string
  source: string
  sizeMB: number
  status: 'completed' | 'failed'
  date: string
}

export interface GithubRepoItem {
  id: string
  fullName: string
  description: string
  latestVersion: string
  installedVersion: string | null
  stars: number
  language: string
  isNew: boolean
  installed: boolean
  changelog: string
  appPackage: string | null
  /** مخزنی که خود کاربر اضافه کرده (قابل حذف) */
  custom?: boolean
}

/** رسید پرداخت واقعی (پس از تأیید درگاه) — روی همین گوشی ذخیره می‌شود */
export interface PaymentRecord {
  id: string
  kind: 'premium' | 'support'
  plan?: string
  amountToman: number
  authority: string
  refId: string
  gateway: 'zarinpal'
  date: string
}

export interface SupporterItem {
  id: string
  name: string
  tier: 'one-time' | 'bronze' | 'silver' | 'gold'
  amount: number
  message: string | null
  createdAt: string
}

export interface AdItemT {
  id: string
  title: string
  description: string
  ctaText: string
  imageUrl: string | null
  color: string
  link: string
  placement: 'feed' | 'banner'
}

export interface SettingsT {
  notifications: boolean
  notifyNewUpdates: boolean
  notifySecurity: boolean
  notifyBeta: boolean
  darkTheme: boolean
  accentTheme: 'green' | 'purple' | 'blue'
  syncWithSystem: boolean
  scheduledTheme: 'manual' | 'auto' | 'night'
  dataSaver: boolean
  autoUpdateWifi: boolean
  scheduledChecks: 'off' | 'daily' | 'weekly'
  sourceGooglePlay: boolean
  sourceBazaar: boolean
  sourceMyket: boolean
  sourceGithub: boolean
  sourceCustom: boolean
  isPremium: boolean
  premiumPlan: string | null
  /** انقضای اشتراک (ISO) — برای پلن مادام‌العمر null */
  premiumUntil: string | null
  supporterTier: string | null
  /** کد مرچنت زارین‌پال توسعه‌دهنده — بدون آن پرداخت واقعی ممکن نیست */
  zarinpalMerchant: string
  onboarded: boolean
}

export const SOURCE_LABELS: Record<AppSource, string> = {
  googleplay: 'گوگل‌پلی',
  bazaar: 'کافه‌بازار',
  myket: 'مایکت',
  github: 'گیت‌هاب',
  system: 'سیستمی',
  custom: 'منبع سفارشی',
}

export const SOURCE_COLORS: Record<AppSource, string> = {
  googleplay: 'text-emerald-500 bg-emerald-500/10',
  bazaar: 'text-rose-500 bg-rose-500/10',
  myket: 'text-orange-500 bg-orange-500/10',
  github: 'text-foreground bg-foreground/10',
  system: 'text-slate-400 bg-slate-400/10',
  custom: 'text-teal-500 bg-teal-500/10',
}
