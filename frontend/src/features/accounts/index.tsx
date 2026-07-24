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
import { AccountsDialogs } from './components/accounts-dialogs'
import { AccountsPrimaryButtons } from './components/accounts-primary-buttons'
import { AccountsProvider } from './components/accounts-provider'
import { AccountsTable } from './components/accounts-table'
import { type Account } from './data/schema'

const route = getRouteApi('/_authenticated/accounts/')

export function Accounts() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const [accountsData, setAccountsData] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAccounts = useCallback(() => {
    setIsLoading(true)
    apiClient
      .get('/financial/accounts')
      .then((response) => {
        setAccountsData(response.data)
      })
      .catch(() => {
        toast.error('Failed to load accounts from server.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  return (
    <AccountsProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Bank Accounts</h2>
            <p className='text-muted-foreground'>
              Manage workshop and client bank accounts here.
            </p>
          </div>
          <AccountsPrimaryButtons />
        </div>
        {isLoading ? (
          <div className='flex h-64 items-center justify-center'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : (
          <AccountsTable data={accountsData} search={search} navigate={navigate} />
        )}
      </Main>

      <AccountsDialogs onSuccess={fetchAccounts} />
    </AccountsProvider>
  )
}
