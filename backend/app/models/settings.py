from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base

class AppSetting(Base):
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), default="Alex Mercer")
    business_name = Column(String(150), default="Mercer Digital Consulting")
    email = Column(String(150), default="alex@openledger.local")
    default_currency = Column(String(10), default="USD")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
