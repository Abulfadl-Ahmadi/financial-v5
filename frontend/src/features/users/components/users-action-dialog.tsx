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
import { PasswordInput } from '@/components/password-input'
import { SelectDropdown } from '@/components/select-dropdown'
import { roles } from '../data/data'
import { type User } from '../data/schema'
import { BankCardInput } from '@/components/ui/bank-card-input'
import { normalizeCardNumber } from '@/lib/bank-utils'
import { Plus, Trash2, CreditCard } from 'lucide-react'

const formSchema = z
  .object({
    firstName: z.string().min(1, 'First Name is required.'),
    lastName: z.string().min(1, 'Last Name is required.'),
    username: z.string().min(1, 'Username is required.'),
    email: z.string().default(''),
    phoneNumber: z.string().default(''),
    cardNumber: z.string().default(''),
    brandName: z.string().default(''),
    role: z.string().min(1, 'Role is required.'),
    isActive: z.boolean().default(true),
    password: z.string().transform((pwd) => pwd.trim()),
    confirmPassword: z.string().transform((pwd) => pwd.trim()),
    isEdit: z.boolean(),
    partyId: z.number().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.isEdit && !data.password) return true
      return data.password.length > 0
    },
    {
      message: 'Password is required.',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password, confirmPassword }) => {
      if (isEdit && !password) return true
      return password === confirmPassword
    },
    {
      message: "Passwords don't match.",
      path: ['confirmPassword'],
    }
  )

type UserForm = z.infer<typeof formSchema>

