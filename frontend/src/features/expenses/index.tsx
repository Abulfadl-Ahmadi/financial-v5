import { useState, useEffect } from 'react'
import { PlusCircle, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { type Expense } from './data/schema'
import { ExpensesTable } from './components/expenses-table'
import { ExpensesStatsCards } from './components/expenses-stats-cards'
import { ExpensesActionDialog } from './components/expenses-action-dialog'

export function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)

  const fetchExpenses = async () => {
    setIsLoading(true)
    try {
      const res = await apiClient.get('/financial/expenses')
      setExpenses(res.data)
    } catch {
      toast.error('Failed to load workshop expenses.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  return (
    <>
      <Header>
        <Search />
        <div className='ms-auto flex items-center gap-2'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='space-y-6'>
        {/* Page Title & Action Buttons */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Workshop Expenses & Overheads</h1>
            <p className='text-xs text-muted-foreground'>
              Track operating costs across 8 categories (Rent, Electricity, Water, Gas, Sewing Supplies, Maintenance, Welfare, Cleaning)
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={fetchExpenses}
              disabled={isLoading}
              className='gap-1.5 text-xs'
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size='sm'
              onClick={() => setIsActionDialogOpen(true)}
              className='gap-1.5 text-xs bg-primary text-primary-foreground'
            >
              <PlusCircle className='h-3.5 w-3.5' />
              Log New Expense
            </Button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <ExpensesStatsCards expenses={expenses} />

        {/* Expenses Data Table */}
        {isLoading ? (
          <div className='flex h-64 items-center justify-center rounded-lg border border-border/80 bg-card'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
          </div>
        ) : (
          <ExpensesTable data={expenses} onSuccess={fetchExpenses} />
        )}
      </Main>

      <ExpensesActionDialog
        open={isActionDialogOpen}
        onOpenChange={setIsActionDialogOpen}
        onSuccess={fetchExpenses}
      />
    </>
  )
}
