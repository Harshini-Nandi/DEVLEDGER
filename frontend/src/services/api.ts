import type {
  DashboardSummary,
  MonthlyTrend,
  CategoryExpenseSummary,
  VendorSummary,
  PendingInvoiceSummary,
  AISpendingInsight,
  DocumentRecord,
  TransactionRecord,
  Category,
  AIQueryResponse,
  OllamaStatusResponse,
  UserProfile,
  StorageInfo,
  PrivacyInfo
} from '../types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      errorDetail = `Error ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Analytics & Dashboard
  getDashboardSummary: () => request<DashboardSummary>('/analytics/dashboard'),
  getMonthlyTrends: (months: number = 6) => request<MonthlyTrend[]>(`/analytics/trends?months=${months}`),
  getCategoryExpenses: (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.append('start_date', start);
    if (end) params.append('end_date', end);
    return request<CategoryExpenseSummary[]>(`/analytics/categories?${params.toString()}`);
  },
  getTopVendors: (limit: number = 5) => request<VendorSummary[]>(`/analytics/vendors?limit=${limit}`),
  getUnpaidInvoices: () => request<PendingInvoiceSummary[]>('/analytics/unpaid'),
  getAISpendingInsight: () => request<AISpendingInsight>('/analytics/ai-insight'),

  // Documents
  listDocuments: (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    return request<DocumentRecord[]>(`/documents?${searchParams.toString()}`);
  },
  uploadDocument: async (file: File): Promise<DocumentRecord> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return response.json();
  },
  getDocument: (id: number) => request<DocumentRecord>(`/documents/${id}`),
  updateDocument: (id: number, payload: Partial<DocumentRecord>) =>
    request<DocumentRecord>(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteDocument: (id: number) =>
    request<{ status: string; message: string }>(`/documents/${id}`, { method: 'DELETE' }),
  createTransactionFromDocument: (docId: number) =>
    request<{ status: string; message: string; transaction_id: number }>(`/documents/${docId}/create-transaction`, {
      method: 'POST',
    }),

  // Transactions
  listTransactions: (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    return request<TransactionRecord[]>(`/transactions?${searchParams.toString()}`);
  },
  createTransaction: (payload: any) =>
    request<TransactionRecord>('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateTransaction: (id: number, payload: any) =>
    request<TransactionRecord>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteTransaction: (id: number) =>
    request<{ status: string; message: string }>(`/transactions/${id}`, { method: 'DELETE' }),

  // Categories
  listCategories: () => request<Category[]>('/categories'),
  createCategory: (payload: { name: string; type: string; icon?: string; color?: string }) =>
    request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // AI Assistant
  getAIStatus: () => request<OllamaStatusResponse>('/ai/status'),
  queryAIAssistant: (query: string) =>
    request<AIQueryResponse>('/ai/query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
  setActiveModel: (modelName: string) =>
    request<{ status: string; model: string }>(`/ai/set-model?model_name=${encodeURIComponent(modelName)}`, {
      method: 'POST',
    }),

  // Settings & Profile
  getUserProfile: () => request<UserProfile>('/settings/profile'),
  updateUserProfile: (payload: UserProfile) =>
    request<UserProfile>('/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  getStorageInfo: () => request<StorageInfo>('/settings/storage'),
  getPrivacyInfo: () => request<PrivacyInfo>('/settings/privacy'),

  // Demo Data & Privacy Wipe
  loadDemoData: () => request<{ status: string; message: string }>('/settings/demo/load', { method: 'POST' }),
  clearAllData: () => request<{ status: string; message: string }>('/settings/demo/clear', { method: 'POST' }),
};
