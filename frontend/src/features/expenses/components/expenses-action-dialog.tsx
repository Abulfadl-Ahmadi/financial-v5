'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
import { PriceInput } from '@/components/ui/price-input'
import { DatePicker } from '@/components/ui/date-picker'
import { parseDate, formatDate } from '@/lib/persian-date'
import { SelectDropdown } from '@/components/select-dropdown'
import { type Expense } from '../data/schema'
import { expenseCategories } from '../data/data'

type AccountSimple = {
  id: number
  f_name: string
  l_name: string
  card_number: string
  bank_name?: string
  formatted_card_number?: string
  user_id?: number
  user_role?: string
  is_active?: boolean
  is_workshop?: boolean
  user_full_name?: string
}

const formSchema = z.object({
  title: z.string().min(1, 'Expense title is required.'),
  category: z.string().min(1, 'Category is required.'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0.'),
  date_jalali: z.string().min(1, 'Jalali Date is required.'),
  account_id: z.coerce.number().optional().default(0),
  notes: z.string().default(''),
})

type ExpenseForm = z.infer<typeof formSchema>

type ExpensesActionDialogProps = {
  currentRow?: Expense
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ExpensesActionDialog({
  currentRow,
  open,
  onOpenChange,
  onSuccess,
}: ExpensesActionDialogProps) {
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

  const form = useForm<ExpenseForm>({
    resolver: zodResolver(formSchema) as any,
    values: isEdit && currentRow
      ? {
          title: currentRow.title || '',
          category: currentRow.category || 'OTHER',
          amount: Number(currentRow.amount) || 0,
          date_jalali: currentRow.date_jalali || '',
          account_id: currentRow.account?.id || 0,
          notes: currentRow.notes || '',
        }
      : {
          title: '',
          category: 'SUPPLIES',
          amount: 0,
          date_jalali: '1405/06/01',
          account_id: 0,
          notes: '',
        },
  })

  const onSubmit = async (values: ExpenseForm) => {
    setIsLoading(true)
    try {
      const payload: Record<string, unknown> = {
        title: values.title,
        category: values.category,
        amount: values.amount,
        date_jalali: values.date_jalali,
        notes: values.notes,
      }
      if (values.account_id && values.account_id > 0) {
        payload.account_id = values.account_id
      } else if (isEdit) {
        payload.account_id = null
      }

      if (isEdit && currentRow) {
        await apiClient.put(`/financial/expenses/${currentRow.id}`, payload)
        toast.success('Expense record updated successfully.')
      } else {
        await apiClient.post('/financial/expenses', payload)
        toast.success('Expense logged successfully.')
      }

      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch {
      toast.error('Failed to save expense.')
    } finally {
      setIsLoading(false)
    }
  }

  const categoryOptions = expenseCategories.map((c) => ({
    label: c.label,
    value: c.value,
  }))

  const workshopAccounts = accounts.filter(
    (a) => a.is_workshop && a.is_active !== false
  )
  const sourceAccountList = workshopAccounts
  const accountOptions = sourceAccountList.map((acc) => {
    const owner = acc.user_full_name ? acc.user_full_name : `${acc.f_name} ${acc.l_name}`.trim() || 'Workshop Master'
    const bank = acc.bank_name || ''
    const card = acc.card_number ? `(${acc.card_number.slice(-4)})` : ''
    return {
      label: `🏛️ ${owner} - ${bank} ${card}`,
      value: String(acc.id),
    }
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Edit Expense Record' : 'Log Workshop Operating Expense'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update expense classification, amount, and source account.'
              : 'Record utility bills, rent, machinery maintenance, or supplies.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id='expense-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-3.5 py-1'
          >
            {/* Title */}
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs font-semibold'>Expense Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g. قبض برق ۳ فاز کارگاه مرداد ۱۴۰۵'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name='category'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs font-semibold'>Category</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='Select Expense Category'
                    items={categoryOptions}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount & Date */}
            <div className='grid grid-cols-2 gap-3'>
              <FormField
                control={form.control}
                name='amount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs font-semibold'>Amount (Tomans)</FormLabel>
                    <FormControl>
                      <PriceInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder='3,500,000'
                        className='font-bold text-rose-600 dark:text-rose-400'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='date_jalali'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs font-semibold'>Jalali Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value ? (parseDate(field.value, 'yyyy/MM/dd') ?? null) : null}
                        onValueChange={(date) => {
                          field.onChange(date ? formatDate(date, 'yyyy/MM/dd', { digits: 'en' }) : '')
                        }}
                        calendarType='shamsi'
                        placeholder='انتخاب تاریخ هزینه'
                        className='w-full justify-start'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Source Account (Optional) */}
            <FormField
              control={form.control}
              name='account_id'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs font-semibold'>Paid From Account (Optional)</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value ? String(field.value) : ''}
                    onValueChange={(val) => field.onChange(Number(val))}
                    placeholder='Select Workshop Account'
                    items={accountOptions}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs font-semibold'>Notes / Invoice Ref</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Additional invoice details, payment serial number or merchant name'
                      className='resize-none h-18 text-xs'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button type='submit' form='expense-form' disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Expense'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
