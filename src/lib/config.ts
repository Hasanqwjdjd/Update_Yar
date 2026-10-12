/**
 * تنظیمات سراسری «آپدیت‌یار» — تنها منبع حقیقت برای نسخه و لینک‌ها
 * توجه: APP_VERSION باید با versionName در android/app/build.gradle یکسان نگه داشته شود.
 */
export const APP_VERSION = '1.3'
export const APP_VERSION_CODE = 4

/** مخزن رسمی پروژه (مالک: Hasanqwjdjd) */
export const REPO_URL = 'https://github.com/Hasanqwjdjd/Hasan-Vpn'

/** ایمیل پشتیبانی */
export const SUPPORT_EMAIL = 'support@updateyar.ir'

/** درگاه پرداخت زارین‌پال (v4 / PG) */
export const ZARINPAL_REQUEST_URL = 'https://payment.zarinpal.com/pg/v4/payment/request.json'
export const ZARINPAL_VERIFY_URL = 'https://payment.zarinpal.com/pg/v4/payment/verify.json'
export const zarinpalStartPayUrl = (authority: string) =>
  `https://payment.zarinpal.com/pg/StartPay/${authority}`

/** لینک بازگشت از درگاه به اپ (deep-link) */
export const PAYMENT_CALLBACK = 'updatayar://payment'
