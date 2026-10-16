export interface ActionDraftData {
  id: string
  action_type: 'CREATE_RECEIPT' | 'CREATE_EXPENSE' | 'REGISTER_CARD'
  status: 'PENDING_APPROVAL' | 'COMMITTED' | 'DISCARDED' | 'EXPIRED'
  payload: Record<string, any>
  committed_record_id?: number | null
  expires_at: string
  created_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  activeDraft?: ActionDraftData | null
  timestamp: Date
}
