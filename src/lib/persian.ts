// ابزارهای فارسی: اعداد، تاریخ جلالی و زمان نسبی

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

/** تبدیل ارقام انگلیسی به فارسی */
export function faDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)])
}

/** عدد با جداکننده هزارگان فارسی */
export function faNumber(n: number): string {
  return faDigits(n.toLocaleString('en-US').replace(/,/g, '٬'))
}

/** حجم به مگابایت/گیگابایت فارسی */
export function faSize(mb: number): string {
  if (mb >= 1024) return `${faDigits((mb / 1024).toFixed(1))} گیگابایت`
  return `${faDigits(mb % 1 === 0 ? mb.toFixed(0) : mb.toFixed(1))} مگابایت`
}

/** تاریخ جلالی مثل ۱۴۰۴/۰۸/۲۰ */
export function faJalaliDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const fmt = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return faDigits(fmt.format(d))
}

/** تاریخ کوتاه جلالی مثل ۲۰ آبان */
export function faShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const fmt = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long' })
  return fmt.format(d)
}

/** ساعت فارسی مثل ۱۴:۳۰ */
export function faTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const fmt = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return faDigits(fmt.format(d))
}

/** زمان نسبی فارسی: امروز، دیروز، ۳ روز پیش... */
export function faRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000)
  if (diffDays <= 0) return 'امروز'
  if (diffDays === 1) return 'دیروز'
  if (diffDays < 7) return `${faDigits(diffDays)} روز پیش`
  return faJalaliDate(d)
}

/** مبلغ تومانی فارسی */
export function faToman(amount: number): string {
  return `${faNumber(amount)} تومان`
}

const WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']
export function faWeekday(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return WEEKDAYS[d.getDay()]
}
