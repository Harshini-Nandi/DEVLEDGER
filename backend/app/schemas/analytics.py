from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal

class CategoryExpenseSummary(BaseModel):
    category_id: Optional[int] = None
    category_name: str
    color: str
    total_amount: Decimal
    percentage: Decimal
    transaction_count: int

class MonthlyTrend(BaseModel):
    month: str # "2026-05"
    month_label: str # "May 2026"
    income: Decimal
    expenses: Decimal
    net: Decimal

class VendorSummary(BaseModel):
    vendor: str
    total_amount: Decimal
    transaction_count: int

class PendingInvoiceSummary(BaseModel):
    id: int
    vendor: Optional[str]
    invoice_number: Optional[str]
    due_date: Optional[str]
    total_amount: Decimal
    currency: str

class AISpendingInsight(BaseModel):
    title: str
    summary: str
    detail: str
    severity: str # 'info', 'warning', 'positive'

class DashboardSummary(BaseModel):
    total_expenses_month: Decimal
    total_income_month: Decimal
    net_cashflow_month: Decimal
    pending_invoices_count: int
    pending_invoices_total: Decimal
    documents_processed_count: int
    potential_duplicates_count: int
    expense_change_percentage: Decimal
    income_change_percentage: Decimal
    has_real_data: bool
    currency: str = "USD"
