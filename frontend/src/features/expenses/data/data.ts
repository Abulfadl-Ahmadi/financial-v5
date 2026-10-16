import {
  Building2,
  Zap,
  Droplet,
  Flame,
  Scissors,
  Wrench,
  Coffee,
  Sparkles,
  Layers,
} from 'lucide-react'

export const expenseCategories = [
  {
    value: 'RENT',
    label: 'Workshop Rent (اجاره مکان کارگاه)',
    icon: Building2,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  },
  {
    value: 'ELECTRICITY',
    label: 'Electricity Bill (قبض برق کارگاه)',
    icon: Zap,
    color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-800',
  },
  {
    value: 'WATER',
    label: 'Water Bill (قبض آب)',
    icon: Droplet,
    color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
  },
  {
    value: 'GAS',
    label: 'Gas Bill (قبض گاز دیگ بخار و آشپزخانه)',
    icon: Flame,
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
  },
  {
    value: 'SUPPLIES',
    label: 'Sewing Supplies & Oil (ملزومات دوخت، روغن چرخ، سوزن)',
    icon: Scissors,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
  },
  {
    value: 'MAINTENANCE',
    label: 'Maintenance & Boiler (تعمیرات چرخ و دیگ بخار)',
    icon: Wrench,
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
  },
  {
    value: 'WELFARE',
    label: 'Worker Welfare & Tea (رفاهی، چای و پذیرایی)',
    icon: Coffee,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  },
  {
    value: 'CLEANING',
    label: 'Workshop Cleaning (نظافت و بهداشت کارگاه)',
    icon: Sparkles,
    color: 'bg-teal-500/10 text-teal-600 border-teal-500/20 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
  },
  {
    value: 'OTHER',
    label: 'Other Expenses (سایر هزینه‌های جاری)',
    icon: Layers,
    color: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-zinc-700',
  },
]

export const expenseCategoryStyles = new Map(
  expenseCategories.map((c) => [c.value, c.color])
)

export const expenseCategoryLabels: Record<string, string> = Object.fromEntries(
  expenseCategories.map((c) => [c.value, c.label])
)
