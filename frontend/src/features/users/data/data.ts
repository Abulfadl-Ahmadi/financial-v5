import { Shield, Scissors, Package, DollarSign, Wrench, Sparkles, Shirt } from 'lucide-react'
import { type UserStatus } from './schema'

export const callTypes = new Map<UserStatus, string>([
  [
    'active',
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
  ],
  [
    'inactive',
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-700/80',
  ],
  [
    'invited',
    'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/80',
  ],
  [
    'suspended',
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/80',
  ],
])

export const roles = [
  { label: 'مدیر کل / کارفرما (Owner)', value: 'OWNER', icon: Shield },
  { label: 'حسابدار (Accountant)', value: 'ACCOUNTANT', icon: DollarSign },
  { label: 'سرپرست کارگاه برش (Cutting Supervisor)', value: 'CUTTING_SUPERVISOR', icon: Scissors },
  { label: 'سرپرست کارگاه خیاطی (Sewing Supervisor)', value: 'SEWING_SUPERVISOR', icon: Wrench },
  { label: 'انباردار پارچه (Warehouse Manager)', value: 'WAREHOUSE_MANAGER', icon: Package },
  { label: 'اتوکار / پرس‌کار (Ironer / Presser)', value: 'IRONER', icon: Sparkles },
  { label: 'خیاط / چرخکار / کارگر (Tailor / Worker)', value: 'WORKER', icon: Shirt },
] as const
