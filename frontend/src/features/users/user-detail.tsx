import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Loader2, UserPen, User as UserIcon, Phone, CreditCard, Receipt as ReceiptIcon } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { type User } from './data/schema'
import { type Receipt } from '@/features/receipts/data/schema'
import { UsersActionDialog } from './components/users-action-dialog'

export function UserDetail() {
  const { userId } = useParams({ from: '/_authenticated/users/$userId' })
  const navigate = useNavigate()

  const [user, setUser] = useState<User | null>(null)
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const fetchUserData = () => {
    setIsLoading(true)
    Promise.all([
      apiClient.get(`/users/${userId}`),
      apiClient.get(`/users/${userId}/receipts`),
    ])
      .then(([userRes, receiptsRes]) => {
        setUser(userRes.data)
        setReceipts(receiptsRes.data)
      })
      .catch(() => {
        toast.error('Failed to load user details.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    if (userId) {
      fetchUserData()
    }
  }, [userId])

  if (isLoading) {
    return (
      <>
        <Header fixed>
          <Search className='me-auto' />
          <ThemeSwitch />
          <ProfileDropdown />
        </Header>
        <Main className='flex h-96 items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </Main>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <Header fixed>
          <Search className='me-auto' />
          <ThemeSwitch />
          <ProfileDropdown />
        </Header>
        <Main className='flex flex-col items-center justify-center gap-4 py-16'>
          <h2 className='text-2xl font-bold'>User Not Found</h2>
          <p className='text-muted-foreground'>The user with ID #{userId} could not be found.</p>
          <Button onClick={() => navigate({ to: '/users' })}>
            <ArrowLeft className='mr-2 h-4 w-4' /> Back to Users
          </Button>
        </Main>
      </>
    )
  }

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'US'

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-6'>
        {/* Navigation & Header Actions */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Button variant='outline' size='icon' asChild>
              <Link to='/users'>
                <ArrowLeft className='h-4 w-4' />
              </Link>
            </Button>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>User Details</h2>
              <p className='text-sm text-muted-foreground'>
                Profile and transactions for {fullName} (@{user.username})
              </p>
            </div>
          </div>
          <Button onClick={() => setIsEditDialogOpen(true)}>
            <UserPen className='mr-2 h-4 w-4' /> Edit Profile
          </Button>
        </div>

        {/* Top Banner Card */}
        <Card className='overflow-hidden border-border bg-card'>
          <CardContent className='flex flex-wrap items-center justify-between gap-6 p-6'>
            <div className='flex items-center gap-5'>
              <Avatar className='h-20 w-20 rounded-full border-2 border-border shadow-sm'>
                <AvatarFallback className='text-2xl font-bold bg-primary/10 text-primary'>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className='space-y-1'>
                <div className='flex items-center gap-3'>
                  <h3 className='text-2xl font-bold'>{fullName}</h3>
                  <Badge variant='outline' className='capitalize font-mono text-xs'>
                    {user.role}
                  </Badge>
                </div>
                <p className='font-mono text-sm text-muted-foreground'>@{user.username}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs: Profile vs Transactions */}
        <Tabs defaultValue='profile' className='w-full space-y-6'>
          <TabsList className='grid w-full grid-cols-2 max-w-xs'>
            <TabsTrigger value='profile' className='flex items-center gap-2'>
              <UserIcon className='h-4 w-4' /> Profile
            </TabsTrigger>
            <TabsTrigger value='transactions' className='flex items-center gap-2'>
              <ReceiptIcon className='h-4 w-4' /> Transactions ({receipts.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PROFILE */}
          <TabsContent value='profile' className='space-y-6'>
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {/* Identity Info */}
              <Card className='border-border bg-card'>
                <CardHeader className='pb-3'>
                  <CardTitle className='flex items-center gap-2 text-base font-semibold'>
                    <UserIcon className='h-4 w-4 text-muted-foreground' /> Basic Info
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3 text-sm'>
                  <div className='flex justify-between border-b border-border pb-2'>
                    <span className='text-muted-foreground'>User ID:</span>
                    <span className='font-mono font-medium'>#{user.id}</span>
                  </div>
                  <div className='flex justify-between border-b border-border pb-2'>
                    <span className='text-muted-foreground'>First Name:</span>
                    <span className='font-medium'>{user.first_name || '-'}</span>
                  </div>
                  <div className='flex justify-between pb-1'>
                    <span className='text-muted-foreground'>Last Name:</span>
                    <span className='font-medium'>{user.last_name || '-'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Details */}
              <Card className='border-border bg-card'>
                <CardHeader className='pb-3'>
                  <CardTitle className='flex items-center gap-2 text-base font-semibold'>
                    <Phone className='h-4 w-4 text-muted-foreground' /> Contact Info
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3 text-sm'>
                  <div className='flex justify-between border-b border-border pb-2'>
                    <span className='text-muted-foreground'>Phone Number:</span>
                    <span className='font-mono font-medium'>{user.phone_number || '-'}</span>
                  </div>
                  <div className='flex justify-between pb-1'>
                    <span className='text-muted-foreground'>Email Address:</span>
                    <span className='font-mono text-xs'>{user.email || '-'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Business & Banking */}
              <Card className='border-border bg-card md:col-span-2 lg:col-span-1'>
                <CardHeader className='pb-3'>
                  <CardTitle className='flex items-center gap-2 text-base font-semibold'>
                    <CreditCard className='h-4 w-4 text-muted-foreground' /> Business & Banking
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3 text-sm'>
                  <div className='flex justify-between border-b border-border pb-2'>
                    <span className='text-muted-foreground'>Bank Card:</span>
                    <span className='font-mono font-medium'>{user.card_number || '-'}</span>
                  </div>
                  <div className='flex justify-between pb-1'>
                    <span className='text-muted-foreground'>Brand / Workshop:</span>
                    <span className='font-medium'>{user.brand_name || '-'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: TRANSACTIONS */}
          <TabsContent value='transactions'>
            <Card className='border-border bg-card'>
              <CardHeader>
                <CardTitle className='text-lg font-semibold'>User Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {receipts.length === 0 ? (
                  <div className='flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground'>
                    <ReceiptIcon className='h-8 w-8 opacity-40' />
                    <span>No transactions recorded for this user.</span>
                  </div>
                ) : (
                  <div className='overflow-x-auto rounded-md border border-border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tracking Code</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>From Account</TableHead>
                          <TableHead>To Account</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receipts.map((rcp) => (
                          <TableRow key={rcp.id}>
                            <TableCell className='font-mono font-semibold'>{rcp.tracking_code}</TableCell>
                            <TableCell className='font-mono font-bold text-emerald-600 dark:text-emerald-400'>
                              {(Number(rcp.amount) || 0).toLocaleString()} تومان
                            </TableCell>
                            <TableCell>
                              <div className='flex flex-col text-xs'>
                                <span className='font-medium'>{rcp.from_account?.f_name} {rcp.from_account?.l_name}</span>
                                <span className='font-mono text-muted-foreground'>{rcp.from_account?.formatted_card_number || rcp.from_account?.card_number}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex flex-col text-xs'>
                                <span className='font-medium'>{rcp.to_account?.f_name} {rcp.to_account?.l_name}</span>
                                <span className='font-mono text-muted-foreground'>{rcp.to_account?.formatted_card_number || rcp.to_account?.card_number}</span>
                              </div>
                            </TableCell>
                            <TableCell className='font-mono text-xs'>{rcp.date_jalali} {rcp.time_str || ''}</TableCell>
                            <TableCell>
                              <Badge variant='outline' className='capitalize font-mono text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'>
                                {rcp.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow className='font-bold bg-muted/50'>
                          <TableCell colSpan={1} className='text-right'>Total:</TableCell>
                          <TableCell className='font-mono text-emerald-600 dark:text-emerald-400'>
                            {receipts.reduce((sum, rcp) => sum + (Number(rcp.amount) || 0), 0).toLocaleString()} تومان
                          </TableCell>
                          <TableCell colSpan={4} />
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Main>

      {/* Edit Dialog Integration */}
      <UsersActionDialog
        key={`edit-page-${user.id}`}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        currentRow={user}
        onSuccess={fetchUserData}
      />
    </>
  )
}
