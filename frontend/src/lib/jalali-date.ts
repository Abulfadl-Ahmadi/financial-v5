/**
 * Jalali (Persian Solar Hijri) Date Utility based on shadcn-persian
 */

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

export const JALALI_WEEK_DAYS = [
  { short: 'ش', name: 'شنبه' },
  { short: 'ی', name: 'یکشنبه' },
  { short: 'د', name: 'دوشنبه' },
  { short: 'س', name: 'سه‌شنبه' },
  { short: 'چ', name: 'چهارشنبه' },
  { short: 'پ', name: 'پنج‌شنبه' },
  { short: 'ج', name: 'جمعه' },
]

export function isLeapJalaliYear(year: number): boolean {
  const mod = (((year - (year > 0 ? 474 : 473)) % 2820) + 474 + 38) * 682
  return ((mod % 2816) * 1000) / 2816 < 682
}

export function getJalaliMonthDays(year: number, month: number): number {
  if (month <= 6) return 31
  if (month <= 11) return 30
  return isLeapJalaliYear(year) ? 30 : 29
}

/**
 * Gregorian to Jalali Conversion
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): { year: number; month: number; day: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  let gy2 = gm > 2 ? gy + 1 : gy
  let days =
    355666 +
    (365 * gy) +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1]
  let jy = -1595 + 33 * Math.floor(days / 12053)
  days %= 12053
  jy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    jy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }
  let jm: number
  let jd: number
  if (days < 186) {
    jm = 1 + Math.floor(days / 31)
    jd = 1 + (days % 31)
  } else {
    jm = 7 + Math.floor((days - 186) / 30)
    jd = 1 + ((days - 186) % 30)
  }
  return { year: jy, month: jm, day: jd }
}

/**
 * Jalali to Gregorian Conversion
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): { year: number; month: number; day: number } {
  const jy2 = jy - 979
  const j_day_no =
    365 * jy2 +
    Math.floor(jy2 / 33) * 8 +
    Math.floor(((jy2 % 33) + 3) / 4) +
    (jm <= 6 ? (jm - 1) * 31 : (jm - 7) * 30 + 186) +
    jd -
    1

  let g_day_no = j_day_no + 79
  let gy = 1600 + 400 * Math.floor(g_day_no / 146097)
  g_day_no %= 146097

  let leap = true
  if (g_day_no >= 36525) {
    g_day_no--
    gy += 100 * Math.floor(g_day_no / 36524)
    g_day_no %= 36524

    if (g_day_no >= 365) {
      g_day_no++
    } else {
      leap = false
    }
  }

  gy += 4 * Math.floor(g_day_no / 1461)
  g_day_no %= 1461

  if (g_day_no >= 366) {
    leap = false
    g_day_no--
    gy += Math.floor(g_day_no / 365)
    g_day_no %= 365
  }

  const g_days_in_month = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let gm = 0
  while (g_day_no >= g_days_in_month[gm]) {
    g_day_no -= g_days_in_month[gm]
    gm++
  }
  return { year: gy, month: gm + 1, day: g_day_no + 1 }
}

/**
 * Returns 0 for Saturday, 1 for Sunday, ..., 6 for Friday
 */
export function getJalaliFirstDayOfWeek(year: number, month: number): number {
  const g = jalaliToGregorian(year, month, 1)
  const date = new Date(g.year, g.month - 1, g.day)
  const gDay = date.getDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat
  // Convert to Saturday = 0, Sunday = 1, ..., Friday = 6
  return (gDay + 1) % 7
}

export function getTodayJalali(): { year: number; month: number; day: number; formatted: string } {
  const now = new Date()
  const j = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())
  const formatted = `${j.year}/${String(j.month).padStart(2, '0')}/${String(j.day).padStart(2, '0')}`
  return { ...j, formatted }
}

export function getCurrentTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export function parseJalaliString(str?: string | null): { year: number; month: number; day: number } | null {
  if (!str) return null
  const cleaned = str.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776)).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
  const parts = cleaned.split(/[\/\-.: ]/).map(Number)
  if (parts.length >= 3 && parts[0] > 1300 && parts[1] >= 1 && parts[1] <= 12 && parts[2] >= 1 && parts[2] <= 31) {
    return { year: parts[0], month: parts[1], day: parts[2] }
  }
  return null
}

export function formatJalali(year: number, month: number, day: number): string {
  return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`
}
