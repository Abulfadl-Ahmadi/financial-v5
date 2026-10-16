import { Link } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type User } from '../data/schema'
import { roles } from '../data/data'
import { DataTableRowActions } from './data-table-row-actions'
import { BankCardBadge } from '@/components/ui/bank-card-badge'

function UsernameCell({ row }: { row: { original: User; getValue: (key: string) => string } }) {
  return (
    <Link
      to='/users/$userId'
      params={{ userId: String(row.original.id) }}
      className='ps-3 font-medium hover:underline hover:text-primary cursor-pointer inline-block'
    >
      <LongText className='max-w-36'>{row.getValue('username')}</LongText>
    </Link>
  )
}

export const usersColumns: ColumnDef<User>[] = [
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
    accessorKey: 'username',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Username' />
    ),
    cell: ({ row }) => <UsernameCell row={row} />,
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    id: 'fullName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => {
      const { first_name, last_name } = row.original
      const fullName = `${first_name || ''} ${last_name || ''}`.trim() || '-'
      return <LongText className='max-w-36 font-medium'>{fullName}</LongText>
    },
    meta: { className: 'w-36' },
  },
  {
    accessorKey: 'phone_number',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Phone Number' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap font-mono text-xs'>{row.getValue('phone_number') || '-'}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'card_number',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Bank Accounts / Cards' />
    ),
    cell: ({ row }) => {
      const bankAccounts = (row.original.bank_accounts || []).filter((account) => account.is_active !== false)
      const activeCard = bankAccounts.find((account) => account.is_primary)?.card_number || bankAccounts[0]?.card_number
      const extraCount = bankAccounts.length > 1 ? bankAccounts.length - 1 : 0

      if (!activeCard) {
        return <span className='text-muted-foreground text-xs'>-</span>
      }

      return (
        <div className='flex items-center gap-1.5'>
          <BankCardBadge cardNumber={activeCard} size='sm' />
          {extraCount > 0 && (
            <Badge variant='secondary' className='text-[10px] px-1.5 py-0.5 font-medium'>
              +{extraCount}
            </Badge>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'brand_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Brand / Workshop' />
    ),
    cell: ({ row }) => (
      <div className='text-xs'>{row.getValue('brand_name') || '-'}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Role' />
    ),
    cell: ({ row }) => {
      const roleVal = (row.getValue('role') as string) || ''
      const roleConfig = roles.find(
        (r) => r.value.toUpperCase() === roleVal.toUpperCase()
      )
      const Icon = roleConfig?.icon
      const label = roleConfig?.label || roleVal

      return (
        <Badge
          variant='outline'
          className='text-xs font-medium bg-muted/60 dark:bg-muted/40 text-foreground border-border/80 flex items-center gap-1 w-fit'
        >
          {Icon && <Icon className='size-3 text-muted-foreground' />}
          <span>{label}</span>
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: 'is_active',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status / وضعیت' />
    ),
    cell: ({ row }) => {
      const isActive = row.original.is_active !== false
      return isActive ? (
        <Badge
          variant='outline'
          className='text-xs font-medium bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-500/40 shadow-2xs'
        >
          <span className='size-1.5 rounded-full bg-emerald-500 me-1.5 animate-pulse' />
          فعال (مشغول به کار)
        </Badge>
      ) : (
        <Badge
          variant='outline'
          className='text-xs font-medium bg-slate-500/10 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30 dark:border-slate-500/40 shadow-2xs'
        >
          <span className='size-1.5 rounded-full bg-slate-400 me-1.5' />
          غیرفعال (مرخص / راکد)
        </Badge>
      )
    },
    filterFn: (row, _id, value) => {
      const isActive = row.original.is_active !== false
      const statusStr = isActive ? 'active' : 'inactive'
      return value.includes(statusStr)
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
