import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type Account } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

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
      <DataTableColumnHeader column={column} title='Card Number' />
    ),
    cell: ({ row }) => {
      const formatted = row.original.formatted_card_number || row.original.card_number
      return <div className='font-mono font-medium text-nowrap'>{formatted}</div>
    },
  },
  {
    accessorKey: 'bank_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Bank' />
    ),
    cell: ({ row }) => (
      <Badge variant='outline' className='font-medium text-xs'>
        {row.getValue('bank_name') || 'Bank'}
      </Badge>
    ),
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
