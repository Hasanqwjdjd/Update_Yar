'use client'

/**
 * پرداخت «آپدیت‌یار» — دو درگاه، انتخاب با PAYMENT_MODE در lib/config.ts:
 *
 *  ▸ حالت 'donito' (فعالِ فعلی — بدون نیاز به کد پذیرندگی):
 *      1) startPayment → صفحه‌ی شخصی پرداخت توسعه‌دهنده (donito.me/ehsan2noven)
 *         در مرورگر گوشی باز می‌شود؛ پول مستقیماً به حساب توسعه‌دهنده واریز می‌شود.
 *      2) کاربر برمی‌گردد و شماره‌ی پیگیریِ رسید (از صفحه‌ی پرداخت/پیامک بانک) را
 *         در اپ وارد می‌کند → confirmPayment.
 *      3) رسید ثبت و اشتراک/حمایت فعال می‌شود. همان شماره‌ی پیگیری دوباره قابل
 *         ثبت نیست (جلوگیری از ثبت تکراری).
 *
 *  ▸ حالت 'zarinpal' (فقط بعد از گرفتن Merchant ID):
 *      1) startPayment → تماس واقعی با API «درخواست پرداخت» زرین‌پال، گرفتن
 *         Authority، باز شدن صفحه‌ی پرداخت زرین‌پال.
 *      2) بازگشت خودکار با deep-link (updatayar://payment) → verifyZarinpalPayment
 *         مستقیماً از API «تأیید پرداخت» زرین‌پال می‌پرسد که آیا این Authority با
 *         همین مبلغ واقعاً پرداخت شده یا نه (کد ۱۰۰ یا ۱۰۱ = موفق).
 *      3) هیچ عدد دلخواهی از کاربر پذیرفته نمی‌شود — تأیید همیشه از API زرین‌پال.
 */

import {
  PAYMENT_MODE, DONITO_PAYMENT_URL,
  ZARINPAL_MERCHANT_ID, ZARINPAL_CALLBACK_URL, ZARINPAL_SANDBOX,
} from '@/lib/config'
import { openExternal } from '@/lib/native'
import {
  activatePremium, addSupporter, recordPayment, updateSettings, findPaymentByRef,
} from '@/lib/local-db'
import type { PaymentRecord } from '@/lib/types'

export type PremiumPlan = 'monthly' | 'yearly' | 'lifetime'

/** در حال حاضر کدام درگاه فعال است؟ (شیت‌ها برای نمایش متن درست استفاده می‌کنند) */
export const isDonitoMode = (): boolean => PAYMENT_MODE === 'donito'

interface PendingPayment {
  /** فقط در حالت زرین‌پال — در حالت Donito خالی می‌ماند */
  authority?: string
  gateway: 'zarinpal' | 'donito'
  amountToman: number
  description: string
  kind: 'premium' | 'support'
  plan?: PremiumPlan
  supporter?: { name?: string; message?: string }
  createdAt: number
}

const PENDING_KEY = 'updatayar-pending-payment-v3'
const PENDING_TTL_MS = 2 * 3600 * 1000 // ۲ ساعت — بعدش تراکنش احتمالاً منقضی شده

export interface PaymentDone {
  kind: 'premium' | 'support'
  amountToman: number
  refId: string
  plan?: PremiumPlan
  receipt: PaymentRecord
}

const REQUEST_URL = ZARINPAL_SANDBOX
  ? 'https://sandbox.zarinpal.com/pg/v4/payment/request.json'
  : 'https://api.zarinpal.com/pg/v4/payment/request.json'

const VERIFY_URL = ZARINPAL_SANDBOX
  ? 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json'
  : 'https://api.zarinpal.com/pg/v4/payment/verify.json'

const STARTPAY_BASE = ZARINPAL_SANDBOX
  ? 'https://sandbox.zarinpal.com/pg/StartPay/'
  : 'https://www.zarinpal.com/pg/StartPay/'

// ---------- ابزار کمکی: یکسان‌سازی ارقام فارسی/عربی به انگلیسی ----------

/** «۱۲۳۴» و «٤٥٦» و «1234» همه به "1234" تبدیل می‌شوند — برای شماره پیگیری رسید */
export function normalizeDigits(input: string): string {
  const fa = '۰۱۲۳۴۵۶۷۸۹'
  const ar = '٠١٢٣٤٥٦٧٨٩'
  return input.replace(/[۰-۹٠-٩]/g, (ch) => {
    const i = fa.indexOf(ch)
    return String(i >= 0 ? i : ar.indexOf(ch))
  })
}

// ---------- وضعیت پرداخت در انتظار ----------

function readPending(): PendingPayment | null {
  try {
    const raw = window.localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as PendingPayment
    if (!p?.amountToman || !p?.gateway) return null
    if (p.gateway === 'zarinpal' && !p.authority) return null
    if (Date.now() - p.createdAt > PENDING_TTL_MS) {
      window.localStorage.removeItem(PENDING_KEY)
      return null
    }
    return p
  } catch {
    return null
  }
}

