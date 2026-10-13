import re
from decimal import Decimal, InvalidOperation
from typing import List, Optional, Dict, Any
from app.schemas.document import DocumentExtractedData, DocumentLineItemSchema

# Category matching keywords
CATEGORY_KEYWORDS = {
    "Software & Subscriptions": ["github", "aws", "amazon web services", "figma", "openai", "slack", "google cloud", "microsoft", "adobe", "zoom", "notion", "atlassian", "jetbrains", "digitalocean", "vercel", "cloudflare", "subscription", "saas", "software", "hosting"],
    "Travel": ["uber", "lyft", "airline", "airways", "flight", "hotel", "airbnb", "marriott", "hilton", "train", "amtrak", "taxi", "transit", "rental car", "enterprise", "hertz"],
    "Food & Meals": ["coffee", "starbucks", "cafe", "restaurant", "bistro", "diner", "pizza", "grill", "bakery", "kitchen", "lunch", "dinner", "breakfast", "doordash", "ubereats", "grubhub"],
    "Office Supplies": ["staples", "office depot", "paper", "stationery", "pen", "desk supplies", "printer paper", "ink", "cartridge"],
    "Utilities": ["electric", "power", "water", "gas", "internet", "comcast", "verizon", "at&t", "telecom", "utility"],
    "Marketing": ["facebook ads", "google ads", "meta", "linkedin ads", "advertising", "marketing", "promotion", "billboard", "print flyers"],
    "Equipment": ["laptop", "monitor", "keyboard", "mouse", "headset", "apple store", "best buy", "hardware", "macbook", "camera", "chair", "desk"],
    "Professional Services": ["legal", "consulting", "accounting", "cpa", "attorney", "tax preparation", "notary", "audit"],
}

def clean_decimal(val_str: str) -> Decimal:
    """Safely parse a string into a positive Decimal with 2 decimal places."""
    try:
        cleaned = re.sub(r"[^\d.]", "", val_str)
        # handle multiple dots if any
        parts = cleaned.split(".")
        if len(parts) > 2:
            cleaned = parts[0] + "." + "".join(parts[1:])
        if not cleaned:
            return Decimal("0.00")
        dec = Decimal(cleaned)
        return dec.quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        return Decimal("0.00")

