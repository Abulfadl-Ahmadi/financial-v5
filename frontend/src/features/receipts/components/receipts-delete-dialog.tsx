'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { apiClient } from '@/lib/api-client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type Receipt } from '../data/schema'

type ReceiptDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Receipt
  onSuccess?: () => void
}

export function ReceiptsDeleteDialog({
  open,
  onOpenChange,
  currentRow,
  onSuccess,
}: ReceiptDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await apiClient.delete(`/financial/receipts/${currentRow.id}`)
      toast.success('Receipt deleted successfully.')
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      } else {
        window.location.reload()
      }
    } catch (error: unknown) {
      let message = 'Failed to delete receipt.'
      if (error instanceof AxiosError && error.response?.data?.detail) {
        message = typeof error.response.data.detail === 'string'
          ? error.response.data.detail
          : JSON.stringify(error.response.data.detail)
      }
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      form='receipts-delete-form'
      disabled={isLoading}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Delete Receipt
        </span>
      }
      desc={
        <form
          id='receipts-delete-form'
          onSubmit={(e) => {
            e.preventDefault()
            handleDelete()
          }}
          className='space-y-4'
        >
          <p className='mb-2'>
            Are you sure you want to delete receipt with tracking code{' '}
            <span className='font-bold font-mono'>{currentRow.tracking_code}</span>?
            <br />
            This action cannot be undone.
          </p>

          <Alert variant='destructive'>
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be careful, this operation can not be rolled back.
            </AlertDescription>
          </Alert>
        </form>
      }
      confirmText='Delete'
      destructive
    />
  )
}
