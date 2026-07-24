'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectDropdown } from '@/components/select-dropdown'
import { type Receipt } from '../data/schema'

type AccountSimple = {
  id: number
  f_name: str
  l_name: str
  card_number: str
}

const formSchema = z.object({
  tracking_code: z.string().min(1, 'Tracking Code is required.'),
  date_jalali: z.string().min(1, 'Jalali Date is required.'),
  amount: z.coerce.number().min(1, 'Amount is required.'),
  from_account_id: z.coerce.number().min(1, 'From Account is required.'),
  to_account_id: z.coerce.number().min(1, 'To Account is required.'),
  receipt_type: z.string().default('CARD_TO_CARD'),
  notes: z.string().optional().default(''),
})

type ReceiptForm = z.infer<typeof formSchema>

type ReceiptActionDialogProps = {
  currentRow?: Receipt
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ReceiptsActionDialog({
  currentRow,
  open,
  onOpenChange,
  onSuccess,
}: ReceiptActionDialogProps) {
  const isEdit = !!currentRow
  const [isLoading, setIsLoading] = useState(false)
  const [accounts, setAccounts] = useState<AccountSimple[]>([])

  useEffect(() => {
    if (open) {
      apiClient
        .get('/financial/accounts')
        .then((res) => setAccounts(res.data))
        .catch(() => {})
    }
  }, [open])

  const form = useForm<ReceiptForm>({
    resolver: zodResolver(formSchema),
    values: isEdit && currentRow
      ? {
          tracking_code: currentRow.tracking_code || '',
          date_jalali: currentRow.date_jalali || '',
          amount: Number(currentRow.amount) || 0,
          from_account_id: currentRow.from_account?.id || 0,
          to_account_id: currentRow.to_account?.id || 0,
          receipt_type: currentRow.receipt_type || 'CARD_TO_CARD',
          notes: currentRow.notes || '',
        }
      : {
          tracking_code: '',
          date_jalali: new Date().toLocaleDateString('fa-IR'),
          amount: 0,
          from_account_id: 0,
          to_account_id: 0,
          receipt_type: 'CARD_TO_CARD',
          notes: '',
        },
  })

  const onSubmit = async (values: ReceiptForm) => {
    setIsLoading(true)
    try {
      if (isEdit && currentRow) {
        await apiClient.put(`/financial/receipts/${currentRow.id}`, values)
        toast.success('Receipt updated successfully.')
      } else {
        await apiClient.post('/financial/receipts', values)
        toast.success('Receipt created successfully.')
      }

      form.reset()
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      } else {
        window.location.reload()
      }
    } catch (error: unknown) {
      let message = 'Failed to save receipt.'
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

  const accountOptions = accounts.map((acc) => ({
    label: `${acc.f_name} ${acc.l_name} (${acc.card_number.slice(-4)})`,
    value: String(acc.id),
  }))

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Edit Receipt' : 'Add New Receipt'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update receipt details here. ' : 'Record a new transfer receipt here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className='h-105 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='receipt-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='tracking_code'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Tracking Code
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='12345678'
                        className='col-span-4 font-mono'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='amount'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Amount (تومان)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='1000000'
                        className='col-span-4 font-mono'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='date_jalali'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Jalali Date
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='1403/05/01'
                        className='col-span-4 font-mono'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='from_account_id'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>From Account</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(Number(val))}
                      placeholder='Select From Account'
                      className='col-span-4'
                      items={accountOptions}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='to_account_id'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>To Account</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(Number(val))}
                      placeholder='Select To Account'
                      className='col-span-4'
                      items={accountOptions}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='notes'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Notes
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Optional notes'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='receipt-form' disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
