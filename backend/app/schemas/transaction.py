from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.schemas.category import CategoryRead

class TransactionBase(BaseModel):
    date: str # YYYY-MM-DD
    amount: Decimal = Field(..., gt=0)
    type: str = "expense" # 'expense' or 'income'
    description: str
    vendor: Optional[str] = None
    category_id: Optional[int] = None
    payment_method: str = "Credit Card"
    status: str = "completed" # completed, pending, reconciled
    document_id: Optional[int] = None
    notes: Optional[str] = None
    is_tax_deductible: bool = True

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    date: Optional[str] = None
    amount: Optional[Decimal] = None
    type: Optional[str] = None
    description: Optional[str] = None
    vendor: Optional[str] = None
    category_id: Optional[int] = None
    payment_method: Optional[str] = None
    status: Optional[str] = None
    document_id: Optional[int] = None
    notes: Optional[str] = None
    is_tax_deductible: Optional[bool] = None

class TransactionRead(TransactionBase):
    id: int
    category: Optional[CategoryRead] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
