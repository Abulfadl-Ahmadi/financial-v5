import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Account } from '../data/schema'

type AccountsDialogType = 'add' | 'edit' | 'delete'

type AccountsContextType = {
  open: AccountsDialogType | null
  setOpen: (str: AccountsDialogType | null) => void
  currentRow: Account | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Account | null>>
}

const AccountsContext = React.createContext<AccountsContextType | null>(null)

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<AccountsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Account | null>(null)

  return (
    <AccountsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </AccountsContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAccounts = () => {
  const accountsContext = React.useContext(AccountsContext)

  if (!accountsContext) {
    throw new Error('useAccounts has to be used within <AccountsContext>')
  }

  return accountsContext
}
