import os
import hashlib
from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.category import Category
from app.models.document import Document, DocumentLineItem
from app.models.transaction import Transaction
from app.core.config import settings

DEFAULT_CATEGORIES = [
    {"name": "Software & Subscriptions", "type": "expense", "icon": "Laptop", "color": "#3b82f6"},
    {"name": "Travel", "type": "expense", "icon": "Plane", "color": "#f59e0b"},
    {"name": "Food & Meals", "type": "expense", "icon": "Coffee", "color": "#ec4899"},
    {"name": "Office Supplies", "type": "expense", "icon": "Briefcase", "color": "#8b5cf6"},
    {"name": "Utilities", "type": "expense", "icon": "Zap", "color": "#06b6d4"},
    {"name": "Marketing", "type": "expense", "icon": "Megaphone", "color": "#10b981"},
    {"name": "Equipment", "type": "expense", "icon": "Monitor", "color": "#6366f1"},
    {"name": "Professional Services", "type": "expense", "icon": "ShieldCheck", "color": "#14b8a6"},
    {"name": "Client Income", "type": "income", "icon": "TrendingUp", "color": "#059669"},
    {"name": "Other", "type": "expense", "icon": "Tag", "color": "#64748b"},
]

def seed_default_categories(db: Session):
    """Seed baseline categories if none exist."""
    existing_count = db.query(Category).count()
    if existing_count == 0:
        for cat in DEFAULT_CATEGORIES:
            db.add(Category(
                name=cat["name"],
                type=cat["type"],
                icon=cat["icon"],
                color=cat["color"],
                is_custom=False
            ))
        db.commit()

