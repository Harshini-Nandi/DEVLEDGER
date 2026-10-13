from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.ai import AIQueryRequest, AIQueryResponse, OllamaStatusResponse
from app.models.settings import AppSetting
from app.models.transaction import Transaction
from app.models.document import Document
from app.services.ollama_service import ollama_service
from app.services.financial_engine import (
    get_dashboard_summary,
    get_category_expenses,
    get_unpaid_invoices_list
)

router = APIRouter(prefix="/api/ai", tags=["AI Finance Assistant"])

@router.get("/status", response_model=OllamaStatusResponse)
async def get_ollama_status():
    """Returns local Ollama daemon connection state, models installed, and diagnostics."""
    return await ollama_service.check_status()

@router.post("/query", response_model=AIQueryResponse)
async def query_ai_assistant(
    payload: AIQueryRequest,
    db: Session = Depends(get_db)
):
    """
    Answers natural language questions about stored finances.
    Calculates exact facts from SQLite using Python Decimal, then provides
    the verified metrics to the local model to prevent hallucination.
    """
    # 1. Fetch exact factual context from SQLite
    summary = get_dashboard_summary(db)
    top_categories = get_category_expenses(db)
    unpaid_invoices = get_unpaid_invoices_list(db)
    
    # Recent transactions
    recent_txs = db.query(Transaction).order_by(Transaction.date.desc()).limit(10).all()
    recent_tx_list = [
        {
            "id": t.id,
            "date": t.date,
            "amount": str(t.amount),
            "type": t.type,
            "vendor": t.vendor,
            "category": t.category.name if t.category else "Uncategorized",
            "description": t.description
        }
        for t in recent_txs
    ]

    # Duplicate documents
    duplicates = db.query(Document).filter(Document.is_duplicate == True).limit(5).all()
    dup_list = [
        {
            "id": d.id,
            "filename": d.original_filename,
            "vendor": d.vendor,
            "total_amount": str(d.total_amount),
            "invoice_date": d.invoice_date
        }
        for d in duplicates
    ]

    context = {
        "summary": {
            "total_expenses_month": str(summary.total_expenses_month),
            "total_income_month": str(summary.total_income_month),
            "net_cashflow_month": str(summary.net_cashflow_month),
            "pending_invoices_count": summary.pending_invoices_count,
            "pending_invoices_total": str(summary.pending_invoices_total),
            "documents_processed_count": summary.documents_processed_count,
            "potential_duplicates_count": summary.potential_duplicates_count,
            "expense_change_percentage": str(summary.expense_change_percentage),
            "has_real_data": summary.has_real_data
        },
        "top_categories": [
            {
                "category_name": c.category_name,
                "total_amount": str(c.total_amount),
                "percentage": str(c.percentage),
                "transaction_count": c.transaction_count
            }
            for c in top_categories[:5]
        ],
        "unpaid_invoices": [
            {
                "id": u.id,
                "vendor": u.vendor,
                "invoice_number": u.invoice_number,
                "due_date": u.due_date,
                "total_amount": str(u.total_amount),
                "currency": u.currency
            }
            for u in unpaid_invoices
        ],
        "duplicates": dup_list,
        "recent_transactions": recent_tx_list
    }

    # 2. Query assistant with grounded context
    result = await ollama_service.answer_financial_query(payload.query, context)
    return AIQueryResponse(**result)

@router.post("/set-model")
def set_active_model(model_name: str, db: Session = Depends(get_db)):
    """Configure active Ollama model name."""
    ollama_service.model = model_name
    setting = db.query(AppSetting).filter(AppSetting.key == "ollama_model").first()
    if not setting:
        setting = AppSetting(key="ollama_model", value=model_name)
        db.add(setting)
    else:
        setting.value = model_name
    db.commit()
    return {"status": "success", "model": model_name}
