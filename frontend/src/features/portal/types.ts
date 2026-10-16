export interface ContractOrder {
  id: number;
  order_code: string;
  client_name: string;
  apparel_type: string;
  total_received_pieces: number;
  unit_contractor_price: number;
  status: 'RECEIVED' | 'IN_PRODUCTION' | 'DELIVERED' | 'SETTLED';
  received_date_jalali: string;
  delivery_date_jalali?: string;
  notes?: string;
  created_at: string;
  total_revenue: number;
}

export interface SewingJob {
  id: number;
  job_code: string;
  cut: any;
  sewer: any;
  assigned_pieces: number;
  completed_pieces: number;
  rejected_pieces: number;
  unit_sewing_price: number;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SETTLED';
  assigned_at: string;
  completed_at?: string;
  total_payable_amount: number;
}
