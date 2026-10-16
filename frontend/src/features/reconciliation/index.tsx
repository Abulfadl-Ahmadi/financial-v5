import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  RefreshCw,
  Users,
  Coins,
  FileCheck2,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TomanIcon } from '@/components/ui/toman-icon'
import { DryRunDialog } from './components/dry-run-dialog'
import { UploadStatementDialog } from './components/upload-statement-dialog'
import { ReconciliationTable } from './components/reconciliation-table'
import { type BankTransactionItem, type StatementBatchItem } from './types'

export function Reconciliation() {
  const [batches, setBatches] = useState<StatementBatchItem[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all')
  const [transactions, setTransactions] = useState<BankTransactionItem[]>([])
  const [activeTab, setActiveTab] = useState<string>('all')
  const [loading, setLoading] = useState<boolean>(true)

  const [isDryRunOpen, setIsDryRunOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  const fetchBatches = useCallback(async () => {
    try {
      const res = await apiClient.get('/financial/reconciliation/batches')
      setBatches(res.data || [])
    } catch {
      toast.error('خطا در دریافت لیست بچ‌های صورت‌حساب.')
    }
  }, [])

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const params: Record<string, any> = {}
      if (selectedBatchId !== 'all') {
        params.batch_id = selectedBatchId
      }
      if (activeTab === 'MATCHED_EXISTING') {
        params.decision = 'MATCHED_EXISTING'
      } else if (activeTab !== 'all') {
        params.category = activeTab
      }

      const res = await apiClient.get('/financial/reconciliation/transactions', { params })
      setTransactions(res.data || [])
    } catch {
      toast.error('خطا در بارگذاری تراکنش‌ها.')
    } finally {
      setLoading(false)
    }
  }, [selectedBatchId, activeTab])

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const stats = useMemo(() => {
    const totalCount = transactions.length
    const matchedCount = transactions.filter(
      (t) => t.matched_receipt_id || t.review_decision === 'MATCHED_EXISTING'
    ).length
    const payrollCandidateCount = transactions.filter(
      (t) => t.category === 'PAYROLL_CANDIDATE'
    ).length
    const internalTransferCount = transactions.filter(
      (t) => t.category === 'INTERNAL_TRANSFER'
    ).length

    const totalDebitIrr = transactions.reduce((s, t) => s + (Number(t.debit_irr) || 0), 0)
    const totalDebitToman = Math.floor(totalDebitIrr / 10)

    return { totalCount, matchedCount, payrollCandidateCount, internalTransferCount, totalDebitToman }
  }, [transactions])

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6' dir='rtl'>
        {/* Page Title & Action Buttons */}
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
              <FileCheck2 className='h-6 w-6 text-primary' />
              کارتابل مغایرت‌گیری صورت‌حساب بانکی
            </h2>
            <p className='text-xs text-muted-foreground mt-0.5'>
              بررسی اتمیک، تطبیق با فیش‌های واریزی و ثبت با تایید انسانی (HITL) برای حساب‌های کارگاه
            </p>
          </div>
          <div className='flex items-center gap-2 flex-wrap'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                fetchBatches()
                fetchTransactions()
              }}
              className='gap-1.5 text-xs'
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              به‌روزرسانی
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsDryRunOpen(true)}
              className='gap-1.5 text-xs'
            >
              <FileSpreadsheet className='h-3.5 w-3.5 text-blue-600' />
              پیش‌نمایش آزمایشی (Dry-Run)
            </Button>
            <Button
              size='sm'
              onClick={() => setIsUploadOpen(true)}
              className='gap-1.5 text-xs bg-primary text-primary-foreground'
            >
              <UploadCloud className='h-3.5 w-3.5' />
              بارگذاری صورت‌حساب رسمی
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
          <Card className='border-border/60 shadow-xs'>
            <CardContent className='p-4 flex items-center justify-between'>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>تراکنش‌های فیلترشده</p>
                <h3 className='text-xl font-bold text-foreground mt-0.5'>
                  {stats.totalCount.toLocaleString()}{' '}
                  <span className='text-xs font-normal text-muted-foreground'>سطر</span>
                </h3>
              </div>
              <div className='p-2.5 rounded-lg bg-primary/10 text-primary'>
                <FileSpreadsheet className='h-4 w-4' />
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-xs'>
            <CardContent className='p-4 flex items-center justify-between'>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>تطبیق‌یافته با فیش‌های موجود</p>
                <h3 className='text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5'>
                  {stats.matchedCount}{' '}
                  <span className='text-xs font-normal text-muted-foreground'>مورد بدون تکرار</span>
                </h3>
              </div>
              <div className='p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600'>
                <CheckCircle2 className='h-4 w-4' />
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-xs'>
            <CardContent className='p-4 flex items-center justify-between'>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>کاندید دستمزد خیاط‌ها</p>
                <h3 className='text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5'>
                  {stats.payrollCandidateCount}{' '}
                  <span className='text-xs font-normal text-muted-foreground'>نیاز به بررسی</span>
                </h3>
              </div>
              <div className='p-2.5 rounded-lg bg-purple-500/10 text-purple-600'>
                <Users className='h-4 w-4' />
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-xs'>
            <CardContent className='p-4 flex items-center justify-between'>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>مجموع برداشت‌ها</p>
                <h3 className='text-xl font-bold text-red-600 dark:text-red-400 mt-0.5 flex items-center gap-1'>
                  {stats.totalDebitToman.toLocaleString()} <TomanIcon className='size-3 text-muted-foreground inline' />
                </h3>
              </div>
              <div className='p-2.5 rounded-lg bg-red-500/10 text-red-600'>
                <Coins className='h-4 w-4' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Batch Filter & Category Tabs */}
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
          <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full sm:w-auto'>
            <TabsList className='flex-wrap h-auto p-1'>
              <TabsTrigger value='all' className='text-xs'>همه</TabsTrigger>
              <TabsTrigger value='PAYROLL_CANDIDATE' className='text-xs'>کاندید دستمزد</TabsTrigger>
              <TabsTrigger value='MATCHED_EXISTING' className='text-xs'>تطبیق فیش (۲۷)</TabsTrigger>
              <TabsTrigger value='INTERNAL_TRANSFER' className='text-xs'>انتقال داخلی (۳۸)</TabsTrigger>
              <TabsTrigger value='EXPENSE_CANDIDATE' className='text-xs'>هزینه و تعمیرات</TabsTrigger>
              <TabsTrigger value='FEE' className='text-xs'>کارمزد</TabsTrigger>
              <TabsTrigger value='UNKNOWN' className='text-xs'>سایر / نامشخص</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className='flex items-center gap-2 w-full sm:w-auto'>
            <span className='text-xs text-muted-foreground whitespace-nowrap'>بچ صورت‌حساب:</span>
            <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
              <SelectTrigger className='h-8 text-xs w-[220px]'>
                <SelectValue placeholder='انتخاب بچ' />
              </SelectTrigger>
              <SelectContent dir='rtl'>
                <SelectItem value='all'>همه فایل‌های استیج‌شده</SelectItem>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.filename} ({b.deposit_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Data Table */}
        <ReconciliationTable
          data={transactions}
          loading={loading}
          onActionSuccess={() => {
            fetchBatches()
            fetchTransactions()
          }}
        />

        {/* Dialogs */}
        <DryRunDialog open={isDryRunOpen} onOpenChange={setIsDryRunOpen} />
        <UploadStatementDialog
          open={isUploadOpen}
          onOpenChange={setIsUploadOpen}
          onSuccess={() => {
            fetchBatches()
            fetchTransactions()
          }}
        />
      </Main>
    </>
  )
}
