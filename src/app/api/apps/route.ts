import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureSeed } from '@/lib/seed'

export async function GET() {
  try {
    await ensureSeed()
    const apps = await db.installedApp.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json(apps)
  } catch (e) {
    console.error('apps GET error', e)
    return NextResponse.json({ error: 'خطا در دریافت برنامه‌ها' }, { status: 500 })
  }
}
