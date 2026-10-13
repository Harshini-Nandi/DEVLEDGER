from datetime import datetime, date
from decimal import Decimal
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from app.models.transaction import Transaction
from app.models.document import Document
from app.models.category import Category
from app.schemas.analytics import (
    DashboardSummary,
    CategoryExpenseSummary,
    MonthlyTrend,
    VendorSummary,
    PendingInvoiceSummary,
    AISpendingInsight
)

def get_current_and_prev_month() -> tuple[str, str]:
    """Returns strings ('YYYY-MM', 'YYYY-MM') for current and previous month."""
    today = date.today()
    curr = today.strftime("%Y-%m")
    
    # Calculate previous month
    if today.month == 1:
        prev_year = today.year - 1
        prev_month = 12
    else:
        prev_year = today.year
        prev_month = today.month - 1
    prev = f"{prev_year:04d}-{prev_month:02d}"
    return curr, prev

def get_dashboard_summary(db: Session) -> DashboardSummary:
    """Calculates all key dashboard metrics deterministically using Decimal."""
    curr_month, prev_month = get_current_and_prev_month()

    # 1. Total expenses this month
    curr_expenses_query = db.query(func.sum(Transaction.amount)).filter(
        Transaction.type == "expense",
        Transaction.status == "completed",
        Transaction.date.startswith(curr_month)
    ).scalar()
    curr_expenses = Decimal(str(curr_expenses_query or 0.00)).quantize(Decimal("0.01"))

    # 2. Total income this month
    curr_income_query = db.query(func.sum(Transaction.amount)).filter(
        Transaction.type == "income",
        Transaction.status == "completed",
        Transaction.date.startswith(curr_month)
    ).scalar()
    curr_income = Decimal(str(curr_income_query or 0.00)).quantize(Decimal("0.01"))

    # Net cash flow
    net_cashflow = curr_income - curr_expenses

    # 3. Previous month expenses & income for % changes
    prev_expenses_query = db.query(func.sum(Transaction.amount)).filter(
        Transaction.type == "expense",
        Transaction.status == "completed",
        Transaction.date.startswith(prev_month)
    ).scalar()
    prev_expenses = Decimal(str(prev_expenses_query or 0.00)).quantize(Decimal("0.01"))

    prev_income_query = db.query(func.sum(Transaction.amount)).filter(
        Transaction.type == "income",
        Transaction.status == "completed",
        Transaction.date.startswith(prev_month)
    ).scalar()
    prev_income = Decimal(str(prev_income_query or 0.00)).quantize(Decimal("0.01"))

    # Percentage change calculation
    if prev_expenses > Decimal("0.00"):
        expense_change = (((curr_expenses - prev_expenses) / prev_expenses) * Decimal("100.00")).quantize(Decimal("0.1"))
    else:
        expense_change = Decimal("0.0") if curr_expenses == Decimal("0.00") else Decimal("100.0")

    if prev_income > Decimal("0.00"):
        income_change = (((curr_income - prev_income) / prev_income) * Decimal("100.00")).quantize(Decimal("0.1"))
    else:
        income_change = Decimal("0.0") if curr_income == Decimal("0.00") else Decimal("100.0")

    # 4. Pending / Unpaid invoices
    # Unpaid invoices in documents table
    pending_docs = db.query(Document).filter(
        or_(
            Document.payment_status == "unpaid",
            Document.payment_status == "pending"
        )
    ).all()
    pending_count = len(pending_docs)
    pending_total = sum((Decimal(str(d.total_amount or 0.00)) for d in pending_docs), Decimal("0.00")).quantize(Decimal("0.01"))

    # 5. Documents processed
    docs_processed = db.query(Document).count()

    # 6. Potential duplicate documents
    duplicates_count = db.query(Document).filter(Document.is_duplicate == True).count()

    # Check if there is real data
    total_tx_count = db.query(Transaction).count()
    has_real_data = total_tx_count > 0 or docs_processed > 0

    return DashboardSummary(
        total_expenses_month=curr_expenses,
        total_income_month=curr_income,
        net_cashflow_month=net_cashflow,
        pending_invoices_count=pending_count,
        pending_invoices_total=pending_total,
        documents_processed_count=docs_processed,
        potential_duplicates_count=duplicates_count,
        expense_change_percentage=expense_change,
        income_change_percentage=income_change,
        has_real_data=has_real_data,
        currency="USD"
    )

def get_monthly_trends(db: Session, num_months: int = 6) -> List[MonthlyTrend]:
    """Returns month-by-month financial trends for chart visualization."""
    today = date.today()
    months = []
    
    # Generate past N months
    for i in range(num_months - 1, -1, -1):
        # calculate month
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1
        m_str = f"{year:04d}-{month:02d}"
        
        # label e.g. "May 2026"
        dt = date(year, month, 1)
        m_label = dt.strftime("%b %Y")
        months.append((m_str, m_label))

    trends: List[MonthlyTrend] = []
    for m_str, m_label in months:
        exp_val = db.query(func.sum(Transaction.amount)).filter(
            Transaction.type == "expense",
            Transaction.status == "completed",
            Transaction.date.startswith(m_str)
        ).scalar()
        exp = Decimal(str(exp_val or 0.00)).quantize(Decimal("0.01"))

        inc_val = db.query(func.sum(Transaction.amount)).filter(
            Transaction.type == "income",
            Transaction.status == "completed",
            Transaction.date.startswith(m_str)
        ).scalar()
        inc = Decimal(str(inc_val or 0.00)).quantize(Decimal("0.01"))

        net = inc - exp

        trends.append(
            MonthlyTrend(
                month=m_str,
                month_label=m_label,
                income=inc,
                expenses=exp,
                net=net
            )
        )
    return trends

