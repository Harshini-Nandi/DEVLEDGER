import pytest
from unittest.mock import AsyncMock, patch
from app.services.ollama_service import ollama_service

def test_ai_status_endpoint_offline_graceful_handling(client):
    """When Ollama daemon is offline, returns status without raising internal server error."""
    res = client.get("/api/ai/status")
    assert res.status_code == 200
    data = res.json()
    assert "host" in data
    assert "current_model" in data
    assert "instructions" in data

def test_ai_query_deterministic_grounding(client):
    """Querying AI assistant returns factual figures derived from local database."""
    # Load demo data first
    client.post("/api/settings/demo/load")

    # Ask spending question
    res = client.post("/api/ai/query", json={"query": "How much did I spend this month?"})
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert "retrieved_facts" in data
    assert data["retrieved_facts"]["has_real_data"] is True
    # The answer should mention spending and the factually retrieved metrics
    assert "Spending Summary" in data["answer"] or "Expenses" in data["answer"]

    # Ask unpaid invoices question
    unpaid_res = client.post("/api/ai/query", json={"query": "Which invoices are still unpaid?"})
    assert unpaid_res.status_code == 200
    unpaid_data = unpaid_res.json()
    assert "unpaid" in unpaid_data["answer"].lower() or "invoices" in unpaid_data["answer"].lower()

@pytest.mark.asyncio
async def test_mock_ollama_online_response():
    """Verify structured response handling when Ollama is online."""
    mock_tags_response = {"models": [{"name": "llama3.2"}, {"name": "mistral"}]}
    
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json = lambda: mock_tags_response
        mock_get.return_value = mock_response

        status = await ollama_service.check_status()
        assert status.is_connected is True
        assert "llama3.2" in status.available_models
