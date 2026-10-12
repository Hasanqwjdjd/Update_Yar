import { db } from '@/lib/db'

// اطمینان از وجود داده اولیه — در اولین فراخوانی API اجرا می‌شود
let seeded = false

const day = 86400000
const now = Date.now()

const APPS: Array<{
  name: string; nameEn: string; pkg: string; version: string; newVersion?: string
  changelog?: string; sizeMB: number; iconColor: string; iconType: string
  source: string; category: string; developer: string; daysAgo: number; system?: boolean
}> = [
  { name: 'دیجی‌کالا', nameEn: 'Digikala', pkg: 'com.digikala', version: '6.4.1', newVersion: '6.5.0', changelog: 'بهبود جستجوی هوشمند، رفع مشکل پرداخت و افزودن بخش پیشنهاد ویژه', sizeMB: 65.3, iconColor: 'rose', iconType: 'ShoppingBag', source: 'bazaar', category: 'خرید', developer: 'دیجی‌کالا', daysAgo: 12 },
  { name: 'اینستاگرام', nameEn: 'Instagram', pkg: 'com.instagram.android', version: '356.0.0', newVersion: '357.0.0', changelog: 'افزودن افکت‌های جدید استوری و بهبود سرعت پخش ریلز', sizeMB: 85.4, iconColor: 'pink', iconType: 'Camera', source: 'googleplay', category: 'شبکه اجتماعی', developer: 'Instagram', daysAgo: 20 },
  { name: 'تلگرام', nameEn: 'Telegram', pkg: 'org.telegram.messenger', version: '10.6.4', newVersion: '10.7.1', changelog: 'تغییرات بهتر در پوشه‌ها و قابلیت جدی برای ویرایش عکس‌ها', sizeMB: 62.2, iconColor: 'sky', iconType: 'Send', source: 'googleplay', category: 'پیام‌رسان', developer: 'Telegram FZ-LLC', daysAgo: 5 },
  { name: 'اسنپ', nameEn: 'Snapp', pkg: 'app.snapp.passenger', version: '6.1.0', newVersion: '6.1.3', changelog: 'بهبود تعیین موقعیت دقیق مبدأ و رفع اشکال کیف پول', sizeMB: 48.1, iconColor: 'emerald', iconType: 'MapPin', source: 'bazaar', category: 'حمل‌ونقل', developer: 'اسنپ', daysAgo: 8 },
  { name: 'اسنپ‌فود', nameEn: 'SnappFood', pkg: 'com.snappfood', version: '5.2.1', sizeMB: 41.8, iconColor: 'pink', iconType: 'UtensilsCrossed', source: 'bazaar', category: 'سفارش غذا', developer: 'اسنپ‌فود', daysAgo: 15 },
  { name: 'بله', nameEn: 'Bale', pkg: 'app.bale.messenger', version: '3.5.2', newVersion: '3.6.0', changelog: 'افزودن پرداخت قبض در چت‌ها و بهبود تماس تصویری', sizeMB: 38.9, iconColor: 'emerald', iconType: 'MessageCircle', source: 'myket', category: 'پیام‌رسان', developer: 'بله', daysAgo: 3 },
  { name: 'آپارات', nameEn: 'Aparat', pkg: 'com.aparat', version: '5.9.0', newVersion: '6.0.1', changelog: 'پخش خودکار جدید، رفع پرش ویدیو و حالت شب بهتر', sizeMB: 34.6, iconColor: 'red', iconType: 'Play', source: 'bazaar', category: 'ویدیو', developer: 'آپارات', daysAgo: 6 },
  { name: 'سروش‌پلاس', nameEn: 'Soroush Plus', pkg: 'com.soroush.plus', version: '3.1.8', newVersion: '3.2.0', changelog: 'بهبود سرعت ارسال پیام و رفع مشکلات نوتیفیکیشن', sizeMB: 28.4, iconColor: 'blue', iconType: 'MessageSquare', source: 'custom', category: 'پیام‌رسان', developer: 'سروش', daysAgo: 9 },
  { name: 'ترب', nameEn: 'Torob', pkg: 'com.torob.mobile', version: '4.1.2', sizeMB: 22.7, iconColor: 'blue', iconType: 'Search', source: 'bazaar', category: 'خرید', developer: 'ترب', daysAgo: 18 },
  { name: 'بانک ملت', nameEn: 'Bank Mellat', pkg: 'com.mellat.bbank', version: '10.2.0', newVersion: '10.3.0', changelog: 'افزودن انتقال کارت‌به‌کارت سریع و بهبود امنیت ورود', sizeMB: 31.5, iconColor: 'red', iconType: 'CreditCard', source: 'myket', category: 'مالی', developer: 'بانک ملت', daysAgo: 11 },
  { name: 'فیلیمو', nameEn: 'Filimo', pkg: 'com.filimo', version: '8.2.3', newVersion: '8.3.0', changelog: 'دانلود آفلاین سریع‌تر و زیرنویس جدید', sizeMB: 29.8, iconColor: 'violet', iconType: 'Film', source: 'bazaar', category: 'سرگرمی', developer: 'فیلیمو', daysAgo: 14 },
  { name: 'واتساپ', nameEn: 'WhatsApp', pkg: 'com.whatsapp', version: '2.24.20', sizeMB: 74.2, iconColor: 'emerald', iconType: 'Phone', source: 'googleplay', category: 'پیام‌رسان', developer: 'Meta', daysAgo: 25 },
  { name: 'گوگل مپس', nameEn: 'Google Maps', pkg: 'com.google.android.maps', version: '11.115.01', sizeMB: 96.7, iconColor: 'emerald', iconType: 'Map', source: 'googleplay', category: 'نقشه', developer: 'Google LLC', daysAgo: 30 },
  { name: 'یوتیوب', nameEn: 'YouTube', pkg: 'com.google.android.youtube', version: '19.05.36', newVersion: '19.06.2', changelog: 'بهبود پخش 4K و مدیریت صف جدید', sizeMB: 118.3, iconColor: 'red', iconType: 'Youtube', source: 'googleplay', category: 'ویدیو', developer: 'Google LLC', daysAgo: 4 },
  { name: 'کدنویس', nameEn: 'CodeEditor', pkg: 'com.codeeditor.mobile', version: '3.5.1', newVersion: '3.6.0', changelog: 'هایلایت سینتکس Kotlin و YAML و رفع باگ قابلیت undo', sizeMB: 19.4, iconColor: 'blue', iconType: 'Code', source: 'github', category: 'ابزار توسعه', developer: 'CodeEditor Team', daysAgo: 7 },
  { name: 'نیوپایپ', nameEn: 'NewPipe', pkg: 'org.schabi.newpipe', version: '0.27.0', newVersion: '0.27.2', changelog: 'رفع مشکل پخش ویدیوهای یوتیوب و بهبود پشتیبانی از پس‌زمینه', sizeMB: 12.8, iconColor: 'red', iconType: 'Clapperboard', source: 'github', category: 'ویدیو', developer: 'Team NewPipe', daysAgo: 2 },
  { name: 'فلوریس‌برد', nameEn: 'FlorisBoard', pkg: 'dev.patrickgold.florisboard', version: '0.4.2', sizeMB: 16.1, iconColor: 'violet', iconType: 'Keyboard', source: 'github', category: 'ابزار', developer: 'patrickgold', daysAgo: 22 },
  { name: 'والپیپرز', nameEn: 'WallpaperX', pkg: 'com.wallpaperx', version: '2.0.5', newVersion: '2.1.0', changelog: 'کتابخانه والپیپر تازه و ویجت شیشه‌ای جدید', sizeMB: 9.6, iconColor: 'teal', iconType: 'Image', source: 'github', category: 'شخصی‌سازی', developer: 'WallpaperX', daysAgo: 1 },
  { name: 'سرویس سیستم اندروید', nameEn: 'Android System', pkg: 'com.android.system', version: '14.0.1', sizeMB: 210, iconColor: 'slate', iconType: 'Cpu', source: 'system', category: 'سیستم', developer: 'Google', daysAgo: 90, system: true },
  { name: 'وب‌ویو اندروید', nameEn: 'Android WebView', pkg: 'com.android.webview', version: '131.0.67', newVersion: '132.0.68', changelog: 'بهبود امنیت و رندر صفحات وب', sizeMB: 87.2, iconColor: 'slate', iconType: 'Globe', source: 'system', category: 'سیستم', developer: 'Google', daysAgo: 60, system: true },
  { name: 'آپدیت‌یار', nameEn: 'UpdateYar', pkg: 'com.updateyar.app', version: '1.3.0', newVersion: '1.3.1', changelog: 'افزودن بخش گیت‌هاب، بهبود سرعت و رفع چند باگ کوچک', sizeMB: 8.4, iconColor: 'emerald', iconType: 'Rocket', source: 'github', category: 'ابزار', developer: 'آپدیت‌یار', daysAgo: 1 },
]

