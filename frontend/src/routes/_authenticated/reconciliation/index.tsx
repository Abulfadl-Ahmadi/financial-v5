import { createFileRoute } from '@tanstack/react-router'
import { Reconciliation } from '@/features/reconciliation'

export const Route = createFileRoute('/_authenticated/reconciliation/')({
  component: Reconciliation,
})
