import io
import csv
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.database import get_db
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionRead, TransactionCreate, TransactionUpdate

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionRead])
def list_transactions(
    query: Optional[str] = None,
    category_id: Optional[int] = None,
    type: Optional[str] = None, # 'expense' or 'income'
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    min_amount: Optional[Decimal] = None,
    max_amount: Optional[Decimal] = None,
    sort_by: str = Query("date", pattern="^(date|amount|vendor|id)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """List transactions with flexible filtering and sorting."""
    q = db.query(Transaction)

    if query:
        search_pattern = f"%{query}%"
        q = q.filter(
            or_(
                Transaction.description.ilike(search_pattern),
                Transaction.vendor.ilike(search_pattern),
                Transaction.notes.ilike(search_pattern)
            )
        )
    if category_id:
        q = q.filter(Transaction.category_id == category_id)
    if type:
        q = q.filter(Transaction.type == type)
    if status:
        q = q.filter(Transaction.status == status)
    if start_date:
        q = q.filter(Transaction.date >= start_date)
    if end_date:
        q = q.filter(Transaction.date <= end_date)
    if min_amount is not None:
        q = q.filter(Transaction.amount >= min_amount)
    if max_amount is not None:
        q = q.filter(Transaction.amount <= max_amount)

    # Sorting
    col = getattr(Transaction, sort_by)
    if sort_order == "desc":
        q = q.order_by(desc(col))
    else:
        q = q.order_by(asc(col))

    return q.offset(offset).limit(limit).all()

@router.post("", response_model=TransactionRead)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db)
):
    """Create a manual income or expense transaction."""
    tx = Transaction(**payload.model_dump())
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx

@router.get("/export/csv")
def export_transactions_csv(
    type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Export filtered transactions to CSV format."""
    q = db.query(Transaction)
    if type:
        q = q.filter(Transaction.type == type)
    if start_date:
        q = q.filter(Transaction.date >= start_date)
    if end_date:
        q = q.filter(Transaction.date <= end_date)

    txs = q.order_by(desc(Transaction.date)).all()
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "ID", "Date", "Type", "Amount", "Vendor", "Category",
        "Description", "Payment Method", "Status", "Tax Deductible", "Document ID"
    ])

    for tx in txs:
        cat_name = tx.category.name if tx.category else "Uncategorized"
        writer.writerow([
            tx.id, tx.date, tx.type, tx.amount, tx.vendor or "", cat_name,
            tx.description, tx.payment_method, tx.status,
            "Yes" if tx.is_tax_deductible else "No", tx.document_id or ""
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=openledger_transactions.csv"}
    )

@router.get("/{tx_id}", response_model=TransactionRead)
def get_transaction(tx_id: int, db: Session = Depends(get_db)):
    """Retrieve single transaction."""
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    return tx

@router.put("/{tx_id}", response_model=TransactionRead)
def update_transaction(
    tx_id: int,
    payload: TransactionUpdate,
    db: Session = Depends(get_db)
):
    """Update transaction details."""
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(tx, field, val)

    db.commit()
    db.refresh(tx)
    return tx

@router.delete("/{tx_id}")
def delete_transaction(tx_id: int, db: Session = Depends(get_db)):
    """Delete transaction record."""
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    db.delete(tx)
    db.commit()
    return {"status": "success", "message": f"Transaction #{tx_id} deleted successfully."}
