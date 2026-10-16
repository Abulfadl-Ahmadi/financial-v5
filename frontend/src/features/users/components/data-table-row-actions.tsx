import { Link } from '@tanstack/react-router'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Trash2, UserPen, Eye, UserX, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type User } from '../data/schema'
import { useUsers } from './users-provider'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

type DataTableRowActionsProps = {
  row: Row<User>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useUsers()
  const user = row.original
  const isActive = user.is_active !== false

  const handleToggleActive = async () => {
    try {
      await apiClient.patch(`/users/${user.id}/toggle-active`)
      toast.success(
        isActive
          ? `اکانت ${user.first_name || user.username} غیرفعال شد.`
          : `اکانت ${user.first_name || user.username} فعال شد.`
      )
      window.location.reload()
    } catch {
      toast.error('خطا در تغییر وضعیت کاربر')
    }
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
          >
            <DotsHorizontalIcon className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          <DropdownMenuItem asChild>
            <Link to='/users/$userId' params={{ userId: String(user.id) }}>
              مشاهده پروفایل
              <DropdownMenuShortcut>
                <Eye size={16} />
              </DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(user)
              setOpen('edit')
            }}
          >
            ویرایش اطلاعات
            <DropdownMenuShortcut>
              <UserPen size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleActive}>
            {isActive ? (
              <>
                <span className='text-amber-600 dark:text-amber-400'>غیرفعال‌سازی موقت</span>
                <DropdownMenuShortcut>
                  <UserX size={16} className='text-amber-600 dark:text-amber-400' />
                </DropdownMenuShortcut>
              </>
            ) : (
              <>
                <span className='text-emerald-600 dark:text-emerald-400'>فعال‌سازی مجدد</span>
                <DropdownMenuShortcut>
                  <UserCheck size={16} className='text-emerald-600 dark:text-emerald-400' />
                </DropdownMenuShortcut>
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(user)
              setOpen('delete')
            }}
            className='text-red-500!'
          >
            حذف کامل اکانت
            <DropdownMenuShortcut>
              <Trash2 size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
