import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureSeed } from '@/lib/seed'

export async function GET() {
  try {
    await ensureSeed()
    const history = await db.updateHistory.findMany({
      orderBy: { date: 'desc' },
      take: 100,
    })
    return NextResponse.json(history)
  } catch (e) {
    console.error('history GET error', e)
    return NextResponse.json({ error: 'خطا در دریافت تاریخچه' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      appName: string
      iconColor?: string
      iconType?: string
      package: string
      fromVersion: string
      toVersion: string
      source: string
      sizeMB?: number
      status?: string
    }
    const item = await db.updateHistory.create({
      data: {
        appName: body.appName,
        iconColor: body.iconColor ?? 'emerald',
        iconType: body.iconType ?? 'Package',
        package: body.package,
        fromVersion: body.fromVersion,
        toVersion: body.toVersion,
        source: body.source,
        sizeMB: body.sizeMB ?? 0,
        status: body.status ?? 'completed',
        date: new Date(),
      },
    })
    return NextResponse.json(item)
  } catch (e) {
    console.error('history POST error', e)
    return NextResponse.json({ error: 'خطا در ثبت تاریخچه' }, { status: 500 })
  }
}
