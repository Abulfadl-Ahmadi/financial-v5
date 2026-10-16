import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type Receipt } from '../data/schema'
import { receiptTypes, receiptStatusStyles, receiptTypeLabels } from '../data/data'
import { DataTableRowActions } from './data-table-row-actions'
import { ReceiptImageDialog } from './receipt-image-dialog'
import { BankCardBadge } from '@/components/ui/bank-card-badge'
import { TomanIcon } from '@/components/ui/toman-icon'
import { CreditCard, Calendar, Clock, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

function TrackingCodeCell({ receipt }: { receipt: Receipt }) {
  const [showImage, setShowImage] = useState(false)
  const hasImage = !!receipt.receipt_image

  return (
    <>
      <div className='flex items-center gap-1.5'>
        <LongText className='max-w-32 ps-1 font-mono font-semibold text-foreground'>
          {receipt.tracking_code || '-'}
        </LongText>
        {hasImage && (
          <Button
            variant='ghost'
            size='icon'
            className='size-6 text-primary hover:bg-primary/10'
            title='View Receipt Image'
            onClick={() => setShowImage(true)}
          >
            <ImageIcon className='h-3.5 w-3.5' />
          </Button>
        )}
      </div>

      <ReceiptImageDialog
        receipt={receipt}
        open={showImage}
        onOpenChange={setShowImage}
      />
    </>
  )
}

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
    cell: ({ row }) => <TrackingCodeCell receipt={row.original} />,
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'receipt_type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Type' />
    ),
    cell: ({ row }) => {
      const typeVal = (row.getValue('receipt_type') as string) || 'OTHER'
      const foundType = receiptTypes.find((t) => t.value === typeVal)
      const Icon = foundType?.icon || CreditCard
      const label = receiptTypeLabels[typeVal] || typeVal

      return (
        <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
          <Icon className='h-3.5 w-3.5 text-primary/70' />
          <span className='font-medium'>{label}</span>
        </div>
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
        <div className='flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-nowrap'>
          <span>{amount.toLocaleString()}</span>
          <TomanIcon className='size-3.5 text-muted-foreground' />
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
      if (!acc) return <span className='text-muted-foreground text-xs'>-</span>
      const holder = acc.user_full_name || `${acc.f_name} ${acc.l_name}`.trim() || 'حساب کارگاه'
      return (
        <BankCardBadge
          cardNumber={acc.card_number}
          holderName={holder}
          mono={true}
          size='sm'
        />
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
      if (!acc) return <span className='text-muted-foreground text-xs'>-</span>
      const holder = acc.user_full_name || `${acc.f_name} ${acc.l_name}`.trim() || 'حساب مقصد'
      return (
        <BankCardBadge
          cardNumber={acc.card_number}
          holderName={holder}
          mono={true}
          size='sm'
        />
      )
    },
  },
  {
    accessorKey: 'date_jalali',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Date & Time' />
    ),
    cell: ({ row }) => {
      const date = row.getValue('date_jalali') as string
      const time = row.original.time_str
      return (
        <div className='flex items-center gap-1.5 tabular-nums text-xs text-nowrap'>
          <Calendar className='h-3.5 w-3.5 text-muted-foreground' />
          <span>{date || '-'}</span>
          {time && (
            <span className='text-muted-foreground text-[11px] flex items-center gap-0.5 ms-1'>
              <Clock className='h-3 w-3' />
              {time}
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = ((row.getValue('status') as string) || 'VERIFIED').toUpperCase()
      const styleClass = receiptStatusStyles.get(status) || receiptStatusStyles.get('VERIFIED')!

      return (
        <Badge
          variant='outline'
          className={cn('capitalize font-medium text-[11px] px-2 py-0.5', styleClass)}
        >
          {status.toLowerCase()}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
