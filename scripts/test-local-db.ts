/**
 * تست عملکردی لایه داده آپدیت‌یار (بدون نیاز به گوشی)
 * اجرا: bun scripts/test-local-db.ts
 */

// ---- polyfill محیط مرورگر ----
const store = new Map<string, string>()
const fakeLocalStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v) },
  removeItem: (k: string) => { store.delete(k) },
  clear: () => store.clear(),
  key: (i: number) => Array.from(store.keys())[i] ?? null,
  get length() { return store.size },
}
// @ts-expect-error محیط تست
globalThis.window = { localStorage: fakeLocalStorage }

let fetchCalls = 0
// @ts-expect-error محیط تست
globalThis.fetch = async (url: string | URL) => {
  fetchCalls++
  const u = String(url)
  const json = (body: unknown) => ({
    ok: true,
    json: async () => body,
  })
  if (u === 'https://api.github.com/repos/testowner/testrepo') {
    return json({ stargazers_count: 1234, description: 'تست مخزن', language: 'Kotlin' })
  }
  if (u === 'https://api.github.com/repos/testowner/testrepo/releases/latest') {
    return json({ tag_name: 'v2.5.1', body: '- رفع باگ\n- بهبود سرعت' })
  }
  if (u.startsWith('https://api.github.com/repos/bad/')) {
    return { ok: true, json: async () => ({ message: 'Not Found' }) }
  }
  if (u.includes('releases/latest')) {
    return json({ tag_name: 'v9.9.9', body: 'x' })
  }
  return json({ stargazers_count: 10, description: 'd', language: 'JS' })
}

const {
  addCustomRepo, listRepos, removeRepo, validateRepo, normalizeRepoName,
  syncReposLive, buildAppsFromNative, saveAppsCache, loadAppsCache,
  activatePremium, cancelPremium, isPremiumActive, getSettings,
  addSupporter, listSupporters, recordPayment, listPayments,
  addHistory, listHistory, clearHistory, updateSettings,
} = await import('../src/lib/local-db')

let pass = 0
let fail = 0
function check(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ✓', name) } else { fail++; console.log('  ✗ FAIL:', name) }
}

console.log('— مخازن سفارشی —')
check('normalize لینک کامل گیت‌هاب', normalizeRepoName('https://github.com/teamnewpipe/NewPipe/') === 'teamnewpipe/NewPipe')
check('normalize نام ساده', normalizeRepoName('  teamnewpipe/NewPipe.git ') === 'teamnewpipe/NewPipe')
check('normalize نام غلط → خالی', normalizeRepoName('فقط متن') === '')

const v = await validateRepo('testowner/testrepo')
check('validateRepo موفق', v.ok && v.info?.tag === 'v2.5.1')
const added = addCustomRepo('testowner/testrepo', v.info!)
check('addCustomRepo اضافه شد', listRepos().some((r) => r.fullName === 'testowner/testrepo' && r.custom))
check('addCustomRepo نسخه بدون v', listRepos().find((r) => r.custom)?.latestVersion === '2.5.1')
const v2 = await validateRepo('bad/nothing')
check('validateRepo مخزن ناموجود → خطا', !v2.ok && (v2.error ?? '').includes('وجود ندارد'))
const again = addCustomRepo('testowner/testrepo', v.info!)
check('add دوباره → duplicate نمی‌سازد', listRepos().filter((r) => r.fullName === 'testowner/testrepo').length === 1)
removeRepo(again.id)
check('removeRepo حذف سفارشی', !listRepos().some((r) => r.fullName === 'testowner/testrepo'))
check('seed مخازن مرجع سر جایش است', listRepos().length >= 6)

console.log('— سینک زنده گیت‌هاب —')
const before = (await import('../src/lib/local-db')).listRepos()[0].stars
const sync = await syncReposLive([])
check('syncReposLive داده زنده گرفت', sync.live && fetchCalls >= 2)
const after = sync.repos[0].stars
check('ستاره‌ها به‌روز شد', after !== before)

console.log('— اسکن نیتیو —')
const natives = [
  { packageName: 'com.digikala', appName: 'دیجی‌کالا', versionName: '6.4.0', versionCode: 640, isSystem: false, installTime: Date.now() - 86400000, sizeMB: 65.2 },
  { packageName: 'com.example.unknown', appName: 'اپ ناشناخته', versionName: '1.0', versionCode: 1, isSystem: false, installTime: Date.now(), sizeMB: 5 },
  { packageName: 'com.android.settings', appName: 'Settings', versionName: '13', versionCode: 33, isSystem: true, installTime: Date.now(), sizeMB: 40 },
]
const apps = buildAppsFromNative(natives as never)
check('۳ برنامه نگاشت شد', apps.length === 3)
const digi = apps.find((a) => a.package === 'com.digikala')!
check('کاتالوگ: دیجی‌کالا آپدیت دارد', digi.newVersion === '6.5.0')
check('کاتالوگ: نام فارسی از کاتالوگ', digi.name === 'دیجی‌کالا')
check('اپ ناشناخته بدون آپدیت', apps.find((a) => a.package === 'com.example.unknown')?.newVersion === null)
check('سیستمی تفکیک شد', apps.find((a) => a.package === 'com.android.settings')?.system === true)
check('مرتب‌سازی: آپدیت‌دار اول', apps[0].package === 'com.digikala')
saveAppsCache(apps)
check('کش ذخیره/خواندن', loadAppsCache().length === 3)

console.log('— اشتراک و پرداخت —')
check('پیش‌فرض غیرپریمیوم', !isPremiumActive(getSettings()))
activatePremium('monthly')
const st = getSettings()
check('اشتراک فعال شد', isPremiumActive(st) && st.isPremium && !!st.premiumUntil)
check('مرچنت ذخیره می‌شود', updateSettings({ zarinpalMerchant: 'a'.repeat(36) }).zarinpalMerchant.length === 36)
// انقضای ماهانه → ۳۱ روز بعد
check('انقضای ماهانه معقول', Math.abs(new Date(st.premiumUntil!).getTime() - (Date.now() + 31 * 86400000)) < 60000)
activatePremium('lifetime')
check('مادام‌العمر بدون انقضا', isPremiumActive(getSettings()) && getSettings().premiumUntil === null)
cancelPremium()
check('لغو اشتراک', !isPremiumActive(getSettings()))

console.log('— حامیان واقعی —')
check('بدون حامی فیک', listSupporters().length === 0)
addSupporter({ name: 'تست حامی', tier: 'one-time', amount: 25000, message: 'موفق باشی' })
check('حامی واقعی ثبت شد', listSupporters().length === 1 && listSupporters()[0].name === 'تست حامی')

console.log('— رسیدها و تاریخچه —')
recordPayment({ kind: 'premium', plan: 'yearly', amountToman: 149000, authority: 'A0001', refId: '123456', gateway: 'zarinpal', date: new Date().toISOString() })
check('رسید ثبت شد', listPayments().length === 1 && listPayments()[0].refId === '123456')
addHistory({ appName: 'دیجی‌کالا', iconColor: 'rose', iconType: 'ShoppingBag', package: 'com.digikala', fromVersion: '6.4.0', toVersion: '6.5.0', source: 'bazaar', sizeMB: 65, status: 'completed', date: new Date().toISOString() })
check('تاریخچه ثبت شد', listHistory().length === 1)
clearHistory()
check('تاریخچه پاک شد', listHistory().length === 0)

console.log(`\nنتیجه: ${pass} موفق / ${fail} ناموفق`)
process.exit(fail > 0 ? 1 : 0)
