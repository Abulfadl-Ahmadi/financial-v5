'use client'

import { Eye, UserPen } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type User } from '../data/schema'
import { roles } from '../data/data'
import { useUsers } from './users-provider'

type UsersDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersDetailDialog({
  open,
  onOpenChange,
  currentRow,
}: UsersDetailDialogProps) {
  const { setOpen, setCurrentRow } = useUsers()

  const fullName = `${currentRow.first_name || ''} ${currentRow.last_name || ''}`.trim() || currentRow.username
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'US'

  const roleConfig = roles.find(
    (r) => r.value.toUpperCase() === (currentRow.role || '').toUpperCase()
  )
  const RoleIcon = roleConfig?.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            <Eye className='h-5 w-5 text-muted-foreground' />
            User Details
          </DialogTitle>
          <DialogDescription>
            Detailed view of user profile and account information.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-2'>
          {/* User Header Profile Card */}
          <div className='flex items-center gap-4 rounded-lg border border-border bg-muted/40 p-4'>
            <Avatar className='h-14 w-14 rounded-full border border-border'>
              <AvatarFallback className='text-lg font-bold bg-primary/10 text-primary'>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className='flex flex-col gap-1.5'>
              <h3 className='text-lg font-bold leading-none'>{fullName}</h3>
              <span className='font-mono text-xs text-muted-foreground'>@{currentRow.username}</span>
              <div className='flex flex-wrap items-center gap-2 pt-0.5'>
                {/* Status Badge */}
                {currentRow.is_active !== false ? (
                  <Badge
                    variant='outline'
                    className='text-xs font-medium bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-500/40 shadow-2xs flex items-center gap-1'
                  >
                    <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
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

                {/* Role Badge */}
                <Badge
                  variant='outline'
                  className='text-xs font-medium bg-muted/60 dark:bg-muted/40 text-foreground border-border/80 flex items-center gap-1'
                >
                  {RoleIcon && <RoleIcon className='size-3 text-muted-foreground' />}
                  <span>{roleConfig?.label || currentRow.role}</span>
                </Badge>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className='grid grid-cols-2 gap-4 rounded-lg border border-border bg-card p-4 text-sm'>
            <div className='space-y-1'>
              <span className='text-xs text-muted-foreground'>User ID</span>
              <p className='font-mono font-medium'>#{currentRow.id}</p>
            </div>
            <div className='space-y-1'>
              <span className='text-xs text-muted-foreground'>Status</span>
              <p className='font-medium'>
                {currentRow.is_active !== false ? (
                  <span className='text-emerald-600 dark:text-emerald-400 font-semibold'>فعال (مشغول به کار)</span>
                ) : (
                  <span className='text-muted-foreground'>غیرفعال (مرخص شده)</span>
                )}
              </p>
            </div>

            <div className='space-y-1'>
              <span className='text-xs text-muted-foreground'>Phone Number</span>
              <p className='font-mono font-medium'>{currentRow.phone_number || '-'}</p>
            </div>

            <div className='space-y-1'>
              <span className='text-xs text-muted-foreground'>Card Number</span>
              <p className='font-mono font-medium'>{currentRow.bank_accounts?.find((account) => account.is_primary && account.is_active !== false)?.formatted_card_number || '-'}</p>
            </div>

            <div className='col-span-2 space-y-1 border-t border-border pt-2'>
              <span className='text-xs text-muted-foreground'>Brand / Workshop</span>
              <p className='font-medium'>{currentRow.brand_name || '-'}</p>
            </div>

            {currentRow.email && (
              <div className='col-span-2 space-y-1 border-t border-border pt-2'>
                <span className='text-xs text-muted-foreground'>Email Address</span>
                <p className='font-mono text-xs'>{currentRow.email}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button
            variant='outline'
            onClick={() => {
              onOpenChange(false)
              setTimeout(() => {
                setCurrentRow(currentRow)
                setOpen('edit')
              }, 200)
            }}
          >
            <UserPen className='mr-2 h-4 w-4' /> Edit User
          </Button>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
