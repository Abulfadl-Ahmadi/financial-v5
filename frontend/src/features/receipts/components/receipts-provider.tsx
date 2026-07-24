import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Receipt } from '../data/schema'

type ReceiptsDialogType = 'add' | 'edit' | 'delete'

type ReceiptsContextType = {
  open: ReceiptsDialogType | null
  setOpen: (str: ReceiptsDialogType | null) => void
  currentRow: Receipt | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Receipt | null>>
}

const ReceiptsContext = React.createContext<ReceiptsContextType | null>(null)

export function ReceiptsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<ReceiptsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Receipt | null>(null)

  return (
    <ReceiptsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </ReceiptsContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useReceipts = () => {
  const receiptsContext = React.useContext(ReceiptsContext)

  if (!receiptsContext) {
    throw new Error('useReceipts has to be used within <ReceiptsContext>')
  }

  return receiptsContext
}
