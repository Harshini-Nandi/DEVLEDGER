import io
import hashlib
from decimal import Decimal
from app.services.fallback_extractor import extract_fallback_fields
from app.services.document_extractor import calculate_sha256, sanitize_filename

def test_sanitize_filename():
    """Ensure path traversal and dangerous characters are stripped."""
    assert sanitize_filename("../../../etc/passwd") == "passwd"
    assert sanitize_filename("..\\windows\\system32.dll") == "system32.dll"
    assert sanitize_filename("receipt *# 2026.pdf") == "receipt____2026.pdf"

def test_calculate_sha256():
    """Verify SHA-256 calculation for cryptographic duplicate detection."""
    content = b"Amazon Web Services Invoice Sample 123"
    expected = hashlib.sha256(content).hexdigest()
    assert calculate_sha256(content) == expected

def test_fallback_extractor_heuristic():
    """Verify deterministic fallback parser extracts invoice data without Ollama."""
    sample_text = """
    Amazon Web Services, Inc.
    INVOICE #INV-AWS-88219
    Date: 2026-05-15
    Due Date: 2026-06-15
    Description Qty Amount
    EC2 Cloud Compute Instances 1 120.00
    Subtotal: $120.00
    Tax: $12.00
    Total Amount: $132.00
    Status: Paid in full
    """
    data = extract_fallback_fields(sample_text)
    assert data.document_type == "invoice"
    assert "Amazon" in (data.vendor or "")
    assert data.invoice_number == "INV-AWS-88219"
    assert data.total_amount == Decimal("132.00")
    assert data.subtotal == Decimal("120.00")
    assert data.tax == Decimal("12.00")
    assert data.payment_status == "paid"
    assert data.category_name == "Software & Subscriptions"

def test_upload_document_flow(client):
    """Test full document upload endpoint."""
    pdf_content = b"%PDF-1.4 Mock Invoice Content for Testing"
    file = io.BytesIO(pdf_content)
    
    response = client.post(
        "/api/documents/upload",
        files={"file": ("test_invoice.pdf", file, "application/pdf")}
    )
    assert response.status_code == 200
    doc = response.json()
    assert doc["original_filename"] == "test_invoice.pdf"
    assert doc["is_duplicate"] is False
    assert doc["status"] == "processed"

    doc_id = doc["id"]

    # Test duplicate detection by uploading the exact same bytes again
    file2 = io.BytesIO(pdf_content)
    dup_res = client.post(
        "/api/documents/upload",
        files={"file": ("test_invoice_copy.pdf", file2, "application/pdf")}
    )
    assert dup_res.status_code == 200
    dup_doc = dup_res.json()
    assert dup_doc["is_duplicate"] is True
    assert dup_doc["duplicate_of_id"] == doc_id
    assert dup_doc["status"] == "duplicate_warning"

def test_document_crud_and_transaction_conversion(client):
    """Test document update, transaction conversion, and deletion."""
    # 1. Upload
    pdf_content = b"%PDF-1.4 Mock Receipt"
    res = client.post(
        "/api/documents/upload",
        files={"file": ("coffee_receipt.pdf", io.BytesIO(pdf_content), "application/pdf")}
    )
    doc_id = res.json()["id"]

    # 2. Update fields
    up_res = client.put(
        f"/api/documents/{doc_id}",
        json={
            "vendor": "Blue Bottle Coffee",
            "total_amount": "14.50",
            "payment_status": "paid"
        }
    )
    assert up_res.status_code == 200
    assert up_res.json()["vendor"] == "Blue Bottle Coffee"
    assert up_res.json()["total_amount"] == "14.50"

    # 3. Convert to transaction
    tx_conv_res = client.post(f"/api/documents/{doc_id}/create-transaction")
    assert tx_conv_res.status_code == 200
    tx_id = tx_conv_res.json()["transaction_id"]

    # Check transaction exists
    tx_res = client.get(f"/api/transactions/{tx_id}")
    assert tx_res.status_code == 200
    assert tx_res.json()["amount"] == "14.50"
    assert tx_res.json()["document_id"] == doc_id

    # 4. Delete document
    del_res = client.delete(f"/api/documents/{doc_id}")
    assert del_res.status_code == 200

    # 5. Check 404
    get_res = client.get(f"/api/documents/{doc_id}")
    assert get_res.status_code == 404