const HISTORY: Array<{ appName: string; iconColor: string; iconType: string; pkg: string; from: string; to: string; source: string; sizeMB: number; status: string; date: Date }> = [
  { appName: 'آپدیت‌یار', iconColor: 'emerald', iconType: 'Rocket', pkg: 'com.updateyar.app', from: '1.2.1', to: '1.3.0', source: 'github', sizeMB: 7.9, status: 'completed', date: new Date(now - 2 * 3600000) },
  { appName: 'دیجی‌کالا', iconColor: 'rose', iconType: 'ShoppingBag', pkg: 'com.digikala', from: '6.3.0', to: '6.4.1', source: 'bazaar', sizeMB: 63.8, status: 'completed', date: new Date(now - 26 * 3600000) },
  { appName: 'اسنپ', iconColor: 'emerald', iconType: 'MapPin', pkg: 'app.snapp.passenger', from: '6.0.4', to: '6.1.0', source: 'bazaar', sizeMB: 46.2, status: 'completed', date: new Date(now - 2 * day) },
  { appName: 'تلگرام', iconColor: 'sky', iconType: 'Send', pkg: 'org.telegram.messenger', from: '10.6.0', to: '10.6.4', source: 'googleplay', sizeMB: 60.1, status: 'completed', date: new Date(now - 3 * day) },
  { appName: 'اینستاگرام', iconColor: 'pink', iconType: 'Camera', pkg: 'com.instagram.android', from: '355.0.0', to: '356.0.0', source: 'googleplay', sizeMB: 84.0, status: 'completed', date: new Date(now - 4 * day) },
  { appName: 'بله', iconColor: 'emerald', iconType: 'MessageCircle', pkg: 'app.bale.messenger', from: '3.4.9', to: '3.5.2', source: 'myket', sizeMB: 37.5, status: 'completed', date: new Date(now - 8 * day) },
  { appName: 'آپارات', iconColor: 'red', iconType: 'Play', pkg: 'com.aparat', from: '5.8.2', to: '5.9.0', source: 'bazaar', sizeMB: 33.2, status: 'completed', date: new Date(now - 9 * day) },
  { appName: 'سروش‌پلاس', iconColor: 'blue', iconType: 'MessageSquare', pkg: 'com.soroush.plus', from: '3.1.6', to: '3.1.8', source: 'custom', sizeMB: 27.9, status: 'completed', date: new Date(now - 10 * day) },
  { appName: 'فیلیمو', iconColor: 'violet', iconType: 'Film', pkg: 'com.filimo', from: '8.2.1', to: '8.2.3', source: 'bazaar', sizeMB: 29.1, status: 'failed', date: new Date(now - 12 * day) },
  { appName: 'ترب', iconColor: 'blue', iconType: 'Search', pkg: 'com.torob.mobile', from: '4.1.0', to: '4.1.2', source: 'bazaar', sizeMB: 22.1, status: 'completed', date: new Date(now - 15 * day) },
  { appName: 'نیوپایپ', iconColor: 'red', iconType: 'Clapperboard', pkg: 'org.schabi.newpipe', from: '0.26.1', to: '0.27.0', source: 'github', sizeMB: 12.1, status: 'completed', date: new Date(now - 17 * day) },
  { appName: 'بانک ملت', iconColor: 'red', iconType: 'CreditCard', pkg: 'com.mellat.bbank', from: '10.1.2', to: '10.2.0', source: 'myket', sizeMB: 30.8, status: 'completed', date: new Date(now - 21 * day) },
]

