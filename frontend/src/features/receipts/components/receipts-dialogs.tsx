import { ReceiptsActionDialog } from './receipts-action-dialog'
import { ReceiptsDeleteDialog } from './receipts-delete-dialog'
import { useReceipts } from './receipts-provider'

export function ReceiptsDialogs({ onSuccess }: { onSuccess?: () => void }) {
  const { open, setOpen, currentRow, setCurrentRow } = useReceipts()
  return (
    <>
      <ReceiptsActionDialog
        key='receipt-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
        onSuccess={onSuccess}
      />

      {currentRow && (
        <>
          <ReceiptsActionDialog
            key={`receipt-edit-${currentRow.id}`}
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

          <ReceiptsDeleteDialog
            key={`receipt-delete-${currentRow.id}`}
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
