import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type Account } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'
import { BankCardBadge } from '@/components/ui/bank-card-badge'

import { Building2, User } from 'lucide-react'

export const accountsColumns: ColumnDef<Account>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-0.5'
      />
    ),
    meta: {
      className: cn('inset-s-0 z-10 rounded-tl-[inherit] max-md:sticky'),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-0.5'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'fullName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Account Holder' />
    ),
    cell: ({ row }) => {
      const { f_name, l_name } = row.original
      const fullName = `${f_name} ${l_name}`.trim() || '-'
      return <LongText className='max-w-48 ps-3 font-medium'>{fullName}</LongText>
    },
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'card_number',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Bank Card & Bank' />
    ),
    cell: ({ row }) => {
      return (
        <BankCardBadge
          cardNumber={row.original.card_number}
          bankName={row.original.bank_name}
          size='default'
        />
      )
    },
  },
  {
    id: 'account_type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Account Role' />
    ),
    cell: ({ row }) => {
      const isWorkshop = row.original.is_workshop
      const userRole = row.original.user_role
      const userFullName = row.original.user_full_name
      if (!row.original.is_active) return <Badge variant='secondary'>آرشیوشده</Badge>

      if (isWorkshop) {
        return (
          <div className='flex items-center gap-1.5'>
            <Badge
              variant='outline'
              className='text-xs font-medium bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-500/40 shadow-2xs'
            >
              <Building2 className='size-3 me-1 text-emerald-600 dark:text-emerald-400' />
              Workshop Account (کارگاه)
            </Badge>
          </div>
        )
      }

      const roleDisplay = userRole
        ? userRole === 'WORKER'
          ? 'خیاط / کارگر'
          : userRole === 'IRONER'
          ? 'اتوکار / پرس‌کار'
          : userRole === 'SEWING_SUPERVISOR'
          ? 'سرپرست خیاطی'
          : userRole === 'CUTTING_SUPERVISOR'
          ? 'سرپرست برش'
          : userRole === 'WAREHOUSE_MANAGER'
          ? 'انباردار'
          : userRole
        : 'طرف حساب بدون حساب ورود'

      return (
        <div className='flex items-center gap-1.5'>
          <Badge
            variant='outline'
            className='text-xs font-medium bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30 dark:border-blue-500/40 shadow-2xs'
          >
            <User className='size-3 me-1 text-blue-600 dark:text-blue-400' />
            {roleDisplay}
          </Badge>
          {row.original.is_primary && <Badge variant='secondary'>کارت اصلی</Badge>}
          {userFullName && (
            <span className='text-[11px] text-muted-foreground truncate max-w-32'>
              ({userFullName})
            </span>
          )}
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
