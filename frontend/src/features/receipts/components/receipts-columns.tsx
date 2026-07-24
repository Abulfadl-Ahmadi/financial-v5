import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type Receipt } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const receiptsColumns: ColumnDef<Receipt>[] = [
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
    accessorKey: 'tracking_code',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Tracking Code' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36 ps-3 font-mono font-semibold text-foreground'>
        {row.getValue('tracking_code')}
      </LongText>
    ),
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Amount' />
    ),
    cell: ({ row }) => {
      const amount = Number(row.getValue('amount')) || 0
      return (
        <div className='font-mono font-bold text-emerald-600 dark:text-emerald-400 text-nowrap'>
          {amount.toLocaleString()} تومان
        </div>
      )
    },
  },
  {
    id: 'from_account',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='From Account' />
    ),
    cell: ({ row }) => {
      const acc = row.original.from_account
      if (!acc) return '-'
      const name = `${acc.f_name} ${acc.l_name}`.trim()
      return (
        <div className='flex flex-col text-xs'>
          <span className='font-medium'>{name}</span>
          <span className='font-mono text-muted-foreground'>{acc.formatted_card_number || acc.card_number}</span>
        </div>
      )
    },
  },
  {
    id: 'to_account',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='To Account' />
    ),
    cell: ({ row }) => {
      const acc = row.original.to_account
      if (!acc) return '-'
      const name = `${acc.f_name} ${acc.l_name}`.trim()
      return (
        <div className='flex flex-col text-xs'>
          <span className='font-medium'>{name}</span>
          <span className='font-mono text-muted-foreground'>{acc.formatted_card_number || acc.card_number}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'date_jalali',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Date' />
    ),
    cell: ({ row }) => (
      <div className='font-mono text-xs text-nowrap'>
        {row.getValue('date_jalali')} {row.original.time_str || ''}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge variant='outline' className='capitalize font-mono text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'>
          {status}
        </Badge>
      )
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
