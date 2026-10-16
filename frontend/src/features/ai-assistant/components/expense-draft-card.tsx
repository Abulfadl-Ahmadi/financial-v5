import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Loader2, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { TomanIcon } from '@/components/ui/toman-icon'
import { type ActionDraftData } from '../types'

interface ExpenseDraftCardProps {
  draft: ActionDraftData
  onStatusUpdate?: (status: string, recordId?: number) => void
}

const categoryLabels: Record<string, string> = {
  RENT: 'اجاره کارگاه',
  ELECTRICITY: 'قبض برق',
  GAS: 'قبض گاز و دیگ بخار',
  WATER: 'قبض آب',
  SUPPLIES: 'ملزومات دوخت و روغن چرخ',
  MAINTENANCE: 'سرویس و تعمیرات ماشین‌آلات',
  WELFARE: 'پذیرایی و رفاهی پرسنل',
  CLEANING: 'نظافت کارگاه',
  OTHER: 'سایر هزینه‌های جاری',
}

export function ExpenseDraftCard({ draft, onStatusUpdate }: ExpenseDraftCardProps) {
  const [loading, setLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(draft.status)
  const [recordId, setRecordId] = useState<number | null>(draft.committed_record_id || null)

  const p = draft.payload

  const handleCommit = async () => {
    try {
      setLoading(true)
      const res = await apiClient.post(`/ai/drafts/${draft.id}/commit`)
      setCurrentStatus('COMMITTED')
      setRecordId(res.data.record_id)
      onStatusUpdate?.('COMMITTED', res.data.record_id)
      toast.success('هزینه کارگاه با موفقیت ثبت نهایی شد.')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت نهایی پیش‌نویس.')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    try {
      setLoading(true)
      await apiClient.post(`/ai/drafts/${draft.id}/reject`)
      setCurrentStatus('DISCARDED')
      onStatusUpdate?.('DISCARDED')
      toast.info('پیش‌نویس هزینه لغو شد.')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'خطا در لغو پیش‌نویس.')
    } finally {
      setLoading(false)
    }
  }

  const isCommitted = currentStatus === 'COMMITTED'
  const isDiscarded = currentStatus === 'DISCARDED'
  const isPending = currentStatus === 'PENDING_APPROVAL'
  const categoryLabel = categoryLabels[p.category] || p.category

  return (
    <Card className='border-amber-500/40 bg-card/90 shadow-md my-2 text-xs' dir='rtl'>
      <CardHeader className='pb-2 pt-3 px-3.5 border-b border-border/40'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-xs font-bold flex items-center gap-1.5'>
            <Wrench className='h-3.5 w-3.5 text-amber-600' />
            کارت بررسی هزینه کارگاه (Human-in-the-Loop)
          </CardTitle>
          {isCommitted && (
            <Badge variant='outline' className='bg-emerald-50 text-emerald-700 border-emerald-300 gap-1 text-[10px]'>
              <CheckCircle2 className='h-3 w-3' /> ثبت نهایی شد #{recordId}
            </Badge>
          )}
          {isDiscarded && (
            <Badge variant='secondary' className='text-[10px] text-muted-foreground'>
              لغو شد
            </Badge>
          )}
          {isPending && (
            <Badge variant='outline' className='bg-amber-50 text-amber-700 border-amber-300 text-[10px]'>
              در انتظار تأیید شما
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className='p-3.5 space-y-2'>
        <div className='flex items-center justify-between p-2 rounded bg-muted/40 border border-border/40'>
          <div className='flex items-center gap-2'>
            <span className='font-medium text-foreground'>{p.title}</span>
            <Badge variant='outline' className='text-[10px] bg-background'>
              {categoryLabel}
            </Badge>
          </div>
          <div className='flex items-center gap-1 font-mono font-bold text-sm text-amber-600 dark:text-amber-400'>
            <span>{Number(p.amount).toLocaleString()}</span>
            <TomanIcon className='size-3 text-muted-foreground' />
          </div>
        </div>

        <div className='flex items-center justify-between text-[11px] px-1 text-muted-foreground'>
          <span>تاریخ ثبت: <strong className='font-mono text-foreground'>{p.date_jalali}</strong></span>
          {p.account_card && (
            <span>حساب پرداخت: <strong className='font-mono text-foreground'>{p.account_card}</strong></span>
          )}
        </div>
      </CardContent>

      {isPending && (
        <CardFooter className='p-3 pt-0 gap-2 flex items-center justify-end border-t border-border/30 pt-2.5'>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleReject}
            disabled={loading}
            className='h-7 text-xs text-muted-foreground hover:text-destructive'
          >
            <XCircle className='h-3.5 w-3.5 me-1' />
            انصراف
          </Button>
          <Button
            size='sm'
            onClick={handleCommit}
            disabled={loading}
            className='h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1'
          >
            {loading ? <Loader2 className='h-3 w-3 animate-spin' /> : <CheckCircle2 className='h-3.5 w-3.5' />}
            تأیید و ثبت در هزینه‌های کارگاه
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
