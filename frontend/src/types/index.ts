export interface Category {
  id: number;
  name: string;
  type: 'expense' | 'income';
  icon?: string;
  color?: string;
  is_custom: boolean;
  created_at?: string;
}

export interface DocumentLineItem {
  id?: number;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  total: number | string;
}

export interface DocumentRecord {
  id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  file_hash: string;
  mime_type: string;
  status: 'processed' | 'pending' | 'failed' | 'duplicate_warning';
  document_type: 'invoice' | 'receipt' | 'bill' | 'other';
  vendor?: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  currency: string;
  subtotal: string | number;
  tax: string | number;
  total_amount: string | number;
  payment_status: 'paid' | 'unpaid' | 'pending' | 'unknown';
  category_id?: number;
  category?: Category;
  raw_text?: string;
  extraction_method: string;
  is_duplicate: boolean;
  duplicate_of_id?: number;
  notes?: string;
  line_items: DocumentLineItem[];
  created_at?: string;
  updated_at?: string;
}

export interface TransactionRecord {
  id: number;
  date: string;
  amount: string | number;
  type: 'expense' | 'income';
  description: string;
  vendor?: string;
  category_id?: number;
  category?: Category;
  payment_method: string;
  status: 'completed' | 'pending' | 'reconciled';
  document_id?: number;
  notes?: string;
  is_tax_deductible: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardSummary {
  total_expenses_month: string | number;
  total_income_month: string | number;
  net_cashflow_month: string | number;
  pending_invoices_count: number;
  pending_invoices_total: string | number;
  documents_processed_count: number;
  potential_duplicates_count: number;
  expense_change_percentage: string | number;
  income_change_percentage: string | number;
  has_real_data: boolean;
  currency: string;
}

export interface MonthlyTrend {
  month: string;
  month_label: string;
  income: string | number;
  expenses: string | number;
  net: string | number;
}

export interface CategoryExpenseSummary {
  category_id?: number;
  category_name: string;
  color: string;
  total_amount: string | number;
  percentage: string | number;
  transaction_count: number;
}

export interface VendorSummary {
  vendor: string;
  total_amount: string | number;
  transaction_count: number;
}

export interface PendingInvoiceSummary {
  id: number;
  vendor?: string;
  invoice_number?: string;
  due_date?: string;
  total_amount: string | number;
  currency: string;
}

export interface AISpendingInsight {
  title: string;
  summary: string;
  detail: string;
  severity: 'info' | 'warning' | 'positive';
}

export interface AIQueryResponse {
  answer: string;
  retrieved_facts: Record<string, any>;
  source_documents: any[];
  model_used: string;
  is_ollama_connected: boolean;
  execution_time_ms: number;
  timestamp: string;
}

export interface OllamaStatusResponse {
  is_connected: boolean;
  host: string;
  current_model: string;
  available_models: string[];
  version?: string;
  error_message?: string;
  instructions?: string;
}

export interface UserProfile {
  name: string;
  business_name: string;
  email: string;
  default_currency: string;
}

export interface StorageInfo {
  database_size_bytes: number;
  database_size_formatted: string;
  documents_count: number;
  transactions_count: number;
  uploads_size_bytes: number;
  uploads_size_formatted: string;
  database_path: string;
  uploads_path: string;
}

export interface PrivacyInfo {
  is_fully_local: boolean;
  remote_apis_used: number;
  telemetry_enabled: boolean;
  third_party_cookies: boolean;
  model_host: string;
  local_storage_engine: string;
}
