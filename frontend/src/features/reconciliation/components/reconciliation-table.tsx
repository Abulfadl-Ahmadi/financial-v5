import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  MoreHorizontal,
  CheckCircle2,
  Receipt,
  Wrench,
  Ban,
  ArrowRightLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { TomanIcon } from '@/components/ui/toman-icon'
import { type BankTransactionItem } from '../types'

interface ReconciliationTableProps {
  data: BankTransactionItem[]
  loading: boolean
  onActionSuccess: () => void
}

export function ReconciliationTable({
  data,
  loading,
  onActionSuccess,
}: ReconciliationTableProps) {
  const [actingId, setActingId] = useState<number | null>(null)

  const handleDecision = async (id: number, decision: string, notes?: string) => {
    try {
      setActingId(id)
      await apiClient.post(`/financial/reconciliation/transactions/${id}/decide`, {
        decision,
        notes,
      })
      toast.success('تصمیم با موفقیت در تاریخچه حسابرسی ثبت شد.')
      onActionSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت تصمیم.')
    } finally {
      setActingId(null)
    }
  }

  const handlePostReceipt = async (id: number) => {
    try {
      setActingId(id)
      const res = await apiClient.post(
        `/financial/reconciliation/transactions/${id}/post-receipt`,
        { receipt_type: 'SEWING_PAYROLL' }
      )
      toast.success(`فیش رسمی دستمزد #${res.data.id} با موفقیت در سیستم مالی ثبت شد.`)
      onActionSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت فیش دستمزد.')
    } finally {
      setActingId(null)
    }
  }

  const handlePostExpense = async (id: number) => {
    try {
      setActingId(id)
      const res = await apiClient.post(
        `/financial/reconciliation/transactions/${id}/post-expense`,
        { category: 'MAINTENANCE', title: 'سرویس و تعمیرات کارگاه' }
      )
      toast.success(`هزینه کارگاه #${res.data.id} با موفقیت ثبت شد.`)
      onActionSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت هزینه کارگاه.')
    } finally {
      setActingId(null)
    }
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'INTERNAL_TRANSFER':
        return <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200 text-[10px]'>انتقال داخلی</Badge>
      case 'PAYROLL_CANDIDATE':
        return <Badge variant='outline' className='bg-purple-50 text-purple-700 border-purple-200 text-[10px]'>کاندید دستمزد خیاط</Badge>
      case 'EXPENSE_CANDIDATE':
        return <Badge variant='outline' className='bg-amber-50 text-amber-700 border-amber-200 text-[10px]'>کاندید هزینه/تعمیرات</Badge>
      case 'SUPPLIER_CANDIDATE':
        return <Badge variant='outline' className='bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]'>خرید پارچه/ملزومات</Badge>
      case 'FEE':
        return <Badge variant='secondary' className='text-[10px]'>کارمزد بانکی</Badge>
      case 'POS_PURCHASE':
        return <Badge variant='secondary' className='text-[10px]'>خرید کارتخوان</Badge>
      default:
        return <Badge variant='outline' className='text-[10px]'>نامشخص</Badge>
    }
  }

  const getDecisionBadge = (decision: string, matchedReceiptId?: number | null) => {
    if (matchedReceiptId || decision === 'MATCHED_EXISTING') {
      return (
        <Badge variant='outline' className='bg-emerald-50 text-emerald-700 border-emerald-300 font-medium text-[10px] flex items-center gap-1'>
          <CheckCircle2 className='h-3 w-3' />
          تطبیق با فیش {matchedReceiptId ? `#${matchedReceiptId}` : ''}
        </Badge>
      )
    }
    switch (decision) {
      case 'APPROVED_POSTING':
        return <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-300 text-[10px]'>ثبت رسمی شده</Badge>
      case 'IGNORED_INTERNAL':
        return <Badge variant='secondary' className='text-[10px]'>انتقال داخلی (نادیده)</Badge>
      case 'IGNORED_PERSONAL':
        return <Badge variant='secondary' className='text-[10px]'>شخصی (نادیده)</Badge>
      default:
        return <Badge variant='outline' className='text-amber-700 border-amber-300 bg-amber-50 text-[10px]'>در انتظار بررسی</Badge>
    }
  }

  return (
    <div className='rounded-md border overflow-x-auto text-xs' dir='rtl'>
      <Table>
        <TableHeader>
          <TableRow className='bg-muted/40'>
            <TableHead className='w-16 text-center'>ردیف</TableHead>
            <TableHead className='w-28'>تاریخ و ساعت</TableHead>
            <TableHead className='min-w-[200px]'>شرح سند بانکی</TableHead>
            <TableHead className='w-32'>کارت مقصد</TableHead>
            <TableHead className='text-end w-36'>مبلغ برداشت (ریال / تومان)</TableHead>
            <TableHead className='text-end w-36'>مبلغ واریز (ریال / تومان)</TableHead>
            <TableHead className='w-28 text-center'>دسته‌بندی</TableHead>
            <TableHead className='w-32 text-center'>وضعیت بررسی</TableHead>
            <TableHead className='w-12 text-center'>عملیات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={9} className='h-24 text-center text-muted-foreground'>
                در حال بارگذاری تراکنش‌های صورت‌حساب بانکی...
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className='h-24 text-center text-muted-foreground'>
                هیچ تراکنشی در این دسته‌بندی یافت نشد.
              </TableCell>
            </TableRow>
          ) : (
            data.map((tx) => {
              const debitIrr = Number(tx.debit_irr) || 0
              const creditIrr = Number(tx.credit_irr) || 0
              const debitToman = Math.floor(debitIrr / 10)
              const creditToman = Math.floor(creditIrr / 10)

              return (
                <TableRow key={tx.id} className='hover:bg-muted/20'>
                  <TableCell className='font-mono text-center text-[11px] text-muted-foreground'>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className='cursor-help font-bold text-foreground'>#{tx.statement_row_num}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>سطر فیزیکی اکسل: {tx.excel_row_num}</p>
                        {tx.document_number && <p>شماره سند: {tx.document_number}</p>}
                        {tx.reference_number && <p>شماره ارجاع: {tx.reference_number}</p>}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>

                  <TableCell className='font-mono text-[11px] whitespace-nowrap text-muted-foreground'>
                    {tx.date_jalali}
                  </TableCell>

                  <TableCell className='max-w-[280px]'>
                    <div className='flex flex-col gap-0.5'>
                      <span className='truncate font-medium' title={tx.description}>
                        {tx.description}
                      </span>
                      {tx.user_note && (
                        <span className='text-[11px] text-amber-700 dark:text-amber-400 font-semibold truncate'>
                          📝 یادداشت: {tx.user_note}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className='font-mono text-xs text-muted-foreground'>
                    {tx.destination_card ? (
                      <span className='px-1.5 py-0.5 rounded bg-muted/60 text-[11px]'>
                        {tx.destination_card}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>

                  {/* Debit (Withdrawal) */}
                  <TableCell className='font-mono text-end'>
                    {debitIrr > 0 ? (
                      <div className='flex flex-col items-end leading-tight'>
                        <span className='font-bold text-red-600 dark:text-red-400'>
                          {debitIrr.toLocaleString()} <span className='text-[10px] font-normal text-muted-foreground'>ریال</span>
                        </span>
                        <span className='text-[11px] text-muted-foreground flex items-center gap-0.5'>
                          {debitToman.toLocaleString()} <TomanIcon className='size-2.5 inline' />
                        </span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>

                  {/* Credit (Deposit) */}
                  <TableCell className='font-mono text-end'>
                    {creditIrr > 0 ? (
                      <div className='flex flex-col items-end leading-tight'>
                        <span className='font-bold text-emerald-600 dark:text-emerald-400'>
                          {creditIrr.toLocaleString()} <span className='text-[10px] font-normal text-muted-foreground'>ریال</span>
                        </span>
                        <span className='text-[11px] text-muted-foreground flex items-center gap-0.5'>
                          {creditToman.toLocaleString()} <TomanIcon className='size-2.5 inline' />
                        </span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>

                  <TableCell className='text-center'>
                    {getCategoryBadge(tx.category)}
                  </TableCell>

                  <TableCell className='text-center'>
                    {getDecisionBadge(tx.review_decision, tx.matched_receipt_id)}
                  </TableCell>

                  <TableCell className='text-center'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-7'
                          disabled={actingId === tx.id}
                        >
                          <MoreHorizontal className='size-4' />
                          <span className='sr-only'>عملیات</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end' className='w-48 text-xs'>
                        <DropdownMenuLabel>اقدامات حسابرسی</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {debitIrr > 0 && !tx.matched_receipt_id && (
                          <DropdownMenuItem onClick={() => handlePostReceipt(tx.id)}>
                            <Receipt className='size-3.5 me-2 text-purple-600' />
                            ثبت به‌عنوان فیش دستمزد
                          </DropdownMenuItem>
                        )}

                        {debitIrr > 0 && !tx.matched_expense_id && (
                          <DropdownMenuItem onClick={() => handlePostExpense(tx.id)}>
                            <Wrench className='size-3.5 me-2 text-amber-600' />
                            ثبت به‌عنوان هزینه کارگاه
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem onClick={() => handleDecision(tx.id, 'IGNORED_INTERNAL', 'انتقال داخلی بین حساب‌ها')}>
                          <ArrowRightLeft className='size-3.5 me-2 text-blue-600' />
                          علامت‌گذاری انتقال داخلی
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleDecision(tx.id, 'IGNORED_PERSONAL', 'تراکنش شخصی')}>
                          <Ban className='size-3.5 me-2 text-muted-foreground' />
                          علامت‌گذاری تراکنش شخصی
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