def extract_fallback_fields(text: str) -> DocumentExtractedData:
    """
    Rule-based deterministic extraction for invoices and receipts when Ollama is offline or unavailable.
    """
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    doc_type = "invoice"
    
    # 1. Determine document type
    text_lower = text.lower()
    if "receipt" in text_lower or "cash receipt" in text_lower or "sale receipt" in text_lower:
        doc_type = "receipt"
    elif "bill" in text_lower:
        doc_type = "bill"
    
    # 2. Extract Vendor Name
    vendor = None
    # Look at the first 5 non-empty lines for possible vendor
    ignored_vendor_tokens = ["invoice", "receipt", "bill to", "ship to", "date", "total", "tax", "payment", "from", "thank you", "page 1"]
    for line in lines[:6]:
        line_l = line.lower()
        if not any(token in line_l for token in ignored_vendor_tokens) and len(line) > 2:
            # strip special characters
            candidate = re.sub(r"[#*=\-_:]", "", line).strip()
            if candidate and len(candidate) < 60:
                vendor = candidate
                break
    if not vendor:
        vendor = "Unknown Vendor"

    # 3. Extract Invoice / Receipt Number
    invoice_number = None
    inv_match = re.search(r"(?:invoice|inv|receipt|bill|order|ref|ticket)[\s#.:-]*([A-Za-z0-9\-_]{3,25})", text, re.IGNORECASE)
    if inv_match:
        invoice_number = inv_match.group(1).strip()
    
    # 4. Extract Dates (Invoice Date and Due Date)
    # Match dates like 2026-05-12, 12/05/2026, May 12, 2026, 12-05-2026
    date_matches = re.findall(r"\b(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})\b", text)
    invoice_date = None
    due_date = None
    
    if date_matches:
        invoice_date = date_matches[0]
        # Look for due date specifically
        due_match = re.search(r"due\s*(?:date)?[\s.:]*(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})", text, re.IGNORECASE)
        if due_match:
            due_date = due_match.group(1).strip()
        elif len(date_matches) > 1 and date_matches[1] != invoice_date:
            due_date = date_matches[1]

    # Normalize date to YYYY-MM-DD if possible
    # We will keep raw or simple format
    
    # 5. Currency
    currency = "USD"
    if "€" in text or "eur" in text_lower:
        currency = "EUR"
    elif "£" in text or "gbp" in text_lower:
        currency = "GBP"
    elif "₹" in text or "inr" in text_lower:
        currency = "INR"
    elif "cad" in text_lower:
        currency = "CAD"
    elif "aud" in text_lower:
        currency = "AUD"

    # 6. Extract Totals, Subtotal, and Tax
    total_amount = Decimal("0.00")
    subtotal = Decimal("0.00")
    tax = Decimal("0.00")

    # Total patterns
    total_patterns = [
        r"(?:grand\s+total|total\s+amount|amount\s+due|balance\s+due|total)[\s.:$€£₹]*([\d,]+\.\d{2})",
        r"(?:total)[\s.:$€£₹]*([\d,]+)",
    ]
    for pat in total_patterns:
        m = re.findall(pat, text, re.IGNORECASE)
        if m:
            # take the last or highest match for total
            for candidate in m:
                d = clean_decimal(candidate)
                if d > total_amount:
                    total_amount = d
            break

    # Subtotal patterns
    sub_match = re.search(r"(?:subtotal|sub-total|net\s+amount)[\s.:$€£₹]*([\d,]+\.\d{2})", text, re.IGNORECASE)
    if sub_match:
        subtotal = clean_decimal(sub_match.group(1))

    # Tax patterns
    tax_match = re.search(r"(?:tax|vat|gst|sales\s+tax)[\s.:$€£₹]*([\d,]+\.\d{2})", text, re.IGNORECASE)
    if tax_match:
        tax = clean_decimal(tax_match.group(1))

    # If subtotal missing but total and tax present:
    if subtotal == Decimal("0.00") and total_amount > tax and tax > Decimal("0.00"):
        subtotal = total_amount - tax
    elif total_amount == Decimal("0.00") and subtotal > Decimal("0.00"):
        total_amount = subtotal + tax

    # 7. Payment Status
    payment_status = "unknown"
    if "paid in full" in text_lower or "paid" in text_lower or "receipt" in text_lower or "status: paid" in text_lower:
        payment_status = "paid"
    elif "unpaid" in text_lower or "past due" in text_lower or "due upon receipt" in text_lower or "payment due" in text_lower:
        payment_status = "unpaid"
    elif "pending" in text_lower:
        payment_status = "pending"

    # 8. Category identification
    category_name = "Other"
    for cat, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            category_name = cat
            break

    # 9. Extract Line Items (heuristic: lines with description and money amounts)
    line_items: List[DocumentLineItemSchema] = []
    line_item_pattern = re.compile(r"^(.{4,50}?)\s+(\d+)?\s*[\$€£₹]?\s*([\d,]+\.\d{2})$")
    for line in lines:
        if any(skip in line.lower() for skip in ["total", "subtotal", "tax", "balance", "amount due", "invoice #", "page"]):
            continue
        m = line_item_pattern.match(line)
        if m:
            desc = m.group(1).strip()
            qty = Decimal(m.group(2)) if m.group(2) else Decimal("1.00")
            item_total = clean_decimal(m.group(3))
            unit_p = (item_total / qty).quantize(Decimal("0.01")) if qty > 0 else item_total
            line_items.append(
                DocumentLineItemSchema(
                    description=desc,
                    quantity=qty,
                    unit_price=unit_p,
                    total=item_total
                )
            )

    return DocumentExtractedData(
        document_type=doc_type,
        vendor=vendor,
        invoice_number=invoice_number,
        invoice_date=invoice_date,
        due_date=due_date,
        currency=currency,
        subtotal=subtotal,
        tax=tax,
        total_amount=total_amount,
        payment_status=payment_status,
        category_name=category_name,
        line_items=line_items,
        extraction_method="heuristic_fallback",
        raw_text=text[:4000]
    )
