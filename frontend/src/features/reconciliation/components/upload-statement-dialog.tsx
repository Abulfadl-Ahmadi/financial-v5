import { useState, useEffect } from 'react'
import { UploadCloud, Loader2 } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface UploadStatementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface DepositOption {
  id: number
  deposit_number: string
  bank_name: string
  title?: string
  is_verified_workshop_account: boolean
}

export function UploadStatementDialog({
  open,
  onOpenChange,
  onSuccess,
}: UploadStatementDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [deposits, setDeposits] = useState<DepositOption[]>([])
  const [selectedDepositId, setSelectedDepositId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      apiClient
        .get('/financial/deposits')
        .then((res) => {
          const verifiedDeposits = (res.data || []).filter(
            (d: DepositOption) => d.is_verified_workshop_account
          )
          setDeposits(verifiedDeposits)
          if (verifiedDeposits.length > 0) {
            setSelectedDepositId(String(verifiedDeposits[0].id))
          }
        })
        .catch(() => {
          toast.error('خطا در دریافت لیست حساب‌های سپرده کارگاه.')
        })
    }
  }, [open])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('لطفاً یک فایل اکسل انتخاب کنید.')
      return
    }
    if (!selectedDepositId) {
      toast.error('لطفاً حساب سپرده تاییدشده کارگاه را انتخاب کنید.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('deposit_id', selectedDepositId)

    try {
      setLoading(true)
      const res = await apiClient.post('/financial/reconciliation/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success(
        `صورت‌حساب با موفقیت استیج شد (${res.data.total_rows.toLocaleString()} سطر بارگذاری گردید).`
      )
      setFile(null)
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'خطا در بارگذاری صورت‌حساب.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md' dir='rtl'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <UploadCloud className='h-5 w-5 text-primary' />
            بارگذاری و استیج صورت‌حساب بانکی
          </DialogTitle>
          <DialogDescription>
            فایل اکسل صورت‌حساب رسمی بانک را جهت استیج در صف مغایرت‌گیری انتخاب کنید.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2 text-xs'>
          <div className='space-y-1.5'>
            <Label htmlFor='deposit-select'>سپرده بانکی کارگاه (تنها حساب‌های تاییدشده):</Label>
            <Select
              value={selectedDepositId}
              onValueChange={setSelectedDepositId}
            >
              <SelectTrigger id='deposit-select'>
                <SelectValue placeholder='انتخاب حساب سپرده کارگاه' />
              </SelectTrigger>
              <SelectContent>
                {deposits.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    🏛️ {d.bank_name} - {d.deposit_number} {d.title ? `(${d.title})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {deposits.length === 0 && (
              <p className='text-muted-foreground text-[11px] text-amber-600'>
                هیچ حساب سپرده تاییدشده‌ای برای کارگاه یافت نشد. ابتدا حساب را در بخش حساب‌های بانکی تایید کنید.
              </p>
            )}
          </div>

          <div className='space-y-1.5'>
            <Label>فایل اکسل صورت‌حساب (.xlsx):</Label>
            <div className='p-4 rounded-lg border border-dashed bg-muted/20 text-center'>
              <input
                type='file'
                accept='.xlsx'
                onChange={handleFileChange}
                className='text-xs file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:cursor-pointer'
              />
            </div>
          </div>
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button variant='outline' size='sm' onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button
            size='sm'
            onClick={handleUpload}
            disabled={!file || !selectedDepositId || loading}
          >
            {loading && <Loader2 className='h-3.5 w-3.5 animate-spin me-1.5' />}
            شروع بارگذاری و پردازش
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
