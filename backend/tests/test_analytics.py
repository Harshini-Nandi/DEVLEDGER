from decimal import Decimal

def test_dashboard_empty_state_detection(client):
    """Empty database reports has_real_data=False."""
    res = client.get("/api/analytics/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert data["has_real_data"] is False
    assert data["total_expenses_month"] == "0.00"
    assert data["total_income_month"] == "0.00"
    assert data["pending_invoices_count"] == 0

def test_demo_data_loading_and_clearing(client):
    """Test loading realistic demo dataset and clearing it completely."""
    # 1. Load demo data
    load_res = client.post("/api/settings/demo/load")
    assert load_res.status_code == 200

    # 2. Verify dashboard now has real data
    dash_res = client.get("/api/analytics/dashboard")
    assert dash_res.status_code == 200
    data = dash_res.json()
    assert data["has_real_data"] is True
    assert data["documents_processed_count"] > 0
    assert data["pending_invoices_count"] > 0

    # 3. Test trends
    trends_res = client.get("/api/analytics/trends?months=6")
    assert trends_res.status_code == 200
    assert len(trends_res.json()) == 6

    # 4. Test categories
    cats_res = client.get("/api/analytics/categories")
    assert cats_res.status_code == 200
    assert len(cats_res.json()) > 0

    # 5. Clear all data
    clear_res = client.post("/api/settings/demo/clear")
    assert clear_res.status_code == 200

    # 6. Verify back to empty state
    empty_dash = client.get("/api/analytics/dashboard")
    assert empty_dash.json()["has_real_data"] is False
    assert empty_dash.json()["documents_processed_count"] == 0
