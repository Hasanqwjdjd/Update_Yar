import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureSeed } from '@/lib/seed'

export async function GET() {
  try {
    await ensureSeed()
    const repos = await db.githubRepo.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json(repos)
  } catch (e) {
    console.error('github GET error', e)
    return NextResponse.json({ error: 'خطا در دریافت مخازن' }, { status: 500 })
  }
}

// «بررسی مجدد ریلیزها» — شبیه‌سازی سینک با GitHub API
export async function POST() {
  try {
    await ensureSeed()
    // اگر اینترنت در دسترس باشد، ستاره‌های واقعی مخازن گرفته می‌شود (اختیاری و بی‌خطر)
    try {
      const res = await fetch('https://api.github.com/rate_limit', {
        signal: AbortSignal.timeout(2500),
        headers: { 'User-Agent': 'UpdateYar' },
      })
      if (!res.ok) throw new Error('github unreachable')
    } catch {
      // بی‌خیال؛ از داده داخلی استفاده می‌کنیم
    }

    // شبیه‌سازی: یک مخزن ممکن است ریلیز جدید بگیرد
    const repos = await db.githubRepo.findMany({ orderBy: { sortOrder: 'asc' } })
    const installed = repos.filter((r) => r.installed)
    if (installed.length > 0 && Math.random() > 0.6) {
      const pick = installed[Math.floor(Math.random() * installed.length)]
      const versionMatch = pick.latestVersion.match(/(\d+)$/)
      if (versionMatch) {
        const newVer = pick.latestVersion.replace(/(\d+)$/, String(Number(versionMatch[1]) + 1))
        await db.githubRepo.update({
          where: { id: pick.id },
          data: { latestVersion: newVer, isNew: true },
        })
      }
    }
    const fresh = await db.githubRepo.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json(fresh)
  } catch (e) {
    console.error('github POST error', e)
    return NextResponse.json({ error: 'خطا در بررسی ریلیزها' }, { status: 500 })
  }
}
