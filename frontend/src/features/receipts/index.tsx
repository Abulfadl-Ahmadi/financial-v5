import { useState, useEffect, useCallback, useMemo } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { Loader2, Receipt as ReceiptIcon, CheckCircle2, TrendingUp, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent } from '@/components/ui/card'
import { ReceiptsDialogs } from './components/receipts-dialogs'
import { ReceiptsPrimaryButtons } from './components/receipts-primary-buttons'
import { ReceiptsProvider } from './components/receipts-provider'
import { ReceiptsTable } from './components/receipts-table'
import { type Receipt } from './data/schema'

const route = getRouteApi('/_authenticated/receipts/')

export function Receipts() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const [receiptsData, setReceiptsData] = useState<Receipt[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchReceipts = useCallback(() => {
    setIsLoading(true)
    apiClient
      .get('/financial/receipts')
      .then((response) => {
        setReceiptsData(response.data)
      })
      .catch(() => {
        toast.error('Failed to load receipts from server.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchReceipts()
  }, [fetchReceipts])

  const stats = useMemo(() => {
    const totalCount = receiptsData.length
    const totalVolume = receiptsData.reduce(
      (acc, r) => acc + (Number(r.amount) || 0),
      0
    )
    const verifiedCount = receiptsData.filter(
      (r) => (r.status || 'VERIFIED').toUpperCase() === 'VERIFIED'
    ).length
    const avgAmount = totalCount > 0 ? Math.round(totalVolume / totalCount) : 0

    return { totalCount, totalVolume, verifiedCount, avgAmount }
  }, [receiptsData])

  return (
    <ReceiptsProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        {/* Title and Action Buttons */}
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Payment Receipts</h2>
            <p className='text-muted-foreground'>
              Track bank transfers, card-to-card payments, and transaction audit records.
            </p>
          </div>
          <ReceiptsPrimaryButtons />
        </div>

        {/* Quick KPI Stat Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
          <Card className='border-border/60 shadow-xs'>
            <CardContent className='p-4 flex items-center justify-between'>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>Total Volume</p>
                <h3 className='text-xl font-bold text-foreground mt-0.5'>
                  {stats.totalVolume.toLocaleString()}{' '}
                  <span className='text-xs font-normal text-muted-foreground'>T</span>
                </h3>
              </div>
              <div className='p-2.5 rounded-lg bg-primary/10 text-primary'>
                <TrendingUp className='h-4 w-4' />
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-xs'>
            <CardContent className='p-4 flex items-center justify-between'>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>Total Receipts</p>
                <h3 className='text-xl font-bold text-foreground mt-0.5'>
                  {stats.totalCount}{' '}
                  <span className='text-xs font-normal text-muted-foreground'>Records</span>
                </h3>
              </div>
              <div className='p-2.5 rounded-lg bg-blue-500/10 text-blue-600'>
                <ReceiptIcon className='h-4 w-4' />
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-xs'>
            <CardContent className='p-4 flex items-center justify-between'>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>Verified Transfers</p>
                <h3 className='text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5'>
                  {stats.verifiedCount} / {stats.totalCount}
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
                <p className='text-xs font-medium text-muted-foreground'>Average Ticket</p>
                <h3 className='text-xl font-bold text-foreground mt-0.5'>
                  {stats.avgAmount.toLocaleString()}{' '}
                  <span className='text-xs font-normal text-muted-foreground'>T</span>
                </h3>
              </div>
              <div className='p-2.5 rounded-lg bg-purple-500/10 text-purple-600'>
                <CreditCard className='h-4 w-4' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className='flex h-64 items-center justify-center'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : (
          <ReceiptsTable data={receiptsData} search={search} navigate={navigate} />
        )}
      </Main>

      <ReceiptsDialogs onSuccess={fetchReceipts} />
    </ReceiptsProvider>
  )
}