def get_category_expenses(db: Session, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[CategoryExpenseSummary]:
    """Computes total expenses grouped by category."""
    query = db.query(
        Category.id,
        Category.name,
        Category.color,
        func.sum(Transaction.amount).label("total"),
        func.count(Transaction.id).label("count")
    ).outerjoin(
        Transaction,
        (Transaction.category_id == Category.id) &
        (Transaction.type == "expense") &
        (Transaction.status == "completed")
    )

    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)

    results = query.group_by(Category.id, Category.name, Category.color).all()

    # Calculate overall total for percentage
    overall_total = Decimal("0.00")
    cat_items = []
    for cat_id, cat_name, color, tot, count in results:
        tot_dec = Decimal(str(tot or 0.00)).quantize(Decimal("0.01"))
        if tot_dec > Decimal("0.00"):
            overall_total += tot_dec
            cat_items.append((cat_id, cat_name, color or "#10b981", tot_dec, count))

    summaries: List[CategoryExpenseSummary] = []
    for cat_id, cat_name, color, tot_dec, count in sorted(cat_items, key=lambda x: x[3], reverse=True):
        pct = (((tot_dec / overall_total) * Decimal("100.00")).quantize(Decimal("0.1"))) if overall_total > Decimal("0.00") else Decimal("0.0")
        summaries.append(
            CategoryExpenseSummary(
                category_id=cat_id,
                category_name=cat_name,
                color=color,
                total_amount=tot_dec,
                percentage=pct,
                transaction_count=count
            )
        )
    return summaries

def get_top_vendors(db: Session, limit: int = 5) -> List[VendorSummary]:
    """Returns top vendors ranked by total spending."""
    results = db.query(
        Transaction.vendor,
        func.sum(Transaction.amount).label("total"),
        func.count(Transaction.id).label("count")
    ).filter(
        Transaction.type == "expense",
        Transaction.vendor.isnot(None),
        Transaction.vendor != ""
    ).group_by(Transaction.vendor).order_by(desc("total")).limit(limit).all()

    summaries = []
    for vendor, tot, count in results:
        summaries.append(
            VendorSummary(
                vendor=vendor,
                total_amount=Decimal(str(tot or 0.00)).quantize(Decimal("0.01")),
                transaction_count=count
            )
        )
    return summaries

def get_unpaid_invoices_list(db: Session) -> List[PendingInvoiceSummary]:
    """Returns list of pending/unpaid invoices."""
    docs = db.query(Document).filter(
        or_(
            Document.payment_status == "unpaid",
            Document.payment_status == "pending"
        )
    ).order_by(Document.due_date.asc()).all()

    return [
        PendingInvoiceSummary(
            id=d.id,
            vendor=d.vendor,
            invoice_number=d.invoice_number,
            due_date=d.due_date,
            total_amount=Decimal(str(d.total_amount or 0.00)).quantize(Decimal("0.01")),
            currency=d.currency or "USD"
        )
        for d in docs
    ]

def get_ai_spending_insight(db: Session) -> AISpendingInsight:
    """Generates an actionable financial insight card from current records."""
    summary = get_dashboard_summary(db)
    top_cats = get_category_expenses(db)

    if not summary.has_real_data:
        return AISpendingInsight(
            title="Ready to Analyze Your Finances",
            summary="No financial records recorded yet.",
            detail="Upload your first invoice/receipt or click 'Load Realistic Demo Data' to see immediate AI categorization, expense breakdowns, and tax insights.",
            severity="info"
        )

    if summary.pending_invoices_count > 0:
        return AISpendingInsight(
            title=f"Pending Invoices Alert: ${summary.pending_invoices_total} Due",
            summary=f"You have {summary.pending_invoices_count} unpaid or pending invoice(s) requiring attention.",
            detail="Ensure payments are settled prior to due dates to avoid late payment penalties or service interruptions.",
            severity="warning"
        )

    if top_cats:
        top = top_cats[0]
        return AISpendingInsight(
            title=f"Primary Expense Driver: {top.category_name}",
            summary=f"{top.category_name} represents {top.percentage}% (${top.total_amount}) of your expenses this period.",
            detail="Review recurring subscription tiers and vendor contracts to explore volume discounts or annual billing savings.",
            severity="positive" if summary.expense_change_percentage <= 0 else "info"
        )

    return AISpendingInsight(
        title="Balanced Financial Position",
        summary=f"Monthly net cash flow is sitting at ${summary.net_cashflow_month}.",
        detail="All invoices are currently up to date. Keep recording receipts to optimize tax deductions.",
        severity="positive"
    )
