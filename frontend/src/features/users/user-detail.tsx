import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Loader2, UserPen, User as UserIcon, Phone, CreditCard, Receipt as ReceiptIcon, Plus, ImageIcon, UserCheck, UserX } from 'lucide-react'
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
import { roles } from './data/data'
import { type Receipt } from '@/features/receipts/data/schema'
import { UsersActionDialog } from './components/users-action-dialog'
import { ReceiptImageDialog } from '@/features/receipts/components/receipt-image-dialog'
import { BankCardBadge } from '@/components/ui/bank-card-badge'
import { TomanIcon } from '@/components/ui/toman-icon'

export function UserDetail() {
  const { userId } = useParams({ from: '/_authenticated/users/$userId' })
  const navigate = useNavigate()

  const [user, setUser] = useState<User | null>(null)
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedReceiptForImage, setSelectedReceiptForImage] = useState<Receipt | null>(null)

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

  const allCards = [...(user.bank_accounts || [])]
    .filter((account) => account.is_active !== false)
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
  const verifiedReceipts = receipts.filter((receipt) => receipt.status === 'VERIFIED')
  const totalReceived = verifiedReceipts.reduce((sum, receipt) => sum + (receipt.to_party_id === user.party_id ? Number(receipt.amount) || 0 : 0), 0)
  const totalPaid = verifiedReceipts.reduce((sum, receipt) => sum + (receipt.from_party_id === user.party_id ? Number(receipt.amount) || 0 : 0), 0)

  const handleToggleActive = async () => {
    try {
      await apiClient.patch(`/users/${userId}/toggle-active`)
      toast.success(
        user.is_active !== false
          ? `اکانت ${user.first_name || user.username} غیرفعال شد.`
          : `اکانت ${user.first_name || user.username} فعال شد.`
      )
      fetchUserData()
    } catch {
      toast.error('خطا در تغییر وضعیت کاربر')
    }
  }

  const roleConfig = roles.find(
    (r) => r.value.toUpperCase() === (user.role || '').toUpperCase()
  )
  const RoleIcon = roleConfig?.icon

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
                Profile and bank transactions for {fullName} (@{user.username})
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              onClick={handleToggleActive}
              className={
                user.is_active !== false
                  ? 'hover:text-amber-600 dark:hover:text-amber-400'
                  : 'hover:text-emerald-600 dark:hover:text-emerald-400'
              }
            >
              {user.is_active !== false ? (
                <>
                  <UserX className='mr-1.5 h-4 w-4 text-amber-600 dark:text-amber-400' />
                  غیرفعال‌سازی موقت
                </>
              ) : (
                <>
                  <UserCheck className='mr-1.5 h-4 w-4 text-emerald-600 dark:text-emerald-400' />
                  فعال‌سازی مجدد
                </>
              )}
            </Button>
            <Button onClick={() => setIsEditDialogOpen(true)}>
              <UserPen className='mr-2 h-4 w-4' /> Edit Profile & Cards
            </Button>
          </div>
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
              <div className='space-y-2'>
                <div className='flex flex-wrap items-center gap-2.5'>
                  <h3 className='text-2xl font-bold'>{fullName}</h3>

                  {/* Status Badge */}
                  {user.is_active !== false ? (
                    <Badge
                      variant='outline'
                      className='text-xs font-medium bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-500/40 shadow-2xs flex items-center gap-1.5'
                    >
                      <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
                      فعال (مشغول به کار)
                    </Badge>
                  ) : (
                    <Badge
                      variant='outline'
                      className='text-xs font-medium bg-slate-500/10 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30 dark:border-slate-500/40 shadow-2xs flex items-center gap-1.5'
                    >
                      <span className='size-1.5 rounded-full bg-slate-400' />
                      غیرفعال (مرخص / راکد)
                    </Badge>
                  )}

                  {/* Role Badge */}
                  <Badge
                    variant='outline'
                    className='text-xs font-medium bg-muted/60 dark:bg-muted/40 text-foreground border-border/80 flex items-center gap-1'
                  >
                    {RoleIcon && <RoleIcon className='size-3 text-muted-foreground' />}
                    <span>{roleConfig?.label || user.role}</span>
                  </Badge>
                </div>
                <p className='font-mono text-sm text-muted-foreground'>@{user.username}</p>
              </div>
            </div>

            <div className='flex gap-4 text-center'>
              <div className='p-3 bg-muted/40 rounded-lg'>
                <p className='text-xs text-muted-foreground'>دریافتی / پرداختی تأییدشده</p>
                <p className='flex items-center justify-center gap-1 text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400'>
                  <span>{totalReceived.toLocaleString()} / {totalPaid.toLocaleString()}</span>
                  <TomanIcon className='size-4 text-muted-foreground' />
                </p>
              </div>
              <div className='p-3 bg-muted/40 rounded-lg'>
                <p className='text-xs text-muted-foreground'>Bank Cards</p>
                <p className='text-lg font-bold font-mono text-foreground'>
                  {allCards.length} Cards
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs: Profile vs Transactions */}
        <Tabs defaultValue='profile' className='w-full space-y-6'>
          <TabsList className='grid w-full grid-cols-2 max-w-xs'>
            <TabsTrigger value='profile' className='flex items-center gap-2'>
              <UserIcon className='h-4 w-4' /> Profile & Accounts
            </TabsTrigger>
            <TabsTrigger value='transactions' className='flex items-center gap-2'>
              <ReceiptIcon className='h-4 w-4' /> Transactions ({receipts.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PROFILE & ACCOUNTS */}
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

              {/* Business Details */}
              <Card className='border-border bg-card'>
                <CardHeader className='pb-3'>
                  <CardTitle className='flex items-center gap-2 text-base font-semibold'>
                    <CreditCard className='h-4 w-4 text-muted-foreground' /> Business Info
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3 text-sm'>
                  <div className='flex justify-between border-b border-border pb-2'>
                    <span className='text-muted-foreground'>وضعیت فعالیت:</span>
                    {user.is_active !== false ? (
                      <Badge
                        variant='outline'
                        className='text-xs font-medium bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-500/40 shadow-2xs flex items-center gap-1'
                      >
                        <span className='size-1.5 rounded-full bg-emerald-500' />
                        فعال
                      </Badge>
                    ) : (
                      <Badge
                        variant='outline'
                        className='text-xs font-medium bg-slate-500/10 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30 dark:border-slate-500/40 shadow-2xs flex items-center gap-1'
                      >
                        <span className='size-1.5 rounded-full bg-slate-400' />
                        غیرفعال
                      </Badge>
                    )}
                  </div>
                  <div className='flex justify-between border-b border-border pb-2'>
                    <span className='text-muted-foreground'>نقش کاربری:</span>
                    <Badge
                      variant='outline'
                      className='text-xs font-medium bg-muted/60 dark:bg-muted/40 text-foreground border-border/80 flex items-center gap-1'
                    >
                      {RoleIcon && <RoleIcon className='size-3 text-muted-foreground' />}
                      <span>{roleConfig?.label || user.role}</span>
                    </Badge>
                  </div>
                  <div className='flex justify-between pb-1'>
                    <span className='text-muted-foreground'>Brand / Workshop:</span>
                    <span className='font-medium'>{user.brand_name || '-'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Registered Bank Cards Section */}
            <Card className='border-border bg-card'>
              <CardHeader className='flex flex-row items-center justify-between pb-3'>
                <CardTitle className='flex items-center gap-2 text-base font-semibold'>
                  <CreditCard className='h-4 w-4 text-primary' /> Registered Bank Cards ({allCards.length})
                </CardTitle>
                <Button
                  size='sm'
                  variant='outline'
                  className='h-8 text-xs gap-1'
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Plus className='h-3.5 w-3.5' /> Manage Cards
                </Button>
              </CardHeader>
              <CardContent>
                {allCards.length === 0 ? (
                  <p className='text-sm text-muted-foreground py-4 text-center'>
                    No bank cards registered for this user yet. Click Manage Cards to add.
                  </p>
                ) : (
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                    {allCards.map((c, i) => (
                      <div
                        key={c.id || i}
                        className='p-3.5 rounded-lg border border-border/80 bg-card hover:bg-muted/30 transition-all space-y-2'
                      >
                        <div className='flex items-center justify-between'>
                          <BankCardBadge
                            cardNumber={c.card_number}
                            bankName={c.bank_name}
                            size='default'
                            className='border-0 bg-transparent p-0 shadow-none'
                          />
                          {c.is_primary && (
                            <Badge variant='secondary' className='text-[10px]'>Primary</Badge>
                          )}
                        </div>
                        <p className='text-[11px] text-muted-foreground pt-1 border-t border-border/50'>
                          Holder: {c.f_name} {c.l_name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: TRANSACTIONS */}
          <TabsContent value='transactions'>
            <Card className='border-border bg-card'>
              <CardHeader>
                <CardTitle className='text-lg font-semibold'>User Transactions (All Accounts)</CardTitle>
              </CardHeader>
              <CardContent>
                {receipts.length === 0 ? (
                  <div className='flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground'>
                    <ReceiptIcon className='h-8 w-8 opacity-40' />
                    <span>No transactions recorded for any of this user&apos;s accounts.</span>
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
                            <TableCell>
                              <div className='flex items-center gap-1.5 font-mono font-semibold'>
                                <span>{rcp.tracking_code}</span>
                                {rcp.receipt_image && (
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    className='size-5 text-primary hover:bg-primary/10'
                                    title='View Receipt Image'
                                    onClick={() => setSelectedReceiptForImage(rcp)}
                                  >
                                    <ImageIcon className='h-3.5 w-3.5' />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className='font-mono font-bold text-emerald-600 dark:text-emerald-400'>
                              <div className='flex items-center gap-1'>
                                <span>{(Number(rcp.amount) || 0).toLocaleString()}</span>
                                <TomanIcon className='size-3.5 text-muted-foreground' />
                              </div>
                            </TableCell>
                            <TableCell>
                              <BankCardBadge
                                cardNumber={rcp.from_account?.card_number}
                                holderName={rcp.from_account?.user_full_name || `${rcp.from_account?.f_name || ''} ${rcp.from_account?.l_name || ''}`.trim() || 'حساب کارگاه'}
                                mono={true}
                                size='sm'
                              />
                            </TableCell>
                            <TableCell>
                              <BankCardBadge
                                cardNumber={rcp.to_account?.card_number}
                                holderName={rcp.to_account?.user_full_name || `${rcp.to_account?.f_name || ''} ${rcp.to_account?.l_name || ''}`.trim() || 'حساب مقصد'}
                                mono={true}
                                size='sm'
                              />
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
                            <div className='flex items-center gap-1'>
                              <span>{totalReceived.toLocaleString()} / {totalPaid.toLocaleString()}</span>
                              <TomanIcon className='size-3.5 text-muted-foreground' />
                            </div>
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

      <ReceiptImageDialog
        receipt={selectedReceiptForImage}
        open={!!selectedReceiptForImage}
        onOpenChange={(open) => !open && setSelectedReceiptForImage(null)}
      />
    </>
  )
}
