import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

import { KpiCards } from './components/kpi-cards'
import { RevenueExpensesChart } from './components/revenue-expenses-chart'
import { ActiveContractOrders } from './components/active-contract-orders'
import { OverheadBreakdownCard } from './components/overhead-breakdown-card'
import { TailorPerformanceCard } from './components/tailor-performance-card'
import { CuttingWarehouseCard } from './components/cutting-warehouse-card'
import { MachineryFleetStatus } from './components/machinery-fleet-status'
import { QuickExpenseDialog } from './components/quick-expense-dialog'
import { GrowthSimulatorModal } from '@/features/financial/GrowthSimulatorModal'
import { financialServices } from '@/features/financial/services'
import { type ProfitabilitySummary } from '@/features/financial/types'

import { 
  PlusCircle, 
  TrendingUp, 
  RefreshCw, 
  Scissors, 
  Coins, 
  Gauge, 
  Wrench,
  Users,
  LayoutDashboard
} from 'lucide-react'

export function Dashboard() {
  const [isExpenseOpen, setIsExpenseOpen] = useState(false)
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false)
  const [profitability, setProfitability] = useState<ProfitabilitySummary | null>(null)
  const [contractOrdersCount, setContractOrdersCount] = useState(0)
  const [inProductionPieces, setInProductionPieces] = useState(0)
  const [activeMachines, setActiveMachines] = useState(0)
  const [totalMachines, setTotalMachines] = useState(17)
  const [loading, setLoading] = useState(false)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [profRes, ordersRes, machinesRes] = await Promise.allSettled([
        financialServices.getProfitabilitySummary(),
        apiClient.get('/sewing/contract-orders'),
        apiClient.get('/inventory/machinery'),
      ])

      if (profRes.status === 'fulfilled') {
        setProfitability(profRes.value)
      }
      if (ordersRes.status === 'fulfilled') {
        const orders = ordersRes.value.data || []
        const activeOrders = orders.filter((o: any) => o.status !== 'SETTLED')
        setContractOrdersCount(activeOrders.length)
        const pieces = activeOrders.reduce((sum: number, o: any) => sum + (Number(o.total_received_pieces) || 0), 0)
        setInProductionPieces(pieces)
      }
      if (machinesRes.status === 'fulfilled') {
        const machines = machinesRes.value.data || []
        setActiveMachines(machines.length)
        setTotalMachines(17)
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return (
    <>
      {/* ===== Top Header ===== */}
      <Header>
        <TopNav links={topNav} className='me-auto' />
        <Search />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      {/* ===== Main Content ===== */}
      <Main>
        {/* Page Title & Top Actions */}
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Workshop Executive Dashboard</h1>
            <p className='text-xs text-muted-foreground'>
              Garment Manufacturing, Piece-Rate Sewing & Financial Management Control Center
            </p>
          </div>
          <div className='flex items-center gap-2 flex-wrap'>
            <Button
              variant='outline'
              size='sm'
              onClick={fetchDashboardData}
              disabled={loading}
              className='gap-1.5 text-xs'
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsSimulatorOpen(true)}
              className='gap-1.5 text-xs'
            >
              <TrendingUp className='h-3.5 w-3.5 text-primary' />
              Growth Simulator
            </Button>
            <Button
              size='sm'
              onClick={() => setIsExpenseOpen(true)}
              className='gap-1.5 text-xs bg-primary text-primary-foreground'
            >
              <PlusCircle className='h-3.5 w-3.5' />
              Log Expense
            </Button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className='mb-6'>
          <KpiCards
            netProfit={profitability?.netProfit ?? 0}
            totalRevenue={profitability?.totalRevenue ?? 0}
            totalOverhead={profitability?.totalOverhead ?? 0}
            activeOrdersCount={contractOrdersCount}
            inProductionPieces={inProductionPieces}
            efficiencyScore={profitability && profitability.totalRevenue > 0 ? 83.3 : 0}
            activeMachines={activeMachines}
            totalMachines={totalMachines}
          />
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue='overview' className='space-y-4'>
          <div className='w-full overflow-x-auto pb-2'>
            <TabsList className='grid grid-cols-6 w-full max-w-[820px]'>
              <TabsTrigger value='overview' className='gap-1.5 text-xs'>
                <LayoutDashboard className='h-3.5 w-3.5' /> Overview
              </TabsTrigger>
              <TabsTrigger value='sewing-tailors' className='gap-1.5 text-xs'>
                <Users className='h-3.5 w-3.5' /> Tailors & Sewing
              </TabsTrigger>
              <TabsTrigger value='cutting-fabric' className='gap-1.5 text-xs'>
                <Scissors className='h-3.5 w-3.5' /> Cutting & Fabric
              </TabsTrigger>
              <TabsTrigger value='financial' className='gap-1.5 text-xs'>
                <Coins className='h-3.5 w-3.5' /> Financial & Costs
              </TabsTrigger>
              <TabsTrigger value='capacity' className='gap-1.5 text-xs'>
                <Gauge className='h-3.5 w-3.5' /> Capacity & Growth
              </TabsTrigger>
              <TabsTrigger value='machinery' className='gap-1.5 text-xs'>
                <Wrench className='h-3.5 w-3.5' /> Machinery & TPM
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value='overview' className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              {/* Monthly Revenue Chart */}
              <Card className='col-span-1 lg:col-span-4 border-border/60'>
                <CardHeader className='pb-2'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <CardTitle className='text-base font-semibold'>Financial Trajectory (1405)</CardTitle>
                      <CardDescription className='text-xs'>
                        Monthly contractor revenue, sewing payroll, and net earnings
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='p-2 sm:p-4'>
                  <RevenueExpensesChart />
                </CardContent>
              </Card>

              {/* Active Workshop Status */}
              <Card className='col-span-1 lg:col-span-3 border-border/60 flex flex-col justify-between'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-base font-semibold'>Workshop Floor Status</CardTitle>
                  <CardDescription className='text-xs'>
                    Live workforce, machinery & steam boiler operations
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3 text-xs'>
                  <div className='flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/40'>
                    <div className='flex items-center gap-2'>
                      <div className='h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse' />
                      <span className='font-medium'>Workforce Attendance</span>
                    </div>
                    <span className='font-semibold'>6 Tailors + 1 Ironer Active</span>
                  </div>

                  <div className='flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/40'>
                    <div className='flex items-center gap-2'>
                      <div className='h-2.5 w-2.5 rounded-full bg-blue-500' />
                      <span className='font-medium'>Lockstitch Fleet</span>
                    </div>
                    <span className='font-semibold'>6 Active / 4 Reserve</span>
                  </div>

                  <div className='flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/40'>
                    <div className='flex items-center gap-2'>
                      <div className='h-2.5 w-2.5 rounded-full bg-purple-500' />
                      <span className='font-medium'>Specialized Machines</span>
                    </div>
                    <span className='font-semibold'>2 Sergers + 1 Janome Buttonhole</span>
                  </div>

                  <div className='flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/40'>
                    <div className='flex items-center gap-2'>
                      <div className='h-2.5 w-2.5 rounded-full bg-orange-500' />
                      <span className='font-medium'>Ironing Station</span>
                    </div>
                    <span className='font-semibold'>3 Steam Irons + Central Boiler</span>
                  </div>

                  <div className='flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/40'>
                    <div className='flex items-center gap-2'>
                      <div className='h-2.5 w-2.5 rounded-full bg-emerald-500' />
                      <span className='font-medium'>Quality Defect Rate</span>
                    </div>
                    <span className='font-semibold text-emerald-600 font-bold'>0.8% (Target &lt; 2%)</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Contract Orders */}
            <Card className='border-border/60'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle className='text-base font-semibold'>Active Contractor Sewing Orders</CardTitle>
                    <CardDescription className='text-xs'>
                      Received fabric batches, sewing progress, and delivery schedule
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='p-2 sm:p-4'>
                <ActiveContractOrders />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: TAILORS & SEWING */}
          <TabsContent value='sewing-tailors' className='space-y-4'>
            <TailorPerformanceCard />
          </TabsContent>

          {/* TAB 3: CUTTING & FABRIC */}
          <TabsContent value='cutting-fabric' className='space-y-4'>
            <CuttingWarehouseCard />
          </TabsContent>

          {/* TAB 4: FINANCIAL & OVERHEAD COSTS */}
          <TabsContent value='financial' className='space-y-4'>
            <OverheadBreakdownCard />
          </TabsContent>

          {/* TAB 5: CAPACITY & GROWTH */}
          <TabsContent value='capacity' className='space-y-4'>
            <Card className='border-border/60'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle className='text-base font-semibold'>Workshop Capacity & 1-Year Scaling Potential</CardTitle>
                    <CardDescription className='text-xs'>
                      Standard Allowed Minutes (SAM), machine utilization & revenue projection
                    </CardDescription>
                  </div>
                  <Button size='sm' onClick={() => setIsSimulatorOpen(true)} className='text-xs'>
                    Run Growth Simulator
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className='grid gap-4 md:grid-cols-3 mb-6'>
                  <div className='p-4 rounded-lg border border-border/60 bg-muted/20'>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Sewing Machine Utilization</div>
                    <div className='text-2xl font-bold'>6 of 10 Machines (60%)</div>
                    <p className='text-xs text-muted-foreground mt-1'>4 standby machines available to onboard new tailors immediately</p>
                  </div>
                  <div className='p-4 rounded-lg border border-border/60 bg-muted/20'>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Line Efficiency (SAM)</div>
                    <div className='text-2xl font-bold text-emerald-600'>83.3% Efficiency</div>
                    <p className='text-xs text-muted-foreground mt-1'>12,000 earned SAM minutes / 14,400 available minutes</p>
                  </div>
                  <div className='p-4 rounded-lg border border-border/60 bg-muted/20'>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Avg. Turnaround Time</div>
                    <div className='text-2xl font-bold text-blue-600'>4.5 Days / Batch</div>
                    <p className='text-xs text-muted-foreground mt-1'>From cut delivery to contractor shipment</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: MACHINERY FLEET */}
          <TabsContent value='machinery' className='space-y-4'>
            <MachineryFleetStatus />
          </TabsContent>
        </Tabs>

        {/* Quick Modals */}
        <QuickExpenseDialog
          open={isExpenseOpen}
          onOpenChange={setIsExpenseOpen}
          onSuccess={fetchDashboardData}
        />

        <GrowthSimulatorModal
          open={isSimulatorOpen}
          onOpenChange={setIsSimulatorOpen}
          baseCapacity={{
            activeMachines: 6,
            totalMachines: 10,
            samProduced: 12000,
            availableMinutes: 14400,
            efficiencyScore: 83.3,
            averageTurnaroundTimeDays: 4.5,
          }}
        />
      </Main>
    </>
  )
}

const topNav = [
  {
    title: 'Overview',
    href: '/',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Contract Orders',
    href: '/tasks',
    isActive: false,
    disabled: false,
  },
  {
    title: 'Financial & Expenses',
    href: '/receipts',
    isActive: false,
    disabled: false,
  },
  {
    title: 'Workforce',
    href: '/users',
    isActive: false,
    disabled: false,
  },
]
