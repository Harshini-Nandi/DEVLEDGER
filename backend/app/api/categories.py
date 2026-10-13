from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryRead, CategoryCreate

router = APIRouter(prefix="/api/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryRead])
def list_categories(db: Session = Depends(get_db)):
    """List all categories."""
    return db.query(Category).order_by(Category.name.asc()).all()

@router.post("", response_model=CategoryRead)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    """Create a new custom category."""
    existing = db.query(Category).filter(Category.name.ilike(payload.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name already exists.")

    cat = Category(
        name=payload.name,
        type=payload.type,
        icon=payload.icon or "Tag",
        color=payload.color or "#10b981",
        is_custom=True
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.delete("/{cat_id}")
def delete_category(cat_id: int, db: Session = Depends(get_db)):
    """Delete a custom category."""
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")
    if not cat.is_custom:
        raise HTTPException(status_code=400, detail="System default categories cannot be deleted.")

    db.delete(cat)
    db.commit()
    return {"status": "success", "message": f"Category #{cat_id} deleted."}
