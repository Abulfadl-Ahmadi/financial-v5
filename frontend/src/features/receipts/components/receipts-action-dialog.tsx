'use client'

import { useState, useEffect, useRef } from 'react'
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
import { receiptTypes, receiptStatuses } from '../data/data'
import { BankCardInput } from '@/components/ui/bank-card-input'
import { BankCardBadge } from '@/components/ui/bank-card-badge'
import { PriceInput } from '@/components/ui/price-input'
import { DateTimePicker } from '@/components/ui/date-picker'
import { parseDate, formatDate } from '@/lib/persian-date'
import { CreditCard, User as UserIcon, UploadCloud, ImageIcon, Trash2 } from 'lucide-react'

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

type PartySimple = { id: number; display_name: string; kind: string }

type UserSimple = {
  id: number
  username: string
  first_name: string
  last_name: string
  role: string
  card_number?: string
  bank_accounts?: AccountSimple[]
}

const formSchema = z.object({
  tracking_code: z.string().min(1, 'Tracking Code is required.'),
  date_jalali: z.string().min(1, 'Jalali Date is required.'),
  time_str: z.string().optional().default(''),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0.'),
  from_account_id: z.coerce.number().min(1, 'Source Account is required.'),

  // Destination account selection
  to_account_id: z.coerce.number().optional().default(0),

  // Optional dynamic new card fields
  use_new_card: z.boolean().default(false),
  selected_user_id: z.coerce.number().optional().default(0),
  selected_party_id: z.coerce.number().optional().default(0),
  new_to_card_number: z.string().optional().default(''),
  new_to_f_name: z.string().optional().default(''),
  new_to_l_name: z.string().optional().default(''),

  receipt_type: z.string().default('OTHER'),
  status: z.string().default('VERIFIED'),
  notes: z.string().default(''),
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
  const [users, setUsers] = useState<UserSimple[]>([])
  const [parties, setParties] = useState<PartySimple[]>([])
  const [isNewCardMode, setIsNewCardMode] = useState(false)
  const [savedReceiptForUpload, setSavedReceiptForUpload] = useState<number | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      // Load accounts
      apiClient
        .get('/financial/accounts')
        .then((res) => setAccounts(res.data))
        .catch(() => { })

      // Load users (tailors, workers, contractors)
      apiClient
        .get('/users/')
        .then((res) => setUsers(res.data))
        .catch(() => { })
      apiClient.get('/users/parties')
        .then((res) => setParties(Array.isArray(res.data) ? res.data : []))
        .catch(() => { })

      // Preload image preview if exists
      if (currentRow?.receipt_image) {
        setImagePreview(currentRow.receipt_image)
      } else {
        setImagePreview(null)
      }
      setImageFile(null)
    }
  }, [open, currentRow])

  const form = useForm<ReceiptForm>({
    resolver: zodResolver(formSchema) as any,
    values: isEdit && currentRow
      ? {
        tracking_code: currentRow.tracking_code || '',
        date_jalali: currentRow.date_jalali || '',
        time_str: currentRow.time_str || '',
        amount: Number(currentRow.amount) || 0,
        from_account_id: currentRow.from_account?.id || 0,
        to_account_id: currentRow.to_account?.id || 0,
        use_new_card: false,
        selected_user_id: currentRow.to_account?.user_id || 0,
        selected_party_id: 0,
        new_to_card_number: '',
        new_to_f_name: '',
        new_to_l_name: '',
        receipt_type: currentRow.receipt_type || 'OTHER',
        status: currentRow.status || 'VERIFIED',
        notes: currentRow.notes || '',
      }
      : {
        tracking_code: '',
        date_jalali: '',
        time_str: '',
        amount: 0,
        from_account_id: 0,
        to_account_id: 0,
        use_new_card: false,
        selected_user_id: 0,
        selected_party_id: 0,
        new_to_card_number: '',
        new_to_f_name: '',
        new_to_l_name: '',
        receipt_type: 'OTHER',
        status: 'VERIFIED',
        notes: '',
      },
  })

  const selectedUserId = form.watch('selected_user_id')

  // When a tailor is selected in dynamic mode, prefill name and show their cards
  const handleUserSelect = (userIdStr: string) => {
    const uId = Number(userIdStr)
    form.setValue('selected_user_id', uId)
    form.setValue('selected_party_id', 0)
    const user = users.find((u) => u.id === uId)
    if (user) {
      form.setValue('new_to_f_name', user.first_name || user.username)
      form.setValue('new_to_l_name', user.last_name || '')

      // If user has existing cards, set default to account id
      if (user.bank_accounts && user.bank_accounts.length > 0) {
        form.setValue('to_account_id', user.bank_accounts[0].id)
      }
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be under 5MB.')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (values: ReceiptForm) => {
    setIsLoading(true)
    let persistedId = savedReceiptForUpload
    try {
      if (!savedReceiptForUpload && isNewCardMode && !/^\d{16}$/.test(values.new_to_card_number.replace(/\D/g, ''))) {
        toast.error('شماره کارت مقصد باید ۱۶ رقم باشد.')
        return
      }
      if (!savedReceiptForUpload && !isNewCardMode && !values.to_account_id) {
        toast.error('حساب مقصد را انتخاب کنید.')
        return
      }
      if (!savedReceiptForUpload && !accounts.some((account) => account.id === values.from_account_id && account.is_workshop && account.is_active !== false)) {
        toast.error('یک حساب فعال متعلق به کارگاه را برای مبدأ انتخاب کنید.')
        return
      }
      const payload: Record<string, unknown> = {
        tracking_code: values.tracking_code,
        date_jalali: values.date_jalali,
        time_str: values.time_str || undefined,
        amount: values.amount,
        from_account_id: values.from_account_id,
        receipt_type: values.receipt_type,
        status: values.status,
        notes: values.notes,
      }

      if (isNewCardMode && values.new_to_card_number) {
        payload.new_to_card_number = values.new_to_card_number.replace(/\D/g, '')
        payload.new_to_f_name = values.new_to_f_name || ''
        payload.new_to_l_name = values.new_to_l_name || ''
        if (values.selected_user_id) {
          payload.user_id = values.selected_user_id
        }
        if (values.selected_party_id) {
          payload.party_id = values.selected_party_id
        }
      } else {
        payload.to_account_id = values.to_account_id
      }

      let savedReceiptId: number
      if (persistedId) {
        savedReceiptId = persistedId
      } else if (isEdit && currentRow) {
        const res = await apiClient.put(`/financial/receipts/${currentRow.id}`, payload)
        savedReceiptId = res.data.id
      } else {
        const res = await apiClient.post('/financial/receipts', payload)
        savedReceiptId = res.data.id
      }
      persistedId = savedReceiptId
      setSavedReceiptForUpload(savedReceiptId)

      // Upload image if selected
      if (imageFile && savedReceiptId) {
        const formData = new FormData()
        formData.append('file', imageFile)
        await apiClient.post(`/financial/receipts/${savedReceiptId}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      toast.success(isEdit ? 'Receipt updated successfully.' : 'Receipt created successfully.')
      setSavedReceiptForUpload(null)
      form.reset()
      setImageFile(null)
      setImagePreview(null)
      setIsNewCardMode(false)
      onOpenChange(false)
      onSuccess?.()
    } catch (error: unknown) {
      let message = 'Failed to save receipt.'
      if (error instanceof AxiosError && error.response?.data?.detail) {
        message = typeof error.response.data.detail === 'string'
          ? error.response.data.detail
          : JSON.stringify(error.response.data.detail)
      }
      toast.error(persistedId ? `فیش ثبت شده است؛ تنها بارگذاری تصویر ناموفق بود. با تلاش مجدد فقط تصویر برای فیش #${persistedId} ارسال می‌شود.` : message)
    } finally {
      setIsLoading(false)
    }
  }

  // Source Accounts: ONLY Workshop Master / Owner / Accountant accounts
  const workshopAccounts = accounts.filter(
    (a) => a.is_workshop && a.is_active !== false
  )
  const sourceAccountList = workshopAccounts
  const sourceAccountOptions = sourceAccountList.map((acc) => {
    const owner = acc.user_full_name ? acc.user_full_name : `${acc.f_name} ${acc.l_name}`.trim() || 'Workshop Master'
    const bank = acc.bank_name || ''
    const card = acc.card_number ? `(${acc.card_number.slice(-4)})` : ''
    return {
      // label: `🏛️ [Workshop/Owner] ${owner} - ${bank} ${card}`,
      label: `🏛️ ${owner} - ${bank} ${card}`,
      value: String(acc.id),
    }
  })

  // Destination Accounts: Worker / Tailor / Contractor accounts
  const destinationAccountOptions = accounts.filter((account) => account.is_active !== false).map((acc) => {
    const isWorkshop = !!acc.is_workshop
    const icon = isWorkshop ? '🏛️ ' : '👤 '
    const owner = acc.user_full_name ? acc.user_full_name : `${acc.f_name} ${acc.l_name}`.trim()
    const bank = acc.bank_name || ''
    const card = acc.card_number ? `(${acc.card_number.slice(-4)})` : ''
    return {
      label: `${icon}${owner} - ${bank} ${card}`,
      value: String(acc.id),
    }
  })

  const userOptions = users.map((u) => {
    const name = `${u.first_name} ${u.last_name}`.trim() || u.username
    const roleBadge = u.role ? `(${u.role})` : ''
    return {
      label: `${name} ${roleBadge}`,
      value: String(u.id),
    }
  })

  const typeOptions = receiptTypes.map((t) => ({
    label: t.label,
    value: t.value,
  }))

  const statusOptions = receiptStatuses.map((s) => ({
    label: s.label,
    value: s.value,
  }))

  // Get current selected user's cards
  const selectedUserObj = users.find((u) => u.id === selectedUserId)
  const selectedUserCards = accounts.filter(
    (a) => a.user_id === selectedUserId || (selectedUserObj?.card_number && a.card_number === selectedUserObj.card_number)
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        setImageFile(null)
        setImagePreview(null)
        setSavedReceiptForUpload(null)
        setIsNewCardMode(false)
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Edit Receipt' : 'Record Payment / Transfer Receipt'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update payment transfer details, optional receipt photo, and accounts.'
              : 'Transfer money to any tailor, worker, or custom bank card with optional receipt photo attachment.'}
          </DialogDescription>
        </DialogHeader>

        <div className='h-110 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='receipt-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              {/* 1. Tracking Code */}
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
                        placeholder='e.g. 7849201948'
                        className='col-span-4 font-mono'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {/* 2. Transfer Type */}
              <FormField
                control={form.control}
                name='receipt_type'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Transfer Type</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='Select Transfer Type'
                      className='col-span-4'
                      items={typeOptions}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {/* 3. Amount with 3-digit comma separation */}
              <FormField
                control={form.control}
                name='amount'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Amount (Tomans)
                    </FormLabel>
                    <div className='col-span-4'>
                      <FormControl>
                        <PriceInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder='15,000,000'
                          className='font-bold text-emerald-600 dark:text-emerald-400'
                        />
                      </FormControl>
                    </div>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {/* 4. Date & Time Picker (Jalali shadcn-persian) */}
              <FormField
                control={form.control}
                name='date_jalali'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Date & Time
                    </FormLabel>
                    <div className='col-span-4'>
                      <FormControl>
                        <DateTimePicker
                          value={{
                            date: field.value ? (parseDate(field.value, 'yyyy/MM/dd') ?? null) : null,
                            time: form.watch('time_str') ? {
                              hour: Number(form.watch('time_str').split(':')[0]) || 0,
                              minute: Number(form.watch('time_str').split(':')[1]) || 0,
                            } : { hour: 12, minute: 0 }
                          }}
                          onValueChange={(val) => {
                            if (val.date) {
                              field.onChange(formatDate(val.date, 'yyyy/MM/dd', { digits: 'en' }))
                            }
                            if (val.time && val.time.hour !== undefined && val.time.minute !== undefined) {
                              const h = String(val.time.hour).padStart(2, '0')
                              const m = String(val.time.minute).padStart(2, '0')
                              form.setValue('time_str', `${h}:${m}`)
                            }
                          }}
                          calendarType='shamsi'
                          placeholder='انتخاب تاریخ و ساعت فیش'
                          className='w-full justify-start'
                        />
                      </FormControl>
                    </div>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {/* 5. Source Account (Workshop Master / Owner only) */}
              <FormField
                control={form.control}
                name='from_account_id'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Source Account</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(Number(val))}
                      placeholder='Select Source Account'
                      className='col-span-4'
                      items={sourceAccountOptions}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {/* Destination Mode Selector */}
              <div className='p-3 rounded-lg border border-border/70 bg-muted/30 space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                    <CreditCard className='h-3.5 w-3.5 text-primary' /> Destination Account / Tailor
                  </span>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='text-[11px] h-7 px-2 text-primary hover:text-primary font-medium'
                    onClick={() => setIsNewCardMode(!isNewCardMode)}
                  >
                    {isNewCardMode ? '← Choose Existing Card' : '+ Use / Add New Card for Worker'}
                  </Button>
                </div>

                {!isNewCardMode ? (
                  /* Standard Select Destination Account */
                  <FormField
                    control={form.control}
                    name='to_account_id'
                    render={({ field }) => (
                      <FormItem className='space-y-1.5'>
                        <SelectDropdown
                          defaultValue={field.value ? String(field.value) : ''}
                          onValueChange={(val) => field.onChange(Number(val))}
                          placeholder='Select Destination Tailor/Worker Account'
                          items={destinationAccountOptions}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  /* Dynamic Tailor & New Card Entry */
                  <div className='space-y-3 pt-1'>
                    {/* Select Worker */}
                    <div className='space-y-1'>
                      <label className='text-xs font-medium text-muted-foreground flex items-center gap-1'>
                        <UserIcon className='h-3 w-3' /> Select Person / Tailor
                      </label>
                      <SelectDropdown
                        defaultValue={selectedUserId ? String(selectedUserId) : ''}
                        onValueChange={handleUserSelect}
                        placeholder='Select Tailor / Worker (e.g. Maryam Rezaei)'
                        items={userOptions}
                      />
                    </div>

                    {/* A counterparty may exist without a login. */}
                    <div className='space-y-1'>
                      <label className='text-xs font-medium text-muted-foreground'>طرف حساب مستقل</label>
                      <SelectDropdown
                        defaultValue={form.watch('selected_party_id') ? String(form.watch('selected_party_id')) : 'new'}
                        onValueChange={(value) => {
                          form.setValue('selected_party_id', value === 'new' ? 0 : Number(value))
                          form.setValue('selected_user_id', 0)
                        }}
                        placeholder='انتخاب طرف حساب یا ایجاد مورد بیرونی'
                        items={[
                          { label: 'طرف حساب بیرونی جدید', value: 'new' },
                          ...parties.map((party) => ({ label: `${party.display_name} (${party.kind})`, value: String(party.id) })),
                        ]}
                      />
                    </div>

                    {/* If selected user already has registered cards, show them */}
                    {selectedUserCards.length > 0 && (
                      <div className='text-xs text-muted-foreground space-y-1.5'>
                        <span className='font-medium text-foreground block'>Registered Cards for this person:</span>
                        <div className='flex flex-wrap gap-1.5'>
                          {selectedUserCards.map((c) => (
                            <div
                              key={c.id}
                              className='cursor-pointer transition-all hover:scale-102'
                              onClick={() => {
                                setIsNewCardMode(false)
                                form.setValue('to_account_id', c.id)
                              }}
                            >
                              <BankCardBadge
                                cardNumber={c.card_number}
                                bankName={c.bank_name}
                                size='sm'
                                showCopy={false}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New Card Number Input */}
                    <FormField
                      control={form.control}
                      name='new_to_card_number'
                      render={({ field }) => (
                        <FormItem className='space-y-1'>
                          <FormLabel className='text-xs'>New 16-Digit Card Number</FormLabel>
                          <FormControl>
                            <BankCardInput
                              value={field.value || ''}
                              onChange={(val) => field.onChange(val)}
                              placeholder='---- ---- ---- ----'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* 6. Optional Receipt Image Attachment */}
              <div className='p-3 rounded-lg border border-border/70 bg-muted/20 space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                    <ImageIcon className='h-3.5 w-3.5 text-primary' /> Receipt Image (تصویر فیش واریزی - اختیاری)
                  </span>
                  {imagePreview && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='h-6 text-[11px] text-destructive hover:bg-destructive/10 px-1.5 gap-1'
                      onClick={handleRemoveImage}
                    >
                      <Trash2 className='h-3 w-3' /> Remove Photo
                    </Button>
                  )}
                </div>

                {imagePreview ? (
                  <div className='relative flex items-center justify-center p-2 border rounded-md bg-background'>
                    <img
                      src={imagePreview}
                      alt='Receipt preview'
                      className='max-h-36 w-auto object-contain rounded'
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className='flex flex-col items-center justify-center p-4 border border-dashed rounded-md cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors text-center'
                  >
                    <UploadCloud className='h-6 w-6 text-muted-foreground mb-1' />
                    <p className='text-xs font-medium text-foreground'>
                      Click to upload receipt voucher photo
                    </p>
                    <p className='text-[10px] text-muted-foreground'>
                      PNG, JPG, WEBP up to 5MB (Optional)
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={handleImageChange}
                />
              </div>

              {/* Status (if editing) */}
              {isEdit && (
                <FormField
                  control={form.control}
                  name='status'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                      <FormLabel className='col-span-2 text-end'>Status</FormLabel>
                      <SelectDropdown
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                        placeholder='Select Status'
                        className='col-span-4'
                        items={statusOptions}
                      />
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
              )}

              {/* Notes */}
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
                        placeholder='e.g. Weekly tailor wage payment batch'
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
            {isLoading ? 'Saving...' : 'Save Receipt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
