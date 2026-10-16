import { type Table } from '@tanstack/react-table'
import { Trash2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { sleep } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type Receipt } from '../data/schema'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkVerify = () => {
    const selectedReceipts = selectedRows.map((row) => row.original as Receipt)
    toast.promise(sleep(1000), {
      loading: 'Verifying receipts...',
      success: () => {
        table.resetRowSelection()
        return `Verified ${selectedReceipts.length} receipt${selectedReceipts.length > 1 ? 's' : ''}`
      },
      error: 'Error verifying receipts',
    })
    table.resetRowSelection()
  }

  const handleBulkDelete = () => {
    const selectedReceipts = selectedRows.map((row) => row.original as Receipt)
    toast.promise(sleep(1000), {
      loading: 'Deleting receipts...',
      success: () => {
        table.resetRowSelection()
        return `Deleted ${selectedReceipts.length} receipt${selectedReceipts.length > 1 ? 's' : ''}`
      },
      error: 'Error deleting receipts',
    })
    table.resetRowSelection()
  }

  return (
    <BulkActionsToolbar table={table} entityName='receipt'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            onClick={handleBulkVerify}
            className='size-8'
            aria-label='Verify selected receipts'
            title='Verify selected receipts'
          >
            <CheckCircle2 className='h-4 w-4 text-emerald-600' />
            <span className='sr-only'>Verify selected receipts</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Verify selected receipts</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='destructive'
            size='icon'
            onClick={handleBulkDelete}
            className='size-8'
            aria-label='Delete selected receipts'
            title='Delete selected receipts'
          >
            <Trash2 className='h-4 w-4' />
            <span className='sr-only'>Delete selected receipts</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Delete selected receipts</p>
        </TooltipContent>
      </Tooltip>
    </BulkActionsToolbar>
  )
}
