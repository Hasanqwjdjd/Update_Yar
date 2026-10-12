import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureSeed } from '@/lib/seed'

const ALLOWED_KEYS = [
  'notifications', 'notifyNewUpdates', 'notifySecurity', 'notifyBeta',
  'darkTheme', 'accentTheme', 'syncWithSystem', 'scheduledTheme',
  'dataSaver', 'autoUpdateWifi', 'scheduledChecks',
  'sourceGooglePlay', 'sourceBazaar', 'sourceMyket', 'sourceGithub', 'sourceCustom',
  'isPremium', 'premiumPlan', 'supporterTier', 'onboarded',
] as const

export async function GET() {
  try {
    await ensureSeed()
    let settings = await db.appSettings.findUnique({ where: { id: 'main' } })
    if (!settings) settings = await db.appSettings.create({ data: { id: 'main' } })
    return NextResponse.json(settings)
  } catch (e) {
    console.error('settings GET error', e)
    return NextResponse.json({ error: 'خطا در دریافت تنظیمات' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    await ensureSeed()
    const body = (await req.json()) as Record<string, unknown>
    const patch: Record<string, unknown> = {}
    for (const key of ALLOWED_KEYS) {
      if (key in body) patch[key] = body[key]
    }
    let settings = await db.appSettings.findUnique({ where: { id: 'main' } })
    if (!settings) settings = await db.appSettings.create({ data: { id: 'main' } })
    if (Object.keys(patch).length) {
      settings = await db.appSettings.update({ where: { id: 'main' }, data: patch })
    }
    return NextResponse.json(settings)
  } catch (e) {
    console.error('settings PUT error', e)
    return NextResponse.json({ error: 'خطا در ذخیره تنظیمات' }, { status: 500 })
  }
}
