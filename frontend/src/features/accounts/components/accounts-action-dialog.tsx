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
import { Checkbox } from '@/components/ui/checkbox'
import { BankCardInput } from '@/components/ui/bank-card-input'
import { SelectDropdown } from '@/components/select-dropdown'
import { type Account } from '../data/schema'
import { User as UserIcon } from 'lucide-react'

type SimpleUser = {
  id: number
  username: string
  first_name: string
  last_name: string
  role: string
  party_id?: number | null
}

type PartyOption = { id: number; display_name: string; kind: string }

const formSchema = z.object({
  user_id: z.number().optional().nullable(),
  party_id: z.number().optional().nullable(),
  is_primary: z.boolean(),
  f_name: z.string().min(1, 'First Name is required.'),
  l_name: z.string().min(1, 'Last Name is required.'),
  card_number: z
    .string()
    .length(16, 'Card number must be exactly 16 digits.')
    .regex(/^\d+$/, 'Card number must contain only numbers.'),
  is_workshop_account: z.boolean(),
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
  const [users, setUsers] = useState<SimpleUser[]>([])
  const [parties, setParties] = useState<PartyOption[]>([])

  useEffect(() => {
    if (open) {
      apiClient
        .get('/users/')
        .then((res) => {
          if (Array.isArray(res.data)) {
            setUsers(res.data)
          }
        })
        .catch(() => {})
      apiClient.get('/users/parties')
        .then((res) => setParties(Array.isArray(res.data) ? res.data : []))
        .catch(() => {})
    }
  }, [open])

  const form = useForm<AccountForm>({
    resolver: zodResolver(formSchema),
    values: isEdit && currentRow
      ? {
          user_id: currentRow.user_id ?? null,
          party_id: currentRow.owner_id ?? null,
          is_primary: currentRow.is_primary ?? false,
          f_name: currentRow.f_name || '',
          l_name: currentRow.l_name || '',
          card_number: currentRow.card_number || '',
          is_workshop_account: currentRow.is_workshop ?? false,
        }
      : {
          user_id: null,
          party_id: null,
          is_primary: false,
          f_name: '',
          l_name: '',
          card_number: '',
          is_workshop_account: false,
        },
  })

  const handleUserSelect = (val: string) => {
    if (val === 'none') {
      form.setValue('user_id', null)
      form.setValue('party_id', null)
      form.setValue('is_workshop_account', false)
      return
    }
    const uid = Number(val)
    form.setValue('user_id', uid)
    const selectedUser = users.find((u) => u.id === uid)
    form.setValue('party_id', selectedUser?.party_id ?? null)
    form.setValue('is_workshop_account', false)
    if (selectedUser) {
      if (!form.getValues('f_name')) {
        form.setValue('f_name', selectedUser.first_name || selectedUser.username)
      }
      if (!form.getValues('l_name')) {
        form.setValue('l_name', selectedUser.last_name || '')
      }
    }
  }

  const onSubmit = async (values: AccountForm) => {
    setIsLoading(true)
    try {
      const selectedParty = parties.find((party) => party.id === values.party_id)
      if (values.is_workshop_account && !isEdit && selectedParty?.kind !== 'WORKSHOP') {
        toast.error('برای حساب پرداخت کارگاه، طرف حساب «کارگاه» را انتخاب کنید.')
        return
      }
      if (values.party_id && values.user_id && users.find((user) => user.id === values.user_id)?.party_id !== values.party_id) {
        toast.error('طرف حساب و کاربر ورود با یکدیگر مطابقت ندارند.')
        return
      }
      const payload = {
        f_name: values.f_name,
        l_name: values.l_name,
        is_workshop_account: values.is_workshop_account,
        is_primary: values.is_primary,
      }

      if (isEdit && currentRow) {
        await apiClient.put(`/financial/accounts/${currentRow.id}`, payload)
        toast.success('Account updated successfully.')
      } else {
        await apiClient.post('/financial/accounts', {
          ...payload,
          card_number: values.card_number,
          party_id: values.party_id || undefined,
          user_id: values.user_id || undefined,
        })
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

  const userOptions = [
    { label: 'بدون کاربر ورود (طرف حساب مستقل)', value: 'none' },
    ...users.map((u) => {
      const name = `${u.first_name} ${u.last_name}`.trim() || u.username
      return {
        label: `${name} (${u.role})`,
        value: String(u.id),
      }
    }),
  ]

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
            {isEdit ? 'ویرایش کارت بدون انتقال مالکیت؛ برای تغییر مالک، فرآیند بررسی جداگانه لازم است.' : 'کارت را برای یک طرف حساب، حتی بدون حساب ورود، ثبت کنید.'}
          </DialogDescription>
        </DialogHeader>
        <div className='py-2'>
          <Form {...form}>
            <form
              id='account-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              {/* A login is optional and cannot be reassigned when editing a card. */}
              {!isEdit && <FormField
                control={form.control}
                name='user_id'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end flex items-center justify-end gap-1'>
                      <UserIcon className='size-3.5 text-muted-foreground' />
                      کاربر مرتبط
                    </FormLabel>
                    <div className='col-span-4'>
                      <SelectDropdown
                        defaultValue={field.value ? String(field.value) : 'none'}
                        onValueChange={handleUserSelect}
                        placeholder='انتخاب کاربر (خیاط، پرسنل، کارفرما)'
                        items={userOptions}
                      />
                    </div>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />}

              {!isEdit && (
                <FormField
                  control={form.control}
                  name='party_id'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                      <FormLabel className='col-span-2 text-end'>طرف حساب</FormLabel>
                      <div className='col-span-4'>
                        <SelectDropdown
                          defaultValue={field.value ? String(field.value) : 'new'}
                          onValueChange={(value) => {
                            const partyId = value === 'new' ? null : Number(value)
                            field.onChange(partyId)
                            form.setValue('user_id', null)
                            form.setValue('is_workshop_account', false)
                          }}
                          items={[
                            { label: 'طرف حساب بیرونی جدید (بدون ورود)', value: 'new' },
                            ...parties.map((party) => ({ label: `${party.display_name} (${party.kind})`, value: String(party.id) })),
                          ]}
                        />
                      </div>
                    </FormItem>
                  )}
                />
              )}

              {/* First Name */}
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

              {/* Last Name */}
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

              {/* Card Number */}
              <FormField
                control={form.control}
                name='card_number'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Card Number
                    </FormLabel>
                    <div className='col-span-4'>
                      <FormControl>
                        <BankCardInput
                          value={field.value || ''}
                          onChange={field.onChange}
                          disabled={isEdit}
                          placeholder='---- ---- ---- ----'
                        />
                      </FormControl>
                    </div>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {/* Primary card belongs to the selected party, not to a login role. */}
              <FormField
                control={form.control}
                name='is_primary'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1 pt-1'>
                    <div className='col-span-4 col-start-3 flex items-center gap-2'>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} id='is_primary' />
                      <label htmlFor='is_primary' className='text-xs font-semibold'>کارت اصلی این طرف حساب</label>
                    </div>
                  </FormItem>
                )}
              />

              {/* Workshop Paying Account Checkbox */}
              <FormField
                control={form.control}
                name='is_workshop_account'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1 pt-1'>
                    <div className='col-span-4 col-start-3 flex items-start space-x-2 space-x-reverse'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isEdit ? !currentRow?.is_workshop : parties.find((p) => p.id === form.watch('party_id'))?.kind !== 'WORKSHOP'}
                          id='is_workshop_account'
                        />
                      </FormControl>
                      <div className='grid gap-0.5 leading-none'>
                        <label
                          htmlFor='is_workshop_account'
                          className='text-xs font-semibold cursor-pointer text-foreground'
                        >
                          Workshop Paying Account (حساب واریز و پرداخت کارگاه)
                        </label>
                        <p className='text-[11px] text-muted-foreground'>
                          Enable this account to be selected for payroll transfers and workshop expense payments.
                        </p>
                      </div>
                    </div>
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
