export interface BankTransactionItem {
  id: number
  statement_import_id: number
  statement_row_num: number
  excel_row_num: number
  date_jalali: string
  description: string
  document_number?: string | null
  reference_number?: string | null
  tracking_number?: string | null
  destination_card?: string | null
  masked_destination_card?: string | null
  sender_card?: string | null
  credit_irr: number
  debit_irr: number
  balance_irr: number
  user_note?: string | null
  category: string
  matched_receipt_id?: number | null
  matched_expense_id?: number | null
  paired_transaction_id?: number | null
  review_decision: string
  review_notes?: string | null
}

export interface StatementBatchItem {
  id: number
  deposit_id: number
  deposit_number: string
  filename: string
  file_hash: string
  from_date_jalali?: string | null
  to_date_jalali?: string | null
  total_rows: number
  total_credit_irr: number
  total_debit_irr: number
  status: string
  created_at: string
}

export interface DryRunPreviewData {
  deposit_number: string
  iban?: string | null
  from_date_jalali: string
  to_date_jalali: string
  total_rows: number
  calculated_credit_irr: number
  calculated_debit_irr: number
  sample_rows: Array<{
    statement_row_num: number
    date_jalali: string
    description: string
    credit_irr: number
    debit_irr: number
    balance_irr: number
    destination_card?: string | null
    tracking_number?: string | null
  }>
}
