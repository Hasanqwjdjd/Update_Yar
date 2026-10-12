'use client'

/**
 * پرداخت واقعی «آپدیت‌یار» از طریق درگاه آنلاین دونیتو (مالک: توسعه‌دهنده برنامه)
 *
 * جریان کامل:
 *  1) startDonitoPayment → ثبت پرداخت در انتظار + باز شدن صفحه‌ی درگاه (donito.me) در مرورگر گوشی
 *  2) کاربر مبلغ را در درگاه پرداخت می‌کند → پول مستقیم به حساب توسعه‌دهنده می‌رود
 *  3) کاربر به اپ برمی‌گردد و شماره رسید/پیگیری درگاه را وارد می‌کند
 *  4) confirmDonitoPayment → رسید ثبت و اشتراک/حمایت واقعاً فعال می‌شود
 *
 * ⚠️ بدون وارد کردن شماره رسید، هیچ اشتراک یا حمایتی ثبت نمی‌شود.
 * ⚠️ به هیچ «کد مرچنت» خارجی نیاز نیست — درگاه از قبل به حساب توسعه‌دهنده وصل است.
 */

import { PAYMENT_GATEWAY_URL } from '@/lib/config'
import { openExternal } from '@/lib/native'
import {
  activatePremium, addSupporter, recordPayment, updateSettings,
} from '@/lib/local-db'
import type { PaymentRecord } from '@/lib/types'

export type PremiumPlan = 'monthly' | 'yearly' | 'lifetime'

interface PendingPayment {
  amountToman: number
  description: string
  kind: 'premium' | 'support'
  plan?: PremiumPlan
  supporter?: { name?: string; message?: string }
  createdAt: number
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
    if (!p?.amountToman) return null
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

export function getPendingPayment(): PendingPayment | null {
  return readPending()
}

export function cancelPendingPayment(): void {
  try { window.localStorage.removeItem(PENDING_KEY) } catch { /* noop */ }
}

// ---------- شروع پرداخت ----------

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

/**
 * شروع پرداخت: ثبت در انتظار + باز کردن صفحه‌ی درگاه دونیتو در مرورگر گوشی.
 * پول مستقیماً و آنلاین به حساب توسعه‌دهنده واریز می‌شود.
 */
export async function startDonitoPayment(input: StartPaymentInput): Promise<StartPaymentResult> {
  if (!Number.isFinite(input.amountToman) || input.amountToman < 1000) {
    return { ok: false, error: 'مبلغ پرداخت نامعتبر است (حداقل ۱٬۰۰۰ تومان)' }
  }

  const pending: PendingPayment = {
    amountToman: input.amountToman,
    description: input.description,
    kind: input.kind,
    plan: input.plan,
    supporter: input.supporter,
    createdAt: Date.now(),
  }
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(pending))
  } catch { /* noop */ }

  // باز کردن صفحه‌ی درگاه در مرورگر گوشی
  const opened = await openExternal(PAYMENT_GATEWAY_URL)
  if (!opened) {
    cancelPendingPayment()
    return { ok: false, error: 'مرورگر گوشی باز نشد — یک مرورگر (مثل کروم) نصب کنید' }
  }
  return { ok: true }
}

// ---------- تأیید پرداخت با شماره رسید ----------

export interface ConfirmResult {
  ok: boolean
  done?: PaymentDone
  error?: string
}

/** فعال‌سازی واقعی پس از وارد کردن شماره رسید درگاه */
export function confirmDonitoPayment(rawRefId: string): ConfirmResult {
  const p = readPending()
  if (!p) {
    return { ok: false, error: 'پرداختی در انتظار تأیید نیست — ابتدا در درگاه پرداخت کنید' }
  }

  const refId = rawRefId.trim()
  // شماره پیگیری/رسید درگاه معمولاً حداقل ۴ رقم است
  const digits = refId.replace(/\D/g, '')
  if (digits.length < 4) {
    return { ok: false, error: 'شماره رسید نامعتبر است — عددی که در صفحه درگاه (رسید پرداخت) دیده می‌شود را وارد کنید' }
  }

  const receipt = recordPayment({
    kind: p.kind,
    plan: p.plan,
    amountToman: p.amountToman,
    refId,
    gateway: 'donito',
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

  cancelPendingPayment()
  return { ok: true, done: { kind: p.kind, amountToman: p.amountToman, refId, plan: p.plan, receipt } }
}
