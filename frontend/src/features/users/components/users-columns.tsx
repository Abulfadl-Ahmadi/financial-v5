import { Link } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type User } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

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
      return <LongText className='max-w-36'>{fullName}</LongText>
    },
    meta: { className: 'w-36' },
  },
  {
    accessorKey: 'phone_number',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Phone Number' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap'>{row.getValue('phone_number') || '-'}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'card_number',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Card Number' />
    ),
    cell: ({ row }) => (
      <div className='w-fit font-mono text-xs'>{row.getValue('card_number') || '-'}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'brand_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Brand / Workshop' />
    ),
    cell: ({ row }) => (
      <div>{row.getValue('brand_name') || '-'}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Role' />
    ),
    cell: ({ row }) => {
      const role = row.getValue('role') as string
      return (
        <Badge variant='outline' className='capitalize font-mono text-xs'>
          {role}
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
    id: 'actions',
    cell: DataTableRowActions,
  },
]
