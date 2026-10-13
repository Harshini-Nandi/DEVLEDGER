from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.schemas.category import CategoryRead

class DocumentLineItemSchema(BaseModel):
    id: Optional[int] = None
    description: str
    quantity: Decimal = Decimal("1.00")
    unit_price: Decimal = Decimal("0.00")
    total: Decimal = Decimal("0.00")

    model_config = ConfigDict(from_attributes=True)

class DocumentExtractedData(BaseModel):
    document_type: str = "invoice"
    vendor: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    currency: str = "USD"
    subtotal: Decimal = Decimal("0.00")
    tax: Decimal = Decimal("0.00")
    total_amount: Decimal = Decimal("0.00")
    payment_status: str = "unknown"
    category_name: Optional[str] = "Other"
    line_items: List[DocumentLineItemSchema] = Field(default_factory=list)
    extraction_method: str = "heuristic_fallback"
    notes: Optional[str] = None
    raw_text: Optional[str] = None

class DocumentUpdate(BaseModel):
    document_type: Optional[str] = None
    vendor: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    currency: Optional[str] = None
    subtotal: Optional[Decimal] = None
    tax: Optional[Decimal] = None
    total_amount: Optional[Decimal] = None
    payment_status: Optional[str] = None
    category_id: Optional[int] = None
    notes: Optional[str] = None
    line_items: Optional[List[DocumentLineItemSchema]] = None

class DocumentRead(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_path: str
    file_size: int
    file_hash: str
    mime_type: str
    status: str
    document_type: str
    vendor: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    currency: str = "USD"
    subtotal: Decimal
    tax: Decimal
    total_amount: Decimal
    payment_status: str
    category_id: Optional[int] = None
    category: Optional[CategoryRead] = None
    raw_text: Optional[str] = None
    extraction_method: str
    is_duplicate: bool = False
    duplicate_of_id: Optional[int] = None
    notes: Optional[str] = None
    line_items: List[DocumentLineItemSchema] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
