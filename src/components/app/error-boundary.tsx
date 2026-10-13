'use client'

import { Component, type ReactNode } from 'react'
import { RefreshCcw, ShieldAlert } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * مرز خطای سراسری اپ.
 *
 * بدون این مرز، هر خطای مدیریت‌نشده در هر کامپوننتی باعث کرش کامل صفحه
 * و نمایش پیام عمومی Next.js («Application error: a client-side exception...»)
 * می‌شود که هیچ راه بازگشتی به کاربر نمی‌دهد.
 *
 * با این مرز، فقط بخش خراب جایگزین یک پیام فارسی با دکمه «تلاش دوباره» می‌شود
 * و کل اپ کرش نمی‌کند.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    // در نسخه‌ی تولید می‌توان اینجا خطا را (بدون داده‌ی شخصی) به سرویس گزارش خطا فرستاد
    console.error('[UpdateYar] خطای مدیریت‌نشده:', error)
  }

  private reset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-amber-500/15">
            <ShieldAlert className="size-8 text-amber-500" />
          </div>
          <p className="text-[15px] font-black">مشکلی پیش آمد</p>
          <p className="text-[12px] leading-6 text-muted-foreground">
            یک خطای غیرمنتظره رخ داد. می‌توانید دوباره تلاش کنید؛ اگر ادامه داشت، اپ را ببندید و باز کنید.
          </p>
          <button
            onClick={this.reset}
            className="flex min-h-[46px] items-center gap-2 rounded-2xl bg-primary px-6 text-[13px] font-black text-primary-foreground"
          >
            <RefreshCcw className="size-4" />
            تلاش دوباره
          </button>
        </main>
      )
    }
    return this.props.children
  }
}