const REPOS: Array<{ fullName: string; description: string; latestVersion: string; installedVersion: string | null; stars: number; language: string; isNew: boolean; installed: boolean; changelog: string; appPackage: string | null; sortOrder: number }> = [
  { fullName: 'material-components / material-components-android', description: 'کتابخانه اجزای ماژولار برای اندروید بر پایه Material Design 3', latestVersion: '1.12.0 (Stable)', installedVersion: '1.9.0', stars: 16400, language: 'Kotlin', isNew: true, installed: true, changelog: 'به‌روزرسانی مقدماتی برای نسخه بعدی\nافزودن افکت دینامیک به نوار ناوبری', appPackage: 'com.material.components', sortOrder: 0 },
  { fullName: 'tachiyomiorg / tachiyomi', description: 'خواننده مانگا آزاد و متن‌باز برای اندروید', latestVersion: 'r5021', installedVersion: 'r5021', stars: 31000, language: 'Kotlin', isNew: false, installed: true, changelog: 'آخرین نسخه: رفع مسائل نصب‌پذیری و بهبود سرعت بایگانی', appPackage: 'org.tachiyomi', sortOrder: 1 },
  { fullName: 'videolan / vlc-android', description: 'پخش‌کننده رسانه VLC برای اندروید', latestVersion: '3.5.7 (Beta)', installedVersion: '3.5.4', stars: 2800, language: 'Kotlin', isNew: true, installed: true, changelog: 'رفع ترک‌های پخش و قابلیت کازایی پخش خودکار', appPackage: 'org.videolan.vlc', sortOrder: 2 },
  { fullName: 'ReVancedTeam / ReVanced-Manager', description: 'سازنده پچ‌های ReVanced برای اپلیکیشن‌های اندروید', latestVersion: '1.22.0', installedVersion: null, stars: 18500, language: 'Dart', isNew: true, installed: false, changelog: 'پشتیبانی از اندروید ۱۵ و رابط کاربری تازه', appPackage: null, sortOrder: 3 },
  { fullName: 'florisboard / florisboard', description: 'کیبورد متن‌باز سبک و فارسی‌پسند برای اندروید', latestVersion: '0.4.3', installedVersion: '0.4.2', stars: 6900, language: 'Kotlin', isNew: true, installed: true, changelog: 'بهبود پیشنهاد کلمات فارسی و پشتیبانی از تم‌های دینامیک', appPackage: 'dev.patrickgold.florisboard', sortOrder: 4 },
  { fullName: 'teamnewpipe / NewPipe', description: 'رابط سبک و آزاد برای یوتیوب بدون تبلیغات', latestVersion: '0.27.2', installedVersion: '0.27.0', stars: 33000, language: 'Java', isNew: true, installed: true, changelog: 'رفع مشکل پخش و بهبود صف پخش', appPackage: 'org.schabi.newpipe', sortOrder: 5 },
]

