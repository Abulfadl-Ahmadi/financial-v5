import { type Table } from '@tanstack/react-table'
import { Trash2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
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
    const selectedIds = selectedRows.map((row) => (row.original as Receipt).id)
    if (selectedIds.length === 0) return

    toast.promise(
      apiClient.post('/financial/receipts/bulk-verify', { ids: selectedIds }).then(() => {
        table.resetRowSelection()
        window.location.reload()
      }),
      {
        loading: 'تأیید فیش‌های انتخاب‌شده...',
        success: `تعداد ${selectedIds.length} فیش با موفقیت تأیید شد.`,
        error: 'خطا در تأیید گروهی فیش‌ها',
      }
    )
  }

  const handleBulkDelete = () => {
    const selectedIds = selectedRows.map((row) => (row.original as Receipt).id)
    if (selectedIds.length === 0) return

    toast.promise(
      apiClient.post('/financial/receipts/bulk-delete', { ids: selectedIds }).then(() => {
        table.resetRowSelection()
        window.location.reload()
      }),
      {
        loading: 'حذف فیش‌های انتخاب‌شده...',
        success: `تعداد ${selectedIds.length} فیش با موفقیت حذف شد.`,
        error: 'خطا در حذف گروهی فیش‌ها',
      }
    )
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