type UserActionDialogProps = {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function UsersActionDialog({
  currentRow,
  open,
  onOpenChange,
  onSuccess,
}: UserActionDialogProps) {
  const isEdit = !!currentRow
  const [isLoading, setIsLoading] = useState(false)
  const [additionalCards, setAdditionalCards] = useState<string[]>([])
  const [parties, setParties] = useState<{ id: number; display_name: string; kind: string }[]>([])

  useEffect(() => {
    if (open && !currentRow) {
      apiClient.get('/users/parties')
        .then((response) => setParties(Array.isArray(response.data) ? response.data : []))
        .catch(() => {})
    }
    if (open) {
      setAdditionalCards([])
    }
  }, [open, currentRow])

  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema) as any,
    values: isEdit && currentRow
      ? {
          firstName: currentRow.first_name || '',
          lastName: currentRow.last_name || '',
          username: currentRow.username || '',
          email: currentRow.email || '',
          role: currentRow.role || 'WORKER',
          isActive: currentRow.is_active !== false,
          phoneNumber: currentRow.phone_number || '',
          cardNumber: '',
          partyId: currentRow.party_id ?? null,
          brandName: currentRow.brand_name || '',
          password: '',
          confirmPassword: '',
          isEdit: true,
        }
      : {
          firstName: '',
          lastName: '',
          username: '',
          email: '',
          role: 'WORKER',
          isActive: true,
          phoneNumber: '',
          cardNumber: '',
          partyId: null,
          brandName: '',
          password: '',
          confirmPassword: '',
          isEdit: false,
        },
  })

  const handleAddExtraCard = () => {
    setAdditionalCards((prev) => [...prev, ''])
  }

  const handleExtraCardChange = (index: number, val: string) => {
    setAdditionalCards((prev) => {
      const copy = [...prev]
      copy[index] = normalizeCardNumber(val)
      return copy
    })
  }

  const handleRemoveExtraCard = (index: number) => {
    setAdditionalCards((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (values: UserForm) => {
    setIsLoading(true)
    try {
      const payload: Record<string, unknown> = {
        username: values.username,
        first_name: values.firstName,
        last_name: values.lastName,
        role: values.role,
        is_active: values.isActive,
        email: values.email || '',
        phone_number: values.phoneNumber || null,
        brand_name: values.brandName || null,
      }
      if (additionalCards.some((card) => card && normalizeCardNumber(card).length !== 16)) {
        toast.error('شماره همه کارت‌های اضافه باید دقیقاً ۱۶ رقم باشد.')
        return
      }
      if (values.cardNumber && normalizeCardNumber(values.cardNumber).length !== 16) {
        toast.error('شماره کارت اصلی باید دقیقاً ۱۶ رقم باشد.')
        return
      }

      if (!isEdit) {
        payload.card_number = values.cardNumber ? normalizeCardNumber(values.cardNumber) : null
        payload.additional_cards = additionalCards.map(normalizeCardNumber).filter((card) => card.length === 16)
        if (values.partyId) payload.party_id = values.partyId
      }
      if (values.password) {
        payload.password = values.password
      }

      if (isEdit && currentRow) {
        await apiClient.put(`/users/${currentRow.id}`, payload)
        toast.success('User updated successfully.')
      } else {
        await apiClient.post('/users/', payload)
        toast.success('User created successfully.')
      }

      form.reset()
      setAdditionalCards([])
      onOpenChange(false)
      onSuccess?.()
    } catch (error: unknown) {
      let message = 'Failed to save user.'
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

  const isPasswordTouched = !!form.formState.dirtyFields.password

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        setAdditionalCards([])
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the user here. Click save when you're done."
              : "Create new user here. Click save when you're done."}
          </DialogDescription>
        </DialogHeader>
        <div className='h-110 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='user-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      First Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='John'
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
                name='lastName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Last Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Doe'
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
                name='username'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Username
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='john_doe'
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
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='john.doe@gmail.com'
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
                name='phoneNumber'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='09121234567'
                        className='col-span-4 font-mono'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {!isEdit && (
                <FormField
                  control={form.control}
                  name='partyId'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                      <FormLabel className='col-span-2 text-end'>طرف حساب مرتبط</FormLabel>
                      <SelectDropdown
                        defaultValue={field.value ? String(field.value) : 'new'}
                        onValueChange={(value) => field.onChange(value === 'new' ? null : Number(value))}
                        placeholder='انتخاب اختیاری شخص موجود'
                        className='col-span-4'
                        items={[
                          { label: 'ساخت شخص جدید همزمان با کاربر', value: 'new' },
                          ...parties.map((party) => ({ label: `${party.display_name} (${party.kind})`, value: String(party.id) })),
                        ]}
                      />
                    </FormItem>
                  )}
                />
              )}

              {/* New users may register cards; existing users manage them in the card screen. */}
              {!isEdit && <FormField
                control={form.control}
                name='cardNumber'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Primary Bank Card
                    </FormLabel>
                    <div className='col-span-4'>
                      <FormControl>
                        <BankCardInput
                          value={field.value || ''}
                          onChange={(val) => field.onChange(val)}
                          placeholder='---- ---- ---- ----'
                        />
                      </FormControl>
                    </div>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />}

              {/* Multiple Bank Accounts Section */}
              {!isEdit && <div className='p-3 rounded-lg border border-border/70 bg-muted/20 space-y-2.5'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                    <CreditCard className='h-3.5 w-3.5 text-primary' /> Additional Bank Accounts (حساب‌های دیگر خیاط)
                  </span>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='text-[11px] h-6 px-2 gap-1'
                    onClick={handleAddExtraCard}
                  >
                    <Plus className='h-3 w-3' /> Add Card
                  </Button>
                </div>

                {additionalCards.length === 0 ? (
                  <p className='text-[11px] text-muted-foreground'>
                    No additional cards registered. Click Add Card if this person uses multiple bank accounts.
                  </p>
                ) : (
                  <div className='space-y-2.5'>
                    {additionalCards.map((card, idx) => (
                      <div key={idx} className='flex items-start gap-2 bg-background/50 p-2 rounded-md border border-border/50'>
                        <div className='flex-1'>
                          <BankCardInput
                            value={card}
                            onChange={(val) => handleExtraCardChange(idx, val)}
                            placeholder={`Card #${idx + 2} (16 digits)`}
                          />
                        </div>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='size-8 mt-1 text-muted-foreground hover:text-destructive shrink-0'
                          onClick={() => handleRemoveExtraCard(idx)}
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>}

              <FormField
                control={form.control}
                name='brandName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Brand / Workshop
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Brand name'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Role</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='Select a role'
                      className='col-span-4'
                      items={roles.map(({ label, value }) => ({
                        label,
                        value,
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1 pt-1'>
                    <div className='col-span-4 col-start-3 flex items-start space-x-2 space-x-reverse'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id='isActive'
                        />
                      </FormControl>
                      <div className='grid gap-0.5 leading-none'>
                        <label
                          htmlFor='isActive'
                          className='text-xs font-semibold cursor-pointer text-foreground'
                        >
                          اکانت فعال است (مشغول به کار در کارگاه)
                        </label>
                        <p className='text-[11px] text-muted-foreground'>
                          در صورت غیرفعال کردن، خیاط یا پرسنل مرخص شده اما تمام سوابق، تسویه‌حساب‌ها و فیش‌ها بدون حذف حفظ خواهند شد.
                        </p>
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Password
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder={isEdit ? 'Leave empty to keep current' : 'Enter password'}
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        disabled={!isPasswordTouched}
                        placeholder={isEdit ? 'Leave empty to keep current' : 'Confirm password'}
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
          <Button type='submit' form='user-form' disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
