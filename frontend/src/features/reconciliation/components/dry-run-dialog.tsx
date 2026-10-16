import { useState } from 'react'
import { FileSpreadsheet, Loader2 } from 'lucide-react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type DryRunPreviewData } from '../types'

interface DryRunDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DryRunDialog({ open, onOpenChange }: DryRunDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<DryRunPreviewData | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setPreview(null)
    }
  }

  const handlePreview = async () => {
    if (!file) {
      toast.error('لطفاً یک فایل اکسل انتخاب کنید.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      setLoading(true)
      const res = await apiClient.post('/financial/reconciliation/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPreview(res.data)
      toast.success('فایل با موفقیت و بدون ذخیره‌سازی در دیتابیس اعتبارسنجی شد.')
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'خطا در پردازش پیش‌نمایش فایل اکسل.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreview(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-2xl max-h-[85vh] overflow-y-auto' dir='rtl'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <FileSpreadsheet className='h-5 w-5 text-primary' />
            پیش‌نمایش آزمایشی صورت‌حساب بانک (Dry-Run Preview)
          </DialogTitle>
          <DialogDescription>
            اعتبارسنجی فایل اکسل صورت‌حساب، سرجمع‌های واریز/برداشت و بررسی تطابق چک‌سام بانکی بدون ذخیره در دیتابیس.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          <div className='flex items-center gap-3 p-4 rounded-lg border border-dashed bg-muted/20'>
            <input
              type='file'
              accept='.xlsx'
              onChange={handleFileChange}
              className='text-xs file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:cursor-pointer'
            />
            <Button
              size='sm'
              onClick={handlePreview}
              disabled={!file || loading}
              className='ms-auto text-xs'
            >
              {loading && <Loader2 className='h-3.5 w-3.5 animate-spin me-1.5' />}
              بررسی و اعتبارسنجی
            </Button>
          </div>

          {preview && (
            <div className='space-y-4 pt-2'>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs'>
                <div className='p-2.5 rounded-lg border bg-card'>
                  <span className='text-muted-foreground block text-[11px]'>شماره سپرده</span>
                  <span className='font-mono font-bold'>{preview.deposit_number}</span>
                </div>
                <div className='p-2.5 rounded-lg border bg-card'>
                  <span className='text-muted-foreground block text-[11px]'>تعداد سطرها</span>
                  <span className='font-mono font-bold'>{preview.total_rows.toLocaleString()} سطر</span>
                </div>
                <div className='p-2.5 rounded-lg border bg-card'>
                  <span className='text-muted-foreground block text-[11px]'>مجموع واریز (ریال)</span>
                  <span className='font-mono font-bold text-emerald-600'>
                    {Number(preview.calculated_credit_irr).toLocaleString()} R
                  </span>
                </div>
                <div className='p-2.5 rounded-lg border bg-card'>
                  <span className='text-muted-foreground block text-[11px]'>مجموع برداشت (ریال)</span>
                  <span className='font-mono font-bold text-red-600'>
                    {Number(preview.calculated_debit_irr).toLocaleString()} R
                  </span>
                </div>
              </div>

              <div>
                <h4 className='text-xs font-semibold mb-2'>نمونه سطرهای استخراج‌شده (۱۰ سطر اول):</h4>
                <div className='rounded-md border overflow-x-auto text-xs'>
                  <Table>
                    <TableHeader>
                      <TableRow className='bg-muted/40'>
                        <TableHead className='w-12 text-center'>ردیف</TableHead>
                        <TableHead>تاریخ</TableHead>
                        <TableHead>شرح سند</TableHead>
                        <TableHead className='text-end'>برداشت (ریال)</TableHead>
                        <TableHead className='text-end'>واریز (ریال)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.sample_rows.map((row) => (
                        <TableRow key={row.statement_row_num}>
                          <TableCell className='font-mono text-center'>{row.statement_row_num}</TableCell>
                          <TableCell className='font-mono text-[11px]'>{row.date_jalali}</TableCell>
                          <TableCell className='max-w-[200px] truncate'>{row.description}</TableCell>
                          <TableCell className='font-mono text-end text-red-600'>
                            {Number(row.debit_irr) > 0 ? Number(row.debit_irr).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell className='font-mono text-end text-emerald-600'>
                            {Number(row.credit_irr) > 0 ? Number(row.credit_irr).toLocaleString() : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' size='sm' onClick={handleClose}>
            بستن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
