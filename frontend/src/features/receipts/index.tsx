import { useState, useEffect, useCallback } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
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

  return (
    <ReceiptsProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Payment Receipts</h2>
            <p className='text-muted-foreground'>
              Manage payment receipts and transaction records here.
            </p>
          </div>
          <ReceiptsPrimaryButtons />
        </div>
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
