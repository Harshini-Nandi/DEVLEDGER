import os
import io
import csv
from datetime import date
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Response
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.database import get_db
from app.models.document import Document, DocumentLineItem
from app.models.transaction import Transaction
from app.models.category import Category
from app.schemas.document import DocumentRead, DocumentUpdate
from app.services.document_extractor import validate_and_process_upload
from app.services.ollama_service import ollama_service

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentRead)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Uploads a PDF or receipt image, extracts text, calls Ollama (or fallback), and saves to SQLite."""
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # 1. Validate and process upload
    stored_name, save_path, file_hash, raw_text, ocr_used = validate_and_process_upload(file, content)

    # 2. Check for duplicate upload (SHA-256 match)
    existing_doc = db.query(Document).filter(Document.file_hash == file_hash).first()
    is_duplicate = False
    duplicate_of_id = None
    status = "processed"

    if existing_doc:
        is_duplicate = True
        duplicate_of_id = existing_doc.id
        status = "duplicate_warning"

    # 3. Extract structured fields via Ollama (falls back to regex parser if offline)
    extracted = await ollama_service.extract_document_fields(raw_text)

    # 4. Resolve category
    category_id = None
    if extracted.category_name:
        cat = db.query(Category).filter(Category.name.ilike(f"%{extracted.category_name}%")).first()
        if cat:
            category_id = cat.id

    # 5. Persist Document to database
    db_doc = Document(
        filename=stored_name,
        original_filename=file.filename or stored_name,
        file_path=save_path,
        file_size=len(content),
        file_hash=file_hash,
        mime_type=file.content_type or "application/octet-stream",
        status=status,
        document_type=extracted.document_type,
        vendor=extracted.vendor,
        invoice_number=extracted.invoice_number,
        invoice_date=extracted.invoice_date,
        due_date=extracted.due_date,
        currency=extracted.currency or "USD",
        subtotal=extracted.subtotal,
        tax=extracted.tax,
        total_amount=extracted.total_amount,
        payment_status=extracted.payment_status,
        category_id=category_id,
        raw_text=raw_text,
        extraction_method=extracted.extraction_method,
        is_duplicate=is_duplicate,
        duplicate_of_id=duplicate_of_id,
        notes=extracted.notes
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    # 6. Save line items
    for item in extracted.line_items:
        db_item = DocumentLineItem(
            document_id=db_doc.id,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total=item.total
        )
        db.add(db_item)
    if extracted.line_items:
        db.commit()
        db.refresh(db_doc)

    return db_doc

@router.get("", response_model=List[DocumentRead])
def list_documents(
    query: Optional[str] = None,
    document_type: Optional[str] = None,
    payment_status: Optional[str] = None,
    category_id: Optional[int] = None,
    is_duplicate: Optional[bool] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """List documents with search and filtering."""
    q = db.query(Document)

    if query:
        search_pattern = f"%{query}%"
        q = q.filter(
            or_(
                Document.vendor.ilike(search_pattern),
                Document.invoice_number.ilike(search_pattern),
                Document.original_filename.ilike(search_pattern),
                Document.raw_text.ilike(search_pattern)
            )
        )
    if document_type:
        q = q.filter(Document.document_type == document_type)
    if payment_status:
        q = q.filter(Document.payment_status == payment_status)
    if category_id:
        q = q.filter(Document.category_id == category_id)
    if is_duplicate is not None:
        q = q.filter(Document.is_duplicate == is_duplicate)

    docs = q.order_by(desc(Document.created_at)).offset(offset).limit(limit).all()
    return docs

@router.get("/export/csv")
def export_documents_csv(db: Session = Depends(get_db)):
    """Export extracted document records as CSV."""
    docs = db.query(Document).order_by(desc(Document.created_at)).all()
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "ID", "Original Filename", "Type", "Vendor", "Invoice #",
        "Invoice Date", "Due Date", "Currency", "Subtotal", "Tax",
        "Total Amount", "Payment Status", "Category", "Is Duplicate", "Created At"
    ])

    for d in docs:
        cat_name = d.category.name if d.category else "Uncategorized"
        writer.writerow([
            d.id, d.original_filename, d.document_type, d.vendor or "", d.invoice_number or "",
            d.invoice_date or "", d.due_date or "", d.currency, d.subtotal, d.tax,
            d.total_amount, d.payment_status, cat_name, "Yes" if d.is_duplicate else "No", d.created_at
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=openledger_documents.csv"}
    )

@router.get("/{doc_id}", response_model=DocumentRead)
def get_document(doc_id: int, db: Session = Depends(get_db)):
    """Retrieve single document with extracted line items."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc

@router.put("/{doc_id}", response_model=DocumentRead)
def update_document(
    doc_id: int,
    payload: DocumentUpdate,
    db: Session = Depends(get_db)
):
    """Correct or edit extracted fields."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    update_data = payload.model_dump(exclude_unset=True)
    line_items_data = update_data.pop("line_items", None)

    for field, val in update_data.items():
        setattr(doc, field, val)

    if line_items_data is not None:
        # replace line items
        db.query(DocumentLineItem).filter(DocumentLineItem.document_id == doc_id).delete()
        for item in line_items_data:
            db.add(DocumentLineItem(
                document_id=doc.id,
                description=item["description"],
                quantity=Decimal(str(item.get("quantity", 1))),
                unit_price=Decimal(str(item.get("unit_price", 0))),
                total=Decimal(str(item.get("total", 0)))
            ))

    doc.extraction_method = "manual_correction"
    db.commit()
    db.refresh(doc)
    return doc

@router.delete("/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    """Delete document and remove original file from local disk."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Remove physical file if it exists
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            print(f"Error deleting file {doc.file_path}: {e}")

    # Remove line items and document
    db.query(DocumentLineItem).filter(DocumentLineItem.document_id == doc_id).delete()
    db.delete(doc)
    db.commit()
    return {"status": "success", "message": f"Document #{doc_id} deleted successfully."}

@router.get("/{doc_id}/download")
def download_document_file(doc_id: int, db: Session = Depends(get_db)):
    """Download original document file."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc or not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Original document file not found on disk.")

    return FileResponse(
        path=doc.file_path,
        filename=doc.original_filename,
        media_type=doc.mime_type
    )

@router.post("/{doc_id}/create-transaction")
def create_transaction_from_document(doc_id: int, db: Session = Depends(get_db)):
    """Converts a verified document into an official transaction record."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Determine type
    tx_type = "expense"
    if doc.category and doc.category.type == "income":
        tx_type = "income"
    elif "income" in (doc.vendor or "").lower():
        tx_type = "income"

    # Transaction date
    tx_date = doc.invoice_date or date.today().strftime("%Y-%m-%d")

    # Only treat as completed if marked paid or is receipt; if unpaid invoice, mark as pending transaction!
    tx_status = "completed" if doc.payment_status in ("paid", "receipt") else "pending"

    tx = Transaction(
        date=tx_date,
        amount=doc.total_amount,
        type=tx_type,
        description=f"Recorded from {doc.document_type}: {doc.vendor or doc.original_filename}",
        vendor=doc.vendor or "Unknown",
        category_id=doc.category_id,
        payment_method="Credit Card" if tx_type == "expense" else "Bank Transfer",
        status=tx_status,
        document_id=doc.id,
        notes=f"Generated automatically from document #{doc.id} ({doc.invoice_number or 'No Inv #'})"
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return {"status": "success", "message": "Transaction created successfully.", "transaction_id": tx.id}
