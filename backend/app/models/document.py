from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_hash = Column(String(64), index=True, nullable=False) # SHA-256
    mime_type = Column(String(100), nullable=False)
    status = Column(String(50), default="processed", nullable=False) # processed, pending, failed, duplicate_warning
    
    document_type = Column(String(50), default="invoice") # invoice, receipt, bill, other
    vendor = Column(String(255), index=True)
    invoice_number = Column(String(100), index=True)
    invoice_date = Column(String(20), index=True) # YYYY-MM-DD
    due_date = Column(String(20)) # YYYY-MM-DD
    currency = Column(String(10), default="USD")
    
    subtotal = Column(Numeric(12, 2), default=0.00)
    tax = Column(Numeric(12, 2), default=0.00)
    total_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    payment_status = Column(String(50), default="unknown") # paid, unpaid, pending, unknown
    
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    raw_text = Column(Text, nullable=True)
    extraction_method = Column(String(50), default="heuristic_fallback") # ollama, heuristic_fallback, manual
    
    is_duplicate = Column(Boolean, default=False)
    duplicate_of_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    category = relationship("Category", lazy="joined")
    line_items = relationship("DocumentLineItem", back_populates="document", cascade="all, delete-orphan", lazy="joined")
    transactions = relationship("Transaction", back_populates="document")


class DocumentLineItem(Base):
    __tablename__ = "document_line_items"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    description = Column(String(500), nullable=False)
    quantity = Column(Numeric(10, 2), default=1.00)
    unit_price = Column(Numeric(12, 2), default=0.00)
    total = Column(Numeric(12, 2), default=0.00)

    document = relationship("Document", back_populates="line_items")
