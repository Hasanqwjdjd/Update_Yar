'use client'

/**
 * پرداخت واقعی «آپدیت‌یار» از طریق درگاه زارین‌پال (PG v4)
 *
 * جریان کامل:
 *  1) startZarinpalPayment → ثبت درخواست (request.json) → گرفتن authority
 *  2) باز شدن صفحه‌ی پرداخت (StartPay) در مرورگر گوشی
 *  3) کاربر پرداخت می‌کند و به اپ برمی‌گردد (deep-link updatayar://payment یا با دکمه back)
 *  4) checkPendingPayment → verify.json → اگر کد 100/101 بود، اشتراک/حمایت واقعاً فعال می‌شود
 *
 * ⚠️ بدون verify موفق، هیچ اشتراک یا حمایتی ثبت نمی‌شود.
 */

import { CapacitorHttp } from '@capacitor/core'
import {
  ZARINPAL_REQUEST_URL, ZARINPAL_VERIFY_URL, zarinpalStartPayUrl, PAYMENT_CALLBACK,
} from '@/lib/config'
import { openExternal } from '@/lib/native'
import {
  activatePremium, addSupporter, recordPayment, updateSettings,
} from '@/lib/local-db'
import type { PaymentRecord } from '@/lib/types'

export type PremiumPlan = 'monthly' | 'yearly' | 'lifetime'

interface PendingPayment {
  authority: string
  merchantId: string
  amountToman: number
  description: string
  kind: 'premium' | 'support'
  plan?: PremiumPlan
  supporter?: { name?: string; message?: string }
  createdAt: number
  checks: number
}

const PENDING_KEY = 'updatayar-pending-payment'
const PENDING_TTL_MS = 24 * 3600 * 1000 // ۲۴ ساعت

export interface PaymentDone {
  kind: 'premium' | 'support'
  amountToman: number
  refId: string
  plan?: PremiumPlan
  receipt: PaymentRecord
}

// ---------- وضعیت پرداخت در انتظار ----------

function readPending(): PendingPayment | null {
  try {
    const raw = window.localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as PendingPayment
    if (!p?.authority) return null
    // منقضی شده؟
    if (Date.now() - p.createdAt > PENDING_TTL_MS) {
      window.localStorage.removeItem(PENDING_KEY)
      return null
    }
    return p
  } catch {
    return null
  }
}

export function hasPendingPayment(): boolean {
  return readPending() !== null
}

export function cancelPendingPayment(): void {
  try { window.localStorage.removeItem(PENDING_KEY) } catch { /* noop */ }
}

// ---------- درخواست پرداخت ----------

export interface StartPaymentInput {
  merchantId: string
  amountToman: number
  description: string
  kind: 'premium' | 'support'
  plan?: PremiumPlan
  supporter?: { name?: string; message?: string }
}

/** ترجمه‌ی خطاهای رایج زارین‌پال به فارسی */
function zarinpalError(errors: unknown): string {
  const e = errors as { code?: number | string; message?: string } | Array<{ code?: number | string; message?: string }> | undefined
  const item = Array.isArray(e) ? e[0] : e
  const code = item?.code
  switch (code) {
    case -9:
      return 'اطلاعات درگاه نامعتبر است (کد مرچنت را بررسی کنید)'
    case -10:
      return 'مرچنت/ترمینال شما فعال نیست — وضعیت را در پنل زارین‌پال بررسی کنید'
    case -15:
      return 'درگاه پرداخت شما توسط زارین‌پال غیرفعال شده است'
    case -50:
      return 'مبلغ پرداخت با درگاه شما همخوانی ندارد'
    case -51:
      return 'پرداخت موفق نبود یا لغو شد'
    case -53:
      return 'پرداخت قبلاً تأیید شده است'
    case -54:
      return 'درخواست تأیید نامعتبر است'
    default:
      return item?.message ? `خطای درگاه (${String(code ?? '')}): ${item.message}` : 'اتصال به درگاه زارین‌پال برقرار نشد — اینترنت و VPN را بررسی کنید'
  }
}

export type StartPaymentResult =
  | { ok: true; authority: string }
  | { ok: false; error: string }

/**
 * شروع پرداخت: ثبت درخواست + باز کردن صفحه‌ی زارین‌پال در مرورگر
 */
