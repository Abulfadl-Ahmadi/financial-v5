import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Loader2, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { TomanIcon } from '@/components/ui/toman-icon'
import { type ActionDraftData } from '../types'

interface ReceiptDraftCardProps {
  draft: ActionDraftData
  onStatusUpdate?: (status: string, recordId?: number) => void
}

export function ReceiptDraftCard({ draft, onStatusUpdate }: ReceiptDraftCardProps) {
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
      toast.success('فیش واریزی با موفقیت در سیستم مالی ثبت نهایی گردید.')
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
      toast.info('پیش‌نویس فیش با موفقیت لغو شد.')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'خطا در لغو پیش‌نویس.')
    } finally {
      setLoading(false)
    }
  }

  const isCommitted = currentStatus === 'COMMITTED'
  const isDiscarded = currentStatus === 'DISCARDED'
  const isPending = currentStatus === 'PENDING_APPROVAL'

  return (
    <Card className='border-primary/40 bg-card/90 shadow-md my-2 text-xs' dir='rtl'>
      <CardHeader className='pb-2 pt-3 px-3.5 border-b border-border/40'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-xs font-bold flex items-center gap-1.5'>
            <Receipt className='h-3.5 w-3.5 text-primary' />
            کارت بررسی فیش مالی (Human-in-the-Loop)
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
          <span className='text-muted-foreground'>مبلغ واریزی:</span>
          <div className='flex items-center gap-1 font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400'>
            <span>{Number(p.amount).toLocaleString()}</span>
            <TomanIcon className='size-3 text-muted-foreground' />
          </div>
        </div>

        <div className='grid grid-cols-2 gap-2 text-[11px]'>
          <div className='p-2 rounded bg-muted/20 border border-border/30'>
            <span className='text-muted-foreground block mb-0.5'>مبدأ پرداخت (کارگاه):</span>
            <span className='font-medium block'>{p.from_account_name || 'حساب کارگاه'}</span>
            <span className='font-mono text-[10px] text-muted-foreground'>{p.from_account_card}</span>
          </div>

          <div className='p-2 rounded bg-muted/20 border border-border/30'>
            <span className='text-muted-foreground block mb-0.5'>مقصد (خیاط / طرف‌حساب):</span>
            <span className='font-medium block'>{p.to_holder_name || 'طرف حساب'}</span>
            <span className='font-mono text-[10px] text-muted-foreground'>{p.to_card_number || '-'}</span>
          </div>
        </div>

        <div className='flex items-center justify-between text-[11px] px-1 text-muted-foreground'>
          <span>کد پیگیری: <strong className='font-mono text-foreground'>{p.tracking_code}</strong></span>
          <span>تاریخ: <strong className='font-mono text-foreground'>{p.date_jalali}</strong> {p.time_str || ''}</span>
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
            className='h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1'
          >
            {loading ? <Loader2 className='h-3 w-3 animate-spin' /> : <CheckCircle2 className='h-3.5 w-3.5' />}
            تأیید و ثبت نهایی در سیستم
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