const ADS: Array<{ title: string; description: string; ctaText: string; imageUrl: string | null; color: string; link: string; placement: string; priority: number }> = [
  { title: 'حجم آپدیت‌ها را نصف کن!', description: 'با فشرده‌ساز پرو فایل‌های سنگین را بدون افت کیفیت کوچک کن.', ctaText: 'دانلود رایگان', imageUrl: '/ads/ad-compress.jpg', color: 'emerald', link: '#', placement: 'feed', priority: 2 },
  { title: 'علی‌بابا — بلیط هواپیما و قطار', description: 'تخفیف ویژه سفرهای نورانی با کد آپدیت‌یار', ctaText: 'مشاهده تخفیف‌ها', imageUrl: '/ads/ad-travel.jpg', color: 'orange', link: '#', placement: 'feed', priority: 1 },
  { title: 'جای تبلیغ شما اینجاست', description: 'برند شما را به هزاران کاربر آپدیت‌یار برسانید', ctaText: 'سفارش تبلیغ', imageUrl: null, color: 'violet', link: '#', placement: 'banner', priority: 0 },
]

const SUPPORTERS: Array<{ name: string; tier: string; amount: number; message: string | null; createdAt: Date }> = [
  { name: 'محمدرضا احمدی', tier: 'gold', amount: 250000, message: 'بهترین برنامه مدیریت آپدیت! 🚀', createdAt: new Date(now - 2 * day) },
  { name: 'سارا کریمی', tier: 'silver', amount: 100000, message: null, createdAt: new Date(now - 3 * day) },
  { name: 'حسین نجفی', tier: 'bronze', amount: 50000, message: 'دمتون گرم، کارتون حرف نداره', createdAt: new Date(now - 5 * day) },
  { name: 'کاربر ناشناس', tier: 'one-time', amount: 25000, message: null, createdAt: new Date(now - 6 * day) },
  { name: 'فاطمه صادقی', tier: 'silver', amount: 100000, message: 'امیدوارم همیشه فعال باشید', createdAt: new Date(now - 9 * day) },
  { name: 'علی رضایی', tier: 'one-time', amount: 10000, message: null, createdAt: new Date(now - 11 * day) },
]

export async function ensureSeed(): Promise<void> {
  if (seeded) return
  const appCount = await (db as unknown as { installedApp: { count(): Promise<number> } }).installedApp.count()
  if (appCount > 0) { seeded = true; return }

  await db.installedApp.createMany({
    data: APPS.map((a, i) => ({
      name: a.name, nameEn: a.nameEn, package: a.pkg, version: a.version,
      newVersion: a.newVersion ?? null, changelog: a.changelog ?? '', sizeMB: a.sizeMB,
      iconColor: a.iconColor, iconType: a.iconType, source: a.source, category: a.category,
      developer: a.developer, installedAt: new Date(now - a.daysAgo * day),
      lastCheck: new Date(now - 3600000), system: a.system ?? false, sortOrder: i,
    })),
  })

  await db.updateHistory.createMany({
    data: HISTORY.map((h) => ({
      appName: h.appName, iconColor: h.iconColor, iconType: h.iconType,
      package: h.pkg, fromVersion: h.from, toVersion: h.to,
      source: h.source, sizeMB: h.sizeMB, status: h.status, date: h.date,
    })),
  })
  await db.githubRepo.createMany({ data: REPOS })
  await db.adItem.createMany({ data: ADS })
  await db.supporter.createMany({ data: SUPPORTERS })
  await db.appSettings.create({ data: { id: 'main' } })
  seeded = true
}