function writePending(p: PendingPayment): void {
  try { window.localStorage.setItem(PENDING_KEY, JSON.stringify(p)) } catch { /* noop */ }
}

export function hasPendingPayment(): boolean {
  return readPending() !== null
}

export function getPendingPayment(): PendingPayment | null {
  return readPending()
}

export function cancelPendingPayment(): void {
  try { window.localStorage.removeItem(PENDING_KEY) } catch { /* noop */ }
}

// ---------- شروع پرداخت (هر دو درگاه) ----------

export interface StartPaymentInput {
  amountToman: number
  description: string
  kind: 'premium' | 'support'
  plan?: PremiumPlan
  supporter?: { name?: string; message?: string }
}

export type StartPaymentResult =
  | { ok: true }
  | { ok: false; error: string }

function validateAmount(amountToman: number): string | null {
  if (!Number.isFinite(amountToman) || amountToman < 1000) {
    return 'مبلغ پرداخت نامعتبر است (حداقل ۱٬۰۰۰ تومان)'
  }
  return null
}

/** شروع پرداخت — بسته به PAYMENT_MODE به درگاه درست می‌رود (شیت‌ها همین را صدا می‌زنند) */
export async function startPayment(input: StartPaymentInput): Promise<StartPaymentResult> {
  const amountError = validateAmount(input.amountToman)
  if (amountError) return { ok: false, error: amountError }
  return isDonitoMode() ? startDonitoPayment(input) : startZarinpalPayment(input)
}

/** حالت Donito: باز کردن صفحه‌ی شخصی پرداخت توسعه‌دهنده در مرورگر */
export async function startDonitoPayment(input: StartPaymentInput): Promise<StartPaymentResult> {
  const amountError = validateAmount(input.amountToman)
  if (amountError) return { ok: false, error: amountError }

  writePending({
    gateway: 'donito',
    amountToman: input.amountToman,
    description: input.description,
    kind: input.kind,
    plan: input.plan,
    supporter: input.supporter,
    createdAt: Date.now(),
  })

  const opened = await openExternal(DONITO_PAYMENT_URL)
  if (!opened) {
    cancelPendingPayment()
    return { ok: false, error: 'مرورگر گوشی باز نشد — یک مرورگر (مثل کروم) نصب کنید' }
  }
  return { ok: true }
}

/** حالت زرین‌پال: تماس واقعی با API «درخواست» و گرفتن Authority */
export async function startZarinpalPayment(input: StartPaymentInput): Promise<StartPaymentResult> {
  const amountError = validateAmount(input.amountToman)
  if (amountError) return { ok: false, error: amountError }
  if (!ZARINPAL_MERCHANT_ID || ZARINPAL_MERCHANT_ID.includes('XXXX')) {
    return { ok: false, error: 'درگاه زرین‌پال هنوز تنظیم نشده — در تنظیمات برنامه حالت Donito فعال است' }
  }

  try {
    const res = await fetch(REQUEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        merchant_id: ZARINPAL_MERCHANT_ID,
        amount: input.amountToman * 10, // زرین‌پال مبلغ را به ریال می‌گیرد
        description: input.description,
        callback_url: ZARINPAL_CALLBACK_URL,
      }),
    })
    const json = await res.json()
    const code: number | undefined = json?.data?.code
    const authority: string | undefined = json?.data?.authority

    if (code !== 100 || !authority) {
      const msg = json?.errors?.message || json?.data?.message || 'درگاه پرداخت درخواست را رد کرد'
      return { ok: false, error: `خطای درگاه: ${msg}` }
    }

    writePending({
      authority,
      gateway: 'zarinpal',
      amountToman: input.amountToman,
      description: input.description,
      kind: input.kind,
      plan: input.plan,
      supporter: input.supporter,
      createdAt: Date.now(),
    })

    const opened = await openExternal(STARTPAY_BASE + authority)
    if (!opened) {
      cancelPendingPayment()
      return { ok: false, error: 'مرورگر گوشی باز نشد — یک مرورگر (مثل کروم) نصب کنید' }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'اتصال به درگاه پرداخت برقرار نشد — اینترنت گوشی را بررسی کنید' }
  }
}

// ---------- تأیید پرداخت (هر دو درگاه) ----------

export interface ConfirmResult {
  ok: boolean
  done?: PaymentDone
  error?: string
}

/** ثبت پرداخت و فعال‌سازی — مشترک بین دو درگاه */
function finalizePayment(
  pending: PendingPayment,
  refId: string,
  gateway: 'zarinpal' | 'donito',
  authority: string | null,
): ConfirmResult {
  const receipt = recordPayment({
    kind: pending.kind,
    plan: pending.plan,
    amountToman: pending.amountToman,
    refId,
    gateway,
    authority,
    date: new Date().toISOString(),
  })

  if (pending.kind === 'premium' && pending.plan) {
    activatePremium(pending.plan)
  } else if (pending.kind === 'support') {
    addSupporter({
      name: pending.supporter?.name?.trim() || 'حامی ناشناس',
      tier: 'one-time',
      amount: pending.amountToman,
      message: pending.supporter?.message?.trim() || null,
    })
    updateSettings({ supporterTier: 'one-time' })
  }

  cancelPendingPayment()
  return {
    ok: true,
    done: { kind: pending.kind, amountToman: pending.amountToman, refId, plan: pending.plan, receipt },
  }
}

