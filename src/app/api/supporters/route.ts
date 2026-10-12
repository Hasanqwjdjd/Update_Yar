import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureSeed } from '@/lib/seed'

export async function GET() {
  try {
    await ensureSeed()
    const supporters = await db.supporter.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(supporters)
  } catch (e) {
    console.error('supporters GET error', e)
    return NextResponse.json({ error: 'خطا در دریافت حامیان' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await ensureSeed()
    const body = (await req.json()) as {
      name: string
      tier: string
      amount: number
      message?: string
    }
    const supporter = await db.supporter.create({
      data: {
        name: body.name?.trim() || 'کاربر ناشناس',
        tier: body.tier,
        amount: body.amount,
        message: body.message?.trim() || null,
        createdAt: new Date(),
      },
    })
    // سطح حمایت کاربر در تنظیمات ثبت می‌شود
    await db.appSettings.update({
      where: { id: 'main' },
      data: { supporterTier: body.tier },
    })
    return NextResponse.json(supporter)
  } catch (e) {
    console.error('supporters POST error', e)
    return NextResponse.json({ error: 'خطا در ثبت حمایت' }, { status: 500 })
  }
}
