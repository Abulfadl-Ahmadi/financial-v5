'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { apiClient } from '@/lib/api-client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type Account } from '../data/schema'

type AccountDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Account
  onSuccess?: () => void
}

export function AccountsDeleteDialog({
  open,
  onOpenChange,
  currentRow,
  onSuccess,
}: AccountDeleteDialogProps) {
  const [value, setValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const holderName = `${currentRow.f_name} ${currentRow.l_name}`.trim()

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await apiClient.delete(`/financial/accounts/${currentRow.id}`)
      toast.success('Account deleted successfully.')
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      } else {
        window.location.reload()
      }
    } catch (error: unknown) {
      let message = 'Failed to delete account.'
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
      form='accounts-delete-form'
      disabled={isLoading}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Delete Account
        </span>
      }
      desc={
        <form
          id='accounts-delete-form'
          onSubmit={(e) => {
            e.preventDefault()
            handleDelete()
          }}
          className='space-y-4'
        >
          <p className='mb-2'>
            Are you sure you want to delete the account for{' '}
            <span className='font-bold'>{holderName}</span> ({currentRow.card_number})?
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
