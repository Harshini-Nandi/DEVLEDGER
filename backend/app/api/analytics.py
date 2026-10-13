from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.analytics import (
    DashboardSummary,
    MonthlyTrend,
    CategoryExpenseSummary,
    VendorSummary,
    PendingInvoiceSummary,
    AISpendingInsight
)
from app.services.financial_engine import (
    get_dashboard_summary,
    get_monthly_trends,
    get_category_expenses,
    get_top_vendors,
    get_unpaid_invoices_list,
    get_ai_spending_insight
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db)):
    """Returns overview dashboard KPI summary."""
    return get_dashboard_summary(db)

@router.get("/trends", response_model=List[MonthlyTrend])
def monthly_trends(
    months: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db)
):
    """Returns month-by-month income, expense, and net trends."""
    return get_monthly_trends(db, num_months=months)

@router.get("/categories", response_model=List[CategoryExpenseSummary])
def category_breakdown(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Returns category-level expense distribution."""
    return get_category_expenses(db, start_date=start_date, end_date=end_date)

@router.get("/vendors", response_model=List[VendorSummary])
def top_vendors(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """Returns top spending vendors ranked by total expenses."""
    return get_top_vendors(db, limit=limit)

@router.get("/unpaid", response_model=List[PendingInvoiceSummary])
def unpaid_invoices(db: Session = Depends(get_db)):
    """Returns list of pending and unpaid invoices."""
    return get_unpaid_invoices_list(db)

@router.get("/ai-insight", response_model=AISpendingInsight)
def ai_spending_insight(db: Session = Depends(get_db)):
    """Generates an actionable financial insight card."""
    return get_ai_spending_insight(db)

@router.get("/report/monthly-html")
def generate_monthly_html_report(db: Session = Depends(get_db)):
    """Generates a clean, printable HTML financial report for the user's records."""
    summary = get_dashboard_summary(db)
    cats = get_category_expenses(db)
    trends = get_monthly_trends(db, 3)
    vendors = get_top_vendors(db, 5)

    cats_html = "".join([
        f"<tr><td>{c.category_name}</td><td>${c.total_amount}</td><td>{c.percentage}%</td><td>{c.transaction_count}</td></tr>"
        for c in cats
    ]) or "<tr><td colspan='4'>No expense records found.</td></tr>"

    vendors_html = "".join([
        f"<tr><td>{v.vendor}</td><td>${v.total_amount}</td><td>{v.transaction_count}</td></tr>"
        for v in vendors
    ]) or "<tr><td colspan='3'>No vendor records found.</td></tr>"

    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>OpenLedger AI — Monthly Financial Summary</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; padding: 40px; background: #fff; }}
        .header {{ display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }}
        .logo {{ font-size: 24px; font-weight: 800; color: #0f172a; }}
        .badge {{ background: #ecfdf5; color: #059669; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }}
        .grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }}
        .card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; }}
        .card-label {{ font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; }}
        .card-val {{ font-size: 26px; font-weight: 700; color: #0f172a; margin-top: 6px; }}
        table {{ width: 100%; border-collapse: collapse; margin-bottom: 30px; }}
        th, td {{ text-align: left; padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }}
        th {{ background: #f1f5f9; font-weight: 600; color: #334155; }}
        .footer {{ margin-top: 50px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }}
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="logo">OpenLedger AI</div>
            <div style="color: #64748b; font-size: 14px;">Private Financial Summary Report</div>
        </div>
        <div style="text-align: right;">
            <span class="badge">100% On-Device Private</span>
            <div style="font-size: 13px; color: #64748b; margin-top: 5px;">Generated: {summary.currency} Records</div>
        </div>
    </div>

    <div class="grid">
        <div class="card">
            <div class="card-label">Monthly Expenses</div>
            <div class="card-val">${summary.total_expenses_month}</div>
        </div>
        <div class="card">
            <div class="card-label">Monthly Income</div>
            <div class="card-val">${summary.total_income_month}</div>
        </div>
        <div class="card">
            <div class="card-label">Net Balance</div>
            <div class="card-val" style="color: {'#059669' if summary.net_cashflow_month >= 0 else '#dc2626'}">${summary.net_cashflow_month}</div>
        </div>
    </div>

    <h3>Expense Breakdown by Category</h3>
    <table>
        <thead>
            <tr><th>Category</th><th>Amount</th><th>Share (%)</th><th>Transactions</th></tr>
        </thead>
        <tbody>
            {cats_html}
        </tbody>
    </table>

    <h3>Top Vendors</h3>
    <table>
        <thead>
            <tr><th>Vendor</th><th>Total Spent</th><th>Transactions</th></tr>
        </thead>
        <tbody>
            {vendors_html}
        </tbody>
    </table>

    <div class="footer">
        Confidential — Processed locally via SQLite on your local device. No financial details were transmitted over the network.
    </div>
</body>
</html>"""
    return HTMLResponse(content=html)
