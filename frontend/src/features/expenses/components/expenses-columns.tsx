import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type Expense } from '../data/schema'
import { expenseCategories, expenseCategoryStyles, expenseCategoryLabels } from '../data/data'
import { DataTableRowActions } from './data-table-row-actions'
import { TomanIcon } from '@/components/ui/toman-icon'
import { BankCardBadge } from '@/components/ui/bank-card-badge'
import { Calendar, Layers } from 'lucide-react'

export const expensesColumns: ColumnDef<Expense>[] = [
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
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Expense Title & Notes' />
    ),
    cell: ({ row }) => {
      const title = row.getValue('title') as string
      const notes = row.original.notes
      return (
        <div className='flex flex-col max-w-64'>
          <span className='font-semibold text-xs text-foreground'>{title || 'Expense'}</span>
          {notes && (
            <LongText className='text-[11px] text-muted-foreground'>
              {notes}
            </LongText>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Category' />
    ),
    cell: ({ row }) => {
      const catVal = (row.getValue('category') as string) || 'OTHER'
      const foundCat = expenseCategories.find((c) => c.value === catVal)
      const Icon = foundCat?.icon || Layers
      const label = expenseCategoryLabels[catVal] || catVal
      const styleClass = expenseCategoryStyles.get(catVal) || expenseCategoryStyles.get('OTHER')!

      return (
        <Badge
          variant='outline'
          className={cn('capitalize font-medium text-[11px] px-2 py-1 flex items-center gap-1.5 w-fit', styleClass)}
        >
          <Icon className='h-3 w-3' />
          <span>{label.split('(')[0].trim()}</span>
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Amount' />
    ),
    cell: ({ row }) => {
      const amount = Number(row.getValue('amount')) || 0
      return (
        <div className='flex items-center gap-1 font-mono font-bold text-rose-600 dark:text-rose-400 text-nowrap text-xs'>
          <span>{amount.toLocaleString()}</span>
          <TomanIcon className='size-3 text-muted-foreground' />
        </div>
      )
    },
  },
  {
    id: 'account',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Paid Account' />
    ),
    cell: ({ row }) => {
      const acc = row.original.account
      if (!acc) return <span className='text-muted-foreground text-xs font-mono'>Cash / Petty</span>
      return (
        <BankCardBadge
          cardNumber={acc.card_number}
          holderName={acc.user_full_name || `${acc.f_name} ${acc.l_name}`.trim() || 'حساب کارگاه'}
          mono={true}
          size='sm'
        />
      )
    },
  },
  {
    accessorKey: 'date_jalali',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Date' />
    ),
    cell: ({ row }) => {
      const date = row.getValue('date_jalali') as string
      return (
        <div className='flex items-center gap-1.5 tabular-nums text-xs text-nowrap'>
          <Calendar className='h-3.5 w-3.5 text-muted-foreground' />
          <span>{date || '-'}</span>
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