export async function startZarinpalPayment(input: StartPaymentInput): Promise<StartPaymentResult> {
  const merchantId = input.merchantId.trim()
  if (!merchantId) {
    return { ok: false, error: 'کد مرچنت زارین‌پال تنظیم نشده است' }
  }
  if (!Number.isFinite(input.amountToman) || input.amountToman < 1000) {
    return { ok: false, error: 'مبلغ پرداخت نامعتبر است' }
  }

  try {
    // زارین‌پال v4 مبلغ را به «ریال» می‌گیرد
    const res = await CapacitorHttp.post({
      url: ZARINPAL_REQUEST_URL,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      data: {
        merchant_id: merchantId,
        amount: input.amountToman * 10,
        description: input.description,
        callback_url: PAYMENT_CALLBACK,
      },
      connectTimeout: 20000,
      readTimeout: 20000,
    })

    const body = (typeof res.data === 'string' ? JSON.parse(res.data) : res.data) as {
      data?: { authority?: string; code?: number }
      errors?: unknown
    }

    const authority = body?.data?.authority
    if (body?.data?.code === 100 && authority && typeof authority === 'string' && authority.length > 10) {
      const pending: PendingPayment = {
        authority,
        merchantId,
        amountToman: input.amountToman,
        description: input.description,
        kind: input.kind,
        plan: input.plan,
        supporter: input.supporter,
        createdAt: Date.now(),
        checks: 0,
      }
      try {
        window.localStorage.setItem(PENDING_KEY, JSON.stringify(pending))
      } catch { /* noop */ }
      // باز کردن صفحه‌ی پرداخت در مرورگر گوشی
      const opened = await openExternal(zarinpalStartPayUrl(authority))
      if (!opened) {
        cancelPendingPayment()
        return { ok: false, error: 'مرورگر گوشی باز نشد — یک مرورگر نصب کنید' }
      }
      return { ok: true, authority }
    }
    return { ok: false, error: zarinpalError(body?.errors) }
  } catch {
    return { ok: false, error: 'اتصال به زارین‌پال برقرار نشد — اینترنت/VPN را بررسی کنید' }
  }
}

// ---------- تأیید پرداخت ----------

export interface CheckResult {
  ok: boolean
  done?: PaymentDone
  error?: string
  pending?: boolean
}

/** فعال‌سازی واقعی بعد از تأیید درگاه */
function fulfill(p: PendingPayment, refId: string): PaymentDone {
  const receipt = recordPayment({
    kind: p.kind,
    plan: p.plan,
    amountToman: p.amountToman,
    authority: p.authority,
    refId,
    gateway: 'zarinpal',
    date: new Date().toISOString(),
  })

  if (p.kind === 'premium' && p.plan) {
    activatePremium(p.plan)
  } else if (p.kind === 'support') {
    addSupporter({
      name: p.supporter?.name?.trim() || 'حامی ناشناس',
      tier: 'one-time',
      amount: p.amountToman,
      message: p.supporter?.message?.trim() || null,
    })
    updateSettings({ supporterTier: 'one-time' })
  }

  return { kind: p.kind, amountToman: p.amountToman, refId, plan: p.plan, receipt }
}

/**
 * بررسی پرداخت در انتظار — روی بازگشت به اپ / تغییر تب / فشردن دکمه‌ی «بررسی پرداخت» صدا زده می‌شود
 */
export async function checkPendingPayment(): Promise<CheckResult> {
  const p = readPending()
  if (!p) return { ok: false, error: 'none' }

  try {
    const res = await CapacitorHttp.post({
      url: ZARINPAL_VERIFY_URL,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      data: {
        merchant_id: p.merchantId,
        amount: p.amountToman * 10,
        authority: p.authority,
      },
      connectTimeout: 20000,
      readTimeout: 20000,
    })

    const body = (typeof res.data === 'string' ? JSON.parse(res.data) : res.data) as {
      data?: { code?: number; ref_id?: number | string }
      errors?: unknown
    }

    const code = body?.data?.code
    // 100 = پرداخت موفق و تأیید شد | 101 = قبلاً تأیید شده (باز هم معتبر)
    if ((code === 100 || code === 101) && body?.data?.ref_id !== undefined) {
      const refId = String(body.data.ref_id)
      const done = fulfill(p, refId)
      cancelPendingPayment()
      return { ok: true, done }
    }

    // هنوز پرداخت نشده — در انتظار می‌ماند (تا سقف ۲۴ ساعت)
    try {
      const fresh = { ...p, checks: p.checks + 1 }
      window.localStorage.setItem(PENDING_KEY, JSON.stringify(fresh))
    } catch { /* noop */ }
    return { ok: false, pending: true, error: 'not_paid_yet' }
  } catch {
    return { ok: false, pending: true, error: 'network' }
  }
}
