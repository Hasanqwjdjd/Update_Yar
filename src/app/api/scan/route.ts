import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureSeed } from '@/lib/seed'
import type { InstalledApp } from '@/lib/types'

// شبیه‌سازی «بررسی به‌روزرسانی» — نسخه‌های جدید برای برخی برنامه‌ها یافت می‌شود
export async function POST() {
  try {
    await ensureSeed()
    const apps = await db.installedApp.findMany({ orderBy: { sortOrder: 'asc' } })

    let discovered = 0
    const pool = apps.filter((a) => !a.newVersion && !a.system)
    const shuffled = pool.sort(() => Math.random() - 0.5)
    const targets = shuffled.slice(0, Math.min(2 + Math.floor(Math.random() * 3), shuffled.length))

    for (const app of targets) {
      const parts = app.version.split('.')
      const last = Number(parts[parts.length - 1] ?? '0')
      const newVersion = [...parts.slice(0, -1), String(last + 1)].join('.')
      const changelogOptions = [
        'بهبود عملکرد و رفع اشکالات گزارش‌شده توسط کاربران',
        'افزودن قابلیت‌های تازه و بهبود سرعت اجرا',
        'بهبود امنیت و رفع آسیب‌پذیری‌های گزارش‌شده',
        'بهینه‌سازی مصرف باتری و رابط کاربری بهتر',
      ]
      await db.installedApp.update({
        where: { id: app.id },
        data: {
          newVersion,
          changelog: changelogOptions[Math.floor(Math.random() * changelogOptions.length)],
          lastCheck: new Date(),
        },
      })
      discovered++
    }

    await db.installedApp.updateMany({ data: { lastCheck: new Date() } })

    const fresh = await db.installedApp.findMany({ orderBy: { sortOrder: 'asc' } })
    const history = await db.updateHistory.findMany({ orderBy: { date: 'desc' }, take: 50 })

    return NextResponse.json({
      discovered,
      apps: fresh as unknown as InstalledApp[],
      history,
    })
  } catch (e) {
    console.error('scan POST error', e)
    return NextResponse.json({ error: 'خطا در بررسی آپدیت‌ها' }, { status: 500 })
  }
}
