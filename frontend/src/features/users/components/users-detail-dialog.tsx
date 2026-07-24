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
            <div className='flex flex-col gap-1'>
              <h3 className='text-lg font-bold leading-none'>{fullName}</h3>
              <span className='font-mono text-sm text-muted-foreground'>@{currentRow.username}</span>
              <div className='mt-1 flex items-center gap-2'>
                <Badge variant='outline' className='capitalize font-mono text-xs'>
                  {currentRow.role}
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
              <span className='text-xs text-muted-foreground'>Role</span>
              <p className='font-medium capitalize'>{currentRow.role}</p>
            </div>

            <div className='space-y-1'>
              <span className='text-xs text-muted-foreground'>Phone Number</span>
              <p className='font-mono font-medium'>{currentRow.phone_number || '-'}</p>
            </div>

            <div className='space-y-1'>
              <span className='text-xs text-muted-foreground'>Card Number</span>
              <p className='font-mono font-medium'>{currentRow.card_number || '-'}</p>
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