/**
 * حالت Donito: کاربر شماره‌ی پیگیری رسید را وارد می‌کند.
 * ارقام فارسی/عربی هم قبول است؛ رسید تکراری رد می‌شود.
 */
export async function confirmDonitoPayment(rawRef: string): Promise<ConfirmResult> {
  const pending = readPending()
  if (!pending || pending.gateway !== 'donito') {
    return { ok: false, error: 'پرداختی در انتظار ثبت نیست — ابتدا در درگاه پرداخت کنید' }
  }

  const refId = normalizeDigits(rawRef).trim()
  if (!/^\d{4,24}$/.test(refId)) {
    return {
      ok: false,
      error: 'شماره پیگیری نامعتبر است — همان عددی را وارد کنید که در صفحه‌ی پرداخت یا پیامک بانک به‌عنوان «شماره پیگیری» آمده (فقط رقم، حداقل ۴ رقم)',
    }
  }

  // جلوگیری از ثبت دوباره‌ی همان رسید
  if (findPaymentByRef('donito', refId)) {
    return { ok: false, error: 'این شماره پیگیری قبلاً ثبت شده است — هر رسید فقط یک‌بار قابل استفاده است' }
  }

  return finalizePayment(pending, refId, 'donito', null)
}

/**
 * حالت زرین‌پال: این تابع هرگز به ورودی کاربر اعتماد نمی‌کند — همیشه مستقیماً
 * از API زرین‌پال می‌پرسد که آیا این Authority واقعاً با همین مبلغ پرداخت شده یا نه.
 */
async function verifyAuthority(authority: string, pending: PendingPayment): Promise<ConfirmResult> {
  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        merchant_id: ZARINPAL_MERCHANT_ID,
        amount: pending.amountToman * 10,
        authority,
      }),
    })
    const json = await res.json()
    const code: number | undefined = json?.data?.code
    const refId: string | undefined = json?.data?.ref_id ? String(json.data.ref_id) : undefined

    // ۱۰۰ = تازه تأیید شد، ۱۰۱ = قبلاً تأیید شده بود (idempotent) — هر دو یعنی پرداخت واقعی بوده
    if ((code !== 100 && code !== 101) || !refId) {
      const msg = json?.errors?.message || 'پرداخت تأیید نشد — اگر مبلغی کسر شده، ظرف ۷۲ ساعت به حساب شما برمی‌گردد'
      return { ok: false, error: msg }
    }
    return finalizePayment(pending, refId, 'zarinpal', authority)
  } catch {
    return { ok: false, error: 'اتصال به درگاه پرداخت برای تأیید برقرار نشد — دوباره تلاش کنید' }
  }
}

/** فراخوانی خودکار وقتی اپ از طریق deep-link (updatayar://payment?...) دوباره باز می‌شود — فقط زرین‌پال */
export async function verifyZarinpalPayment(authority: string, status: string | null): Promise<ConfirmResult> {
  const pending = readPending()
  if (!pending || pending.gateway !== 'zarinpal' || pending.authority !== authority) {
    return { ok: false, error: 'پرداختی در انتظار تأیید با این مشخصات پیدا نشد' }
  }
  if (status && status !== 'OK') {
    cancelPendingPayment()
    return { ok: false, error: 'پرداخت توسط شما لغو شد' }
  }
  return verifyAuthority(authority, pending)
}

/** تأیید کلی — شیت‌ها همین را صدا می‌زنند و بسته به درگاه فعال مسیر درست می‌رود */
export async function confirmPayment(rawRef: string): Promise<ConfirmResult> {
  return isDonitoMode() ? confirmDonitoPayment(rawRef) : verifyByManualAuthority(rawRef)
}

/** مسیر دستی زرین‌پال: اگر بازگشت خودکار از مرورگر کار نکرد، کاربر Authority را خودش پیست می‌کند */
export async function verifyByManualAuthority(rawAuthority: string): Promise<ConfirmResult> {
  const pending = readPending()
  if (!pending || pending.gateway !== 'zarinpal') {
    return { ok: false, error: 'پرداختی در انتظار تأیید نیست — ابتدا در درگاه پرداخت کنید' }
  }
  const authority = rawAuthority.trim()
  if (authority.length < 10) {
    return { ok: false, error: 'کد Authority نامعتبر است — آن را از آدرس صفحه‌ی بازگشت کپی کنید' }
  }
  return verifyAuthority(authority, pending)
}

/** پارس کردن Authority/Status از URL بازگشتی (deep-link یا صفحه‌ی callback) — فقط زرین‌پال */
export function parsePaymentReturnUrl(url: string): { authority: string; status: string | null } | null {
  try {
    const u = new URL(url)
    const authority = u.searchParams.get('Authority') ?? u.searchParams.get('authority')
    const status = u.searchParams.get('Status') ?? u.searchParams.get('status')
    if (!authority) return null
    return { authority, status }
  } catch {
    return null
  }
}
