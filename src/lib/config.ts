/**
 * تنظیمات سراسری «آپدیت‌یار» — تنها منبع حقیقت برای نسخه و لینک‌ها
 * توجه: APP_VERSION باید با versionName در android/app/build.gradle یکسان نگه داشته شود.
 */
export const APP_VERSION = '1.4.1'
export const APP_VERSION_CODE = 6

/** ایمیل پشتیبانی رسمی برنامه — در همه‌ی بخش‌هایی که ایمیل لازم است از همین استفاده می‌شود */
export const SUPPORT_EMAIL = 'updateyarsupport@gmail.com'

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  درگاه پرداخت «آپدیت‌یار»
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  PAYMENT_MODE دو حالت دارد:
 *
 *  ۱) 'donito'   ← فعالِ فعلی
 *     صفحه‌ی شخصی پرداخت توسعه‌دهنده در Donito (پول مستقیماً به حساب خودتان
 *     واریز می‌شود) — بدون نیاز به کد پذیرندگی/Merchant و بدون نیاز به ثبت‌نام.
 *     جریان: باز شدن صفحه‌ی پرداخت در مرورگر ← کاربر پرداخت می‌کند ← برمی‌گردد
 *     به اپ ← شماره‌ی پیگیریِ رسید را وارد می‌کند ← اشتراک/حمایت فعال می‌شود.
 *
 *  ۲) 'zarinpal' ← فقط وقتی Merchant ID گرفتید
 *     درگاه رسمی زرین‌پال با تأیید خودکار سمت API (بدون اعتماد به ورودی کاربر).
 *     برای فعال‌سازی: در zarinpal.com ثبت‌نام کنید، Merchant ID را پایین وارد
 *     کنید، صفحه‌ی public/zarinpal-callback.html را روی یک هاست استاتیک (مثل
 *     GitHub Pages) بگذارید و آدرسش را در ZARINPAL_CALLBACK_URL بنویسید و
 *     ZARINPAL_SANDBOX را false کنید. هیچ تغییر کد دیگری لازم نیست.
 */
export const PAYMENT_MODE: 'donito' | 'zarinpal' = 'donito'

/** صفحه‌ی شخصی پرداخت توسعه‌دهنده (حالت donito) — پول به همین حساب واریز می‌شود */
export const DONITO_PAYMENT_URL = 'https://donito.me/ehsan2noven'

/**
 * درگاه اینترنتی شاپرک (سپ) — فقط وقتی حساب IPG رسمی (پذیرندگی) داشتید قابل
 * استفاده است؛ باز کردن این لینک بدون پارامترهای ترمینال واقعی نتیجه‌ای ندارد.
 * به‌عنوان مرجع نگه داشته می‌شود.
 */
export const SEP_ONLINEPG_URL = 'https://sep.shaparak.ir/OnlinePG/OnlinePG'

/**
 * تنظیمات درگاه زرین‌پال (فقط برای حالت 'zarinpal'):
 *
 * 1) ZARINPAL_MERCHANT_ID → بعد از ثبت‌نام در zarinpal.com (UUID شبیه xxxxxxxx-...)
 * 2) ZARINPAL_CALLBACK_URL → آدرس HTTPS صفحه‌ی public/zarinpal-callback.html بعد از آپلود روی هاست استاتیک
 * 3) ZARINPAL_SANDBOX → اول true (درگاه آزمایشی)، بعد از تستِ موفق false
 */
export const ZARINPAL_MERCHANT_ID = 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'
export const ZARINPAL_CALLBACK_URL = 'https://YOUR-USERNAME.github.io/updatayar-callback/zarinpal-callback.html'
export const ZARINPAL_SANDBOX = true
