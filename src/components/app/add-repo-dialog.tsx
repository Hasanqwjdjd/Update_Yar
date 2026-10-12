'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Github, Loader2, Plus, CheckCircle2, AlertTriangle } from 'lucide-react'
import {
  addCustomRepo, normalizeRepoName, validateRepo,
} from '@/lib/local-db'
import type { GithubRepoItem } from '@/lib/types'

/**
 * افزودن منبع واقعی: یک مخزن گیت‌هاب را با API گیت‌هاب اعتبارسنجی می‌کند
 * و پس از تأیید به فهرست مخازن اضافه می‌شود (در تب گیت‌هاب دیده می‌شود).
 */
export function AddRepoDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onAdded?: (repo: GithubRepoItem) => void
}) {
  const [value, setValue] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [okName, setOkName] = useState<string | null>(null)

  const reset = () => {
    setValue('')
    setError(null)
    setOkName(null)
    setChecking(false)
  }

  const close = (v: boolean) => {
    onOpenChange(v)
    if (!v) setTimeout(reset, 300)
  }

  const submit = async () => {
    const fullName = normalizeRepoName(value)
    if (!fullName) {
      setError('قالب درست: owner/repo — مثل teamnewpipe/NewPipe یا لینک کامل گیت‌هاب')
      return
    }
    setChecking(true)
    setError(null)
    setOkName(null)
    try {
      const res = await validateRepo(fullName)
      if (!res.ok || !res.info) {
        setError(res.error ?? 'مخزن تأیید نشد')
        setChecking(false)
        return
      }
      const repo = addCustomRepo(fullName, res.info)
      setOkName(fullName)
      setChecking(false)
      onAdded?.(repo)
      setTimeout(() => close(false), 700)
    } catch {
      setError('بررسی مخزن ناموفق بود — اتصال اینترنت را چک کنید')
      setChecking(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-[380px] rounded-3xl border-border bg-card" dir="rtl">
        <DialogHeader className="items-start text-right">
          <DialogTitle className="flex items-center gap-2 text-[16px]">
            <Github className="size-5" />
            افزودن مخزن گیت‌هاب
          </DialogTitle>
          <DialogDescription className="text-right text-[12px] leading-5">
            نام مخزن را وارد کنید؛ برنامه آن را با گیت‌هاب بررسی می‌کند و آخرین ریلیزش را دنبال خواهد کرد.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <input
            autoFocus
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(null); setOkName(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !checking) void submit() }}
            placeholder="مثلاً teamnewpipe/NewPipe"
            dir="ltr"
            className="w-full rounded-2xl border border-border bg-background/60 px-4 py-3 text-left text-[13px] outline-none focus:ring-2 focus:ring-primary/40"
          />
          {error && (
            <p className="flex items-start gap-1.5 rounded-xl bg-destructive/10 p-2.5 text-[11px] leading-5 text-destructive">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </p>
          )}
          {okName && (
            <p className="flex items-center gap-1.5 rounded-xl bg-primary/10 p-2.5 text-[11px] font-bold text-primary">
              <CheckCircle2 className="size-3.5 shrink-0" />
              «{okName}» اضافه شد ✓
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => close(false)}
            className="min-h-[46px] flex-1 rounded-2xl border border-border text-[13px] font-bold text-muted-foreground"
          >
            انصراف
          </button>
          <button
            onClick={() => void submit()}
            disabled={checking || value.trim().length === 0}
            className="flex min-h-[46px] flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-primary text-[13px] font-black text-primary-foreground disabled:opacity-40"
          >
            {checking ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {checking ? 'در حال بررسی با گیت‌هاب...' : 'بررسی و افزودن'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
