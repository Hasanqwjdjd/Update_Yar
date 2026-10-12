import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureSeed } from '@/lib/seed'

export async function GET() {
  try {
    await ensureSeed()
    const ads = await db.adItem.findMany({
      where: { active: true },
      orderBy: { priority: 'desc' },
    })
    return NextResponse.json(ads)
  } catch (e) {
    console.error('ads GET error', e)
    return NextResponse.json({ error: 'خطا در دریافت تبلیغات' }, { status: 500 })
  }
}
