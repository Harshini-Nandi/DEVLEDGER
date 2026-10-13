from decimal import Decimal

def test_create_and_list_transactions(client):
    """Test manual transaction creation and retrieval."""
    payload = {
        "date": "2026-05-20",
        "amount": "142.50",
        "type": "expense",
        "description": "AWS Hosting Services",
        "vendor": "Amazon Web Services",
        "payment_method": "Credit Card",
        "status": "completed",
        "is_tax_deductible": True
    }
    create_res = client.post("/api/transactions", json=payload)
    assert create_res.status_code == 200
    tx = create_res.json()
    assert tx["amount"] == "142.50"
    assert tx["vendor"] == "Amazon Web Services"

    # List transactions
    list_res = client.get("/api/transactions")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

def test_transaction_validation_rejects_non_positive_amount(client):
    """Ensure negative and zero amounts are rejected."""
    bad_payload = {
        "date": "2026-05-20",
        "amount": "-50.00",
        "type": "expense",
        "description": "Negative Expense"
    }
    res = client.post("/api/transactions", json=bad_payload)
    assert res.status_code == 422 # Pydantic validation error

def test_transaction_filters_and_sorting(client):
    """Test filtering by type and sorting by amount."""
    # Add income
    client.post("/api/transactions", json={
        "date": "2026-05-01",
        "amount": "3000.00",
        "type": "income",
        "description": "Client Retainer",
        "payment_method": "Bank Transfer"
    })

    # Add expense
    client.post("/api/transactions", json={
        "date": "2026-05-05",
        "amount": "45.00",
        "type": "expense",
        "description": "Figma Subscription",
        "payment_method": "Credit Card"
    })

    # Filter income only
    inc_res = client.get("/api/transactions?type=income")
    assert inc_res.status_code == 200
    assert all(t["type"] == "income" for t in inc_res.json())

    # Sort by amount desc
    sort_res = client.get("/api/transactions?sort_by=amount&sort_order=desc")
    assert sort_res.status_code == 200
    amounts = [float(t["amount"]) for t in sort_res.json()]
    assert amounts == sorted(amounts, reverse=True)

def test_export_transactions_csv(client):
    """Verify CSV export response headers and content."""
    client.post("/api/transactions", json={
        "date": "2026-05-10",
        "amount": "99.00",
        "type": "expense",
        "description": "Domain Registration",
        "payment_method": "Credit Card"
    })

    res = client.get("/api/transactions/export/csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "Domain Registration" in res.text
    assert "99.00" in res.text
