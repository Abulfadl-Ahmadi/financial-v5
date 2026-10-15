import {
  ArrowLeftRight,
  CreditCard,
  Building2,
  Banknote,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'

export type ReceiptType =
  | 'CUTTING_PAYROLL'
  | 'SEWING_PAYROLL'
  | 'FABRIC_PURCHASE'
  | 'PRODUCER_PAYMENT'
  | 'OTHER'

export type ReceiptStatus = 'VERIFIED' | 'PENDING' | 'REJECTED'

export const receiptTypeLabels: Record<string, string> = {
  CUTTING_PAYROLL: 'تسویه اجرت برشکاری',
  SEWING_PAYROLL: 'تسویه اجرت خیاطی',
  FABRIC_PURCHASE: 'خرید پارچه و مواد اولیه',
  PRODUCER_PAYMENT: 'دریافتی از سفارش‌دهنده',
  OTHER: 'سایر تراکنش‌ها',
}

export const receiptTypes = [
  { label: 'تسویه اجرت برشکاری', value: 'CUTTING_PAYROLL', icon: CreditCard },
  { label: 'تسویه اجرت خیاطی', value: 'SEWING_PAYROLL', icon: CreditCard },
  { label: 'خرید پارچه و مواد اولیه', value: 'FABRIC_PURCHASE', icon: Building2 },
  { label: 'دریافتی از سفارش‌دهنده', value: 'PRODUCER_PAYMENT', icon: Banknote },
  { label: 'سایر تراکنش‌ها', value: 'OTHER', icon: ArrowLeftRight },
] as const

export const receiptStatuses = [
  { label: 'Verified', value: 'VERIFIED', icon: CheckCircle2 },
  { label: 'Pending', value: 'PENDING', icon: Clock },
  { label: 'Rejected', value: 'REJECTED', icon: XCircle },
] as const

export const receiptStatusStyles = new Map<string, string>([
  [
    'VERIFIED',
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
  ],
  [
    'PENDING',
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80',
  ],
  [
    'REJECTED',
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/80',
  ],
])
