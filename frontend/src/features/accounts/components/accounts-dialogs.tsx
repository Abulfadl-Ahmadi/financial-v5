import { AccountsActionDialog } from './accounts-action-dialog'
import { AccountsDeleteDialog } from './accounts-delete-dialog'
import { useAccounts } from './accounts-provider'

export function AccountsDialogs({ onSuccess }: { onSuccess?: () => void }) {
  const { open, setOpen, currentRow, setCurrentRow } = useAccounts()
  return (
    <>
      <AccountsActionDialog
        key='account-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
        onSuccess={onSuccess}
      />

      {currentRow && (
        <>
          <AccountsActionDialog
            key={`account-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
            onSuccess={onSuccess}
          />

          <AccountsDeleteDialog
            key={`account-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
            onSuccess={onSuccess}
          />
        </>
      )}
    </>
  )
}