def load_demo_data(db: Session):
    """Populates realistic demo financial records for freelance side-hustle evaluation."""
    seed_default_categories(db)
    
    # Check if data already exists
    if db.query(Document).count() > 0 or db.query(Transaction).count() > 0:
        return {"status": "exists", "message": "Demo data or user data already present."}

    cats = {c.name: c.id for c in db.query(Category).all()}
    today = date.today()
    d_curr = today.strftime("%Y-%m-%d")
    d_prev1 = (today - timedelta(days=15)).strftime("%Y-%m-%d")
    d_prev2 = (today - timedelta(days=32)).strftime("%Y-%m-%d")
    d_prev3 = (today - timedelta(days=60)).strftime("%Y-%m-%d")
    d_due = (today + timedelta(days=12)).strftime("%Y-%m-%d")

    # 1. Create sample documents
    doc1 = Document(
        filename="demo_aws_cloud_invoice.pdf",
        original_filename="AWS-Invoice-May2026.pdf",
        file_path="uploads/demo_aws_cloud_invoice.pdf",
        file_size=104857,
        file_hash=hashlib.sha256(b"aws_sample_hash_2026").hexdigest(),
        mime_type="application/pdf",
        status="processed",
        document_type="invoice",
        vendor="Amazon Web Services, Inc.",
        invoice_number="INV-AWS-89410",
        invoice_date=d_curr,
        due_date=d_curr,
        currency="USD",
        subtotal=Decimal("125.00"),
        tax=Decimal("17.50"),
        total_amount=Decimal("142.50"),
        payment_status="paid",
        category_id=cats.get("Software & Subscriptions"),
        raw_text="Amazon Web Services Invoice #INV-AWS-89410. Total Amount: $142.50. Subtotal: $125.00. Tax: $17.50. Paid in full.",
        extraction_method="heuristic_fallback",
        is_duplicate=False
    )
    db.add(doc1)
    db.flush()

    db.add(DocumentLineItem(document_id=doc1.id, description="EC2 Cloud Compute Instances", quantity=Decimal("1.00"), unit_price=Decimal("85.00"), total=Decimal("85.00")))
    db.add(DocumentLineItem(document_id=doc1.id, description="S3 Cloud Storage Standard", quantity=Decimal("1.00"), unit_price=Decimal("40.00"), total=Decimal("40.00")))

    # Doc 2: Unpaid Client Invoice
    doc2 = Document(
        filename="demo_client_invoice_apex.pdf",
        original_filename="ApexDesign-Milestone2-Invoice.pdf",
        file_path="uploads/demo_client_invoice_apex.pdf",
        file_size=142000,
        file_hash=hashlib.sha256(b"apex_client_invoice_hash").hexdigest(),
        mime_type="application/pdf",
        status="processed",
        document_type="invoice",
        vendor="Apex Design Studio (Client)",
        invoice_number="INV-2026-0042",
        invoice_date=d_prev1,
        due_date=d_due,
        currency="USD",
        subtotal=Decimal("2850.00"),
        tax=Decimal("0.00"),
        total_amount=Decimal("2850.00"),
        payment_status="unpaid",
        category_id=cats.get("Client Income"),
        raw_text="Invoice to Apex Design Studio. Web Platform Consulting Phase 2. Amount Due: $2,850.00. Payment Due: " + d_due,
        extraction_method="heuristic_fallback",
        is_duplicate=False
    )
    db.add(doc2)
    db.flush()

    # Doc 3: Coworking receipt
    doc3 = Document(
        filename="demo_wework_receipt.png",
        original_filename="WeWork-DayPass.png",
        file_path="uploads/demo_wework_receipt.png",
        file_size=65400,
        file_hash=hashlib.sha256(b"wework_receipt_hash").hexdigest(),
        mime_type="image/png",
        status="processed",
        document_type="receipt",
        vendor="WeWork Management LLC",
        invoice_number="WW-78219",
        invoice_date=d_prev1,
        due_date=d_prev1,
        currency="USD",
        subtotal=Decimal("45.00"),
        tax=Decimal("0.00"),
        total_amount=Decimal("45.00"),
        payment_status="paid",
        category_id=cats.get("Office Supplies"),
        raw_text="WeWork Receipt #WW-78219. Day Pass Desk. Total: $45.00. Paid via Credit Card.",
        extraction_method="heuristic_fallback",
        is_duplicate=False
    )
    db.add(doc3)
    db.flush()

    # Doc 4: Legal Advisor (Pending)
    doc4 = Document(
        filename="demo_legal_advisory.pdf",
        original_filename="Vanguard-Legal-Services.pdf",
        file_path="uploads/demo_legal_advisory.pdf",
        file_size=88900,
        file_hash=hashlib.sha256(b"vanguard_legal_hash").hexdigest(),
        mime_type="application/pdf",
        status="processed",
        document_type="invoice",
        vendor="Vanguard Legal Advisory",
        invoice_number="LEG-2026-11",
        invoice_date=d_prev1,
        due_date=d_due,
        currency="USD",
        subtotal=Decimal("450.00"),
        tax=Decimal("0.00"),
        total_amount=Decimal("450.00"),
        payment_status="pending",
        category_id=cats.get("Professional Services"),
        raw_text="Vanguard Legal Services. Contract Review & NDA drafting. Total: $450.00. Status: Pending Payment.",
        extraction_method="heuristic_fallback",
        is_duplicate=False
    )
    db.add(doc4)
    db.flush()

    # Doc 5: Duplicate Document test
    doc5_dup = Document(
        filename="demo_aws_duplicate_copy.pdf",
        original_filename="AWS-Invoice-May2026-Copy.pdf",
        file_path="uploads/demo_aws_duplicate_copy.pdf",
        file_size=104857,
        file_hash=doc1.file_hash, # identical hash!
        mime_type="application/pdf",
        status="duplicate_warning",
        document_type="invoice",
        vendor="Amazon Web Services, Inc.",
        invoice_number="INV-AWS-89410",
        invoice_date=d_curr,
        due_date=d_curr,
        currency="USD",
        subtotal=Decimal("125.00"),
        tax=Decimal("17.50"),
        total_amount=Decimal("142.50"),
        payment_status="paid",
        category_id=cats.get("Software & Subscriptions"),
        raw_text=doc1.raw_text,
        extraction_method="heuristic_fallback",
        is_duplicate=True,
        duplicate_of_id=doc1.id
    )
    db.add(doc5_dup)

    # 2. Add realistic Transactions
    tx_list = [
        # Current month expenses
        {"date": d_curr, "amount": Decimal("142.50"), "type": "expense", "desc": "AWS Cloud Services Infrastructure", "vendor": "Amazon Web Services", "cat": "Software & Subscriptions", "doc_id": doc1.id},
        {"date": d_curr, "amount": Decimal("21.00"), "type": "expense", "desc": "GitHub Copilot Monthly Subscription", "vendor": "GitHub Inc.", "cat": "Software & Subscriptions", "doc_id": None},
        {"date": d_prev1, "amount": Decimal("45.00"), "type": "expense", "desc": "WeWork Day Pass for Client Meeting", "vendor": "WeWork", "cat": "Office Supplies", "doc_id": doc3.id},
        {"date": d_prev1, "amount": Decimal("18.75"), "type": "expense", "desc": "Client Coffee & Work Discussion", "vendor": "Starbucks Reserve", "cat": "Food & Meals", "doc_id": None},
        {"date": d_prev1, "amount": Decimal("32.50"), "type": "expense", "desc": "Uber ride to Client Headquarters", "vendor": "Uber Technologies", "cat": "Travel", "doc_id": None},
        {"date": d_prev1, "amount": Decimal("75.00"), "type": "expense", "desc": "Meta Ads Campaign - Freelance Portfolio", "vendor": "Meta Platforms", "cat": "Marketing", "doc_id": None},
        
        # Current month income
        {"date": d_prev1, "amount": Decimal("3500.00"), "type": "income", "desc": "Stripe Payout - Zenith Systems Web App", "vendor": "Zenith Systems LLC", "cat": "Client Income", "doc_id": None},

        # Previous month expenses
        {"date": d_prev2, "amount": Decimal("138.20"), "type": "expense", "desc": "AWS Cloud Hosting - Prior Month", "vendor": "Amazon Web Services", "cat": "Software & Subscriptions", "doc_id": None},
        {"date": d_prev2, "amount": Decimal("45.00"), "type": "expense", "desc": "Figma Professional Team Plan", "vendor": "Figma", "cat": "Software & Subscriptions", "doc_id": None},
        {"date": d_prev2, "amount": Decimal("89.00"), "type": "expense", "desc": "Satechi USB-C Multiport Adapter", "vendor": "Apple Store", "cat": "Equipment", "doc_id": None},
        {"date": d_prev2, "amount": Decimal("120.00"), "type": "expense", "desc": "Fiber High-Speed Business Internet", "vendor": "Verizon Fios", "cat": "Utilities", "doc_id": None},
        
        # Previous month income
        {"date": d_prev2, "amount": Decimal("4200.00"), "type": "income", "desc": "Direct Deposit - Alpha Corp Retainer", "vendor": "Alpha Corp", "cat": "Client Income", "doc_id": None},

        # Two months ago
        {"date": d_prev3, "amount": Decimal("132.00"), "type": "expense", "desc": "AWS Cloud Services", "vendor": "Amazon Web Services", "cat": "Software & Subscriptions", "doc_id": None},
        {"date": d_prev3, "amount": Decimal("250.00"), "type": "expense", "desc": "Quarterly Accounting & Tax Prep", "vendor": "Vanguard Advisory", "cat": "Professional Services", "doc_id": None},
        {"date": d_prev3, "amount": Decimal("3800.00"), "type": "income", "desc": "Stripe Payout - Brand Sprint Contract", "vendor": "NorthStar Media", "cat": "Client Income", "doc_id": None},
    ]

    for tx in tx_list:
        db.add(Transaction(
            date=tx["date"],
            amount=tx["amount"],
            type=tx["type"],
            description=tx["desc"],
            vendor=tx["vendor"],
            category_id=cats.get(tx["cat"]),
            payment_method="Credit Card" if tx["type"] == "expense" else "Direct Deposit",
            status="completed",
            document_id=tx["doc_id"],
            notes="Demo record initialized for realistic evaluation."
        ))

    db.commit()
    return {"status": "success", "message": "Demo data loaded successfully."}

def clear_all_data(db: Session):
    """Safely wipes documents and transactions for complete user privacy reset."""
    # Delete line items
    db.query(DocumentLineItem).delete()
    # Delete transactions
    db.query(Transaction).delete()
    # Delete documents
    db.query(Document).delete()
    db.commit()

    # Clean uploaded files in uploads dir except gitkeep
    try:
        for f in os.listdir(settings.UPLOAD_DIR):
            f_path = os.path.join(settings.UPLOAD_DIR, f)
            if os.path.isfile(f_path) and not f.startswith("."):
                os.remove(f_path)
    except Exception as e:
        print(f"Error cleaning upload dir: {e}")

    return {"status": "success", "message": "All financial records and documents have been wiped from local storage."}
