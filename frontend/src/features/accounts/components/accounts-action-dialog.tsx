'use client'

import { useState } from 'react'
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
import { type Account } from '../data/schema'

const formSchema = z.object({
  f_name: z.string().min(1, 'First Name is required.'),
  l_name: z.string().min(1, 'Last Name is required.'),
  card_number: z
    .string()
    .length(16, 'Card number must be exactly 16 digits.')
    .regex(/^\d+$/, 'Card number must contain only numbers.'),
})

type AccountForm = z.infer<typeof formSchema>

type AccountActionDialogProps = {
  currentRow?: Account
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AccountsActionDialog({
  currentRow,
  open,
  onOpenChange,
  onSuccess,
}: AccountActionDialogProps) {
  const isEdit = !!currentRow
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<AccountForm>({
    resolver: zodResolver(formSchema),
    values: isEdit && currentRow
      ? {
          f_name: currentRow.f_name || '',
          l_name: currentRow.l_name || '',
          card_number: currentRow.card_number || '',
        }
      : {
          f_name: '',
          l_name: '',
          card_number: '',
        },
  })

  const onSubmit = async (values: AccountForm) => {
    setIsLoading(true)
    try {
      if (isEdit && currentRow) {
        await apiClient.put(`/financial/accounts/${currentRow.id}`, values)
        toast.success('Account updated successfully.')
      } else {
        await apiClient.post('/financial/accounts', values)
        toast.success('Account created successfully.')
      }

      form.reset()
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      } else {
        window.location.reload()
      }
    } catch (error: unknown) {
      let message = 'Failed to save account.'
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
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Edit Account' : 'Add New Account'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update account details here. ' : 'Create a new bank account here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className='py-2'>
          <Form {...form}>
            <form
              id='account-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='f_name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      First Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='First Name'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='l_name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Last Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Last Name'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='card_number'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Card Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='16-digit Card Number'
                        maxLength={16}
                        className='col-span-4 font-mono'
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
          <Button type='submit' form='account-form' disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
