import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureSeed } from '@/lib/seed'

// فعال‌سازی اشتراک ویژه (شبیه‌سازی درگاه پرداخت)
export async function POST(req: Request) {
  try {
    await ensureSeed()
    const body = (await req.json()) as { plan: 'monthly' | 'yearly' | 'lifetime'; gateway?: string }
    const plan = body.plan
    if (!['monthly', 'yearly', 'lifetime'].includes(plan)) {
      return NextResponse.json({ error: 'پلن نامعتبر است' }, { status: 400 })
    }
    const settings = await db.appSettings.update({
      where: { id: 'main' },
      data: { isPremium: true, premiumPlan: plan },
    })
    return NextResponse.json({ ok: true, settings })
  } catch (e) {
    console.error('premium POST error', e)
    return NextResponse.json({ error: 'خطا در فعال‌سازی اشتراک' }, { status: 500 })
  }
}

// انصراف از اشتراک
export async function DELETE() {
  try {
    await ensureSeed()
    const settings = await db.appSettings.update({
      where: { id: 'main' },
      data: { isPremium: false, premiumPlan: null },
    })
    return NextResponse.json({ ok: true, settings })
  } catch (e) {
    console.error('premium DELETE error', e)
    return NextResponse.json({ error: 'خطا در لغو اشتراک' }, { status: 500 })
  }
}
