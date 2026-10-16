import { useState } from 'react'
import { Row } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { type Expense } from '../data/schema'
import { ExpensesActionDialog } from './expenses-action-dialog'

interface DataTableRowActionsProps {
  row: Row<Expense>
  onSuccess?: () => void
}

export function DataTableRowActions({ row, onSuccess }: DataTableRowActionsProps) {
  const expense = row.original
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await apiClient.delete(`/financial/expenses/${expense.id}`)
      toast.success('Expense record deleted successfully.')
      setIsDeleteDialogOpen(false)
      onSuccess?.()
    } catch {
      toast.error('Failed to delete expense record.')
    } finally {
      setIsDeleting(false)
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
            <MoreHorizontal className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[160px]'>
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className='mr-2 h-3.5 w-3.5' /> Edit Expense
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className='text-destructive focus:text-destructive'
          >
            <Trash className='mr-2 h-3.5 w-3.5' /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExpensesActionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        currentRow={expense}
        onSuccess={onSuccess}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <b>{expense.title}</b> ({Number(expense.amount).toLocaleString()} تومان)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? 'Deleting...' : 'Delete Expense'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
