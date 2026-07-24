import { Shield, UserCheck, Users, CreditCard, Scissors, Package, DollarSign, Wrench } from 'lucide-react'
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
  { label: 'Owner / Manager', value: 'owner', icon: Shield },
  { label: 'Admin', value: 'admin', icon: UserCheck },
  { label: 'Cutting Supervisor', value: 'cutting_supervisor', icon: Scissors },
  { label: 'Sewing Supervisor', value: 'sewing_supervisor', icon: Wrench },
  { label: 'Financial Manager', value: 'financial_manager', icon: DollarSign },
  { label: 'Inventory Manager', value: 'inventory_manager', icon: Package },
  { label: 'Cutter', value: 'cutter', icon: Scissors },
  { label: 'Sewer', value: 'sewer', icon: Users },
  { label: 'External Sewer', value: 'external_sewer', icon: Users },
  { label: 'Customer', value: 'customer', icon: Users },
  { label: 'Supplier', value: 'supplier', icon: Package },
] as const
