from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(20), nullable=False, index=True) # YYYY-MM-DD
    amount = Column(Numeric(12, 2), nullable=False)
    type = Column(String(20), default="expense", nullable=False) # 'expense' or 'income'
    description = Column(String(500), nullable=False)
    vendor = Column(String(255), index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    payment_method = Column(String(50), default="Credit Card") # Credit Card, Bank Transfer, Stripe, Cash, etc.
    status = Column(String(50), default="completed") # completed, pending, reconciled
    
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    is_tax_deductible = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    category = relationship("Category", lazy="joined")
    document = relationship("Document", back_populates="transactions")
