import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.settings import UserProfile, AppSetting
from app.models.document import Document
from app.models.transaction import Transaction
from app.schemas.settings import UserProfileSchema, StorageInfo, PrivacyInfo
from app.services.demo_data_service import load_demo_data, clear_all_data
from app.core.config import settings

router = APIRouter(prefix="/api/settings", tags=["Settings"])

def format_bytes(size: int) -> str:
    """Format bytes into readable KB/MB."""
    if size < 1024:
        return f"{size} B"
    elif size < 1024 * 1024:
        return f"{size / 1024:.1f} KB"
    else:
        return f"{size / (1024 * 1024):.2f} MB"

@router.get("/profile", response_model=UserProfileSchema)
def get_user_profile(db: Session = Depends(get_db)):
    """Retrieve current user profile."""
    profile = db.query(UserProfile).first()
    if not profile:
        profile = UserProfile(
            name="Alex Mercer",
            business_name="Mercer Digital Consulting",
            email="alex@openledger.local",
            default_currency="USD"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/profile", response_model=UserProfileSchema)
def update_user_profile(payload: UserProfileSchema, db: Session = Depends(get_db)):
    """Update user profile."""
    profile = db.query(UserProfile).first()
    if not profile:
        profile = UserProfile(**payload.model_dump())
        db.add(profile)
    else:
        profile.name = payload.name
        profile.business_name = payload.business_name
        profile.email = payload.email
        profile.default_currency = payload.default_currency
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/storage", response_model=StorageInfo)
def get_storage_info(db: Session = Depends(get_db)):
    """Calculates local disk and database storage usage."""
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    db_size = os.path.getsize(db_path) if os.path.exists(db_path) else 0

    uploads_size = 0
    if os.path.exists(settings.UPLOAD_DIR):
        for root, _, files in os.walk(settings.UPLOAD_DIR):
            for f in files:
                fp = os.path.join(root, f)
                if os.path.exists(fp):
                    uploads_size += os.path.getsize(fp)

    docs_count = db.query(Document).count()
    tx_count = db.query(Transaction).count()

    return StorageInfo(
        database_size_bytes=db_size,
        database_size_formatted=format_bytes(db_size),
        documents_count=docs_count,
        transactions_count=tx_count,
        uploads_size_bytes=uploads_size,
        uploads_size_formatted=format_bytes(uploads_size),
        database_path=db_path,
        uploads_path=settings.UPLOAD_DIR
    )

@router.get("/privacy", response_model=PrivacyInfo)
def get_privacy_info():
    """Returns local privacy policy details and zero-telemetry guarantee."""
    return PrivacyInfo(
        is_fully_local=True,
        remote_apis_used=0,
        telemetry_enabled=False,
        third_party_cookies=False,
        model_host=settings.OLLAMA_BASE_URL,
        local_storage_engine="SQLite"
    )

@router.post("/demo/load")
def trigger_load_demo_data(db: Session = Depends(get_db)):
    """Explicitly populates realistic demo records upon user request."""
    return load_demo_data(db)

@router.post("/demo/clear")
def trigger_clear_all_data(db: Session = Depends(get_db)):
    """Wipes all documents and transactions for complete user privacy reset."""
    return clear_all_data(db)
