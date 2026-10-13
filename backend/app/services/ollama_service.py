import json
import time
from typing import Dict, Any, List, Optional
import httpx
from decimal import Decimal
from app.core.config import settings
from app.schemas.document import DocumentExtractedData, DocumentLineItemSchema
from app.schemas.ai import OllamaStatusResponse
from app.services.fallback_extractor import extract_fallback_fields, clean_decimal

DOCUMENT_EXTRACTION_SYSTEM_PROMPT = """You are an expert financial document data extraction engine.
Analyze the raw text extracted from an invoice or receipt and extract the structured financial data.
Return ONLY a valid JSON object matching the requested schema. Do not add markdown backticks or commentary.

JSON Schema:
{
  "document_type": "invoice" | "receipt" | "bill" | "other",
  "vendor": string | null,
  "invoice_number": string | null,
  "invoice_date": "YYYY-MM-DD" | null,
  "due_date": "YYYY-MM-DD" | null,
  "currency": "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "INR" | string,
  "subtotal": number | null,
  "tax": number | null,
  "total_amount": number,
  "payment_status": "paid" | "unpaid" | "pending" | "unknown",
  "category_name": "Software & Subscriptions" | "Travel" | "Food & Meals" | "Office Supplies" | "Utilities" | "Marketing" | "Equipment" | "Professional Services" | "Other",
  "line_items": [
    {
      "description": string,
      "quantity": number,
      "unit_price": number,
      "total": number
    }
  ],
  "notes": string | null
}
"""

class OllamaService:
    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT_SECONDS

    async def check_status(self) -> OllamaStatusResponse:
        """Check if local Ollama daemon is reachable and which models are installed."""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    
                    # Also try to fetch version
                    version = None
                    try:
                        v_res = await client.get(f"{self.base_url}/api/version")
                        if v_res.status_code == 200:
                            version = v_res.json().get("version")
                    except Exception:
                        pass

                    return OllamaStatusResponse(
                        is_connected=True,
                        host=self.base_url,
                        current_model=self.model,
                        available_models=models,
                        version=version,
                        error_message=None,
                        instructions="Ollama is connected and running locally. Private on-device inference is active."
                    )
        except Exception as e:
            return OllamaStatusResponse(
                is_connected=False,
                host=self.base_url,
                current_model=self.model,
                available_models=[],
                version=None,
                error_message=f"Could not connect to Ollama at {self.base_url}: {str(e)}",
                instructions="To enable local AI inference, download Ollama from https://ollama.com and run `ollama run llama3.2` in PowerShell. The app seamlessly uses the local deterministic engine as a fallback."
            )

    async def extract_document_fields(self, raw_text: str) -> DocumentExtractedData:
        """
        Extract structured fields from raw invoice/receipt text using local Ollama model.
        Falls back to deterministic heuristic extractor if Ollama is offline or output is invalid.
        """
        if not raw_text or len(raw_text.strip()) < 10:
            return extract_fallback_fields(raw_text or "")

        status = await self.check_status()
        if not status.is_connected:
            # Fallback to local heuristic parser
            extracted = extract_fallback_fields(raw_text)
            extracted.extraction_method = "heuristic_fallback (Ollama offline)"
            return extracted

        # Prepare prompt for Ollama
        prompt = f"Extract structured invoice/receipt data from the following text:\n\n{raw_text[:3500]}"

        try:
            async with httpx.AsyncClient(timeout=float(self.timeout)) as client:
                payload = {
                    "model": self.model,
                    "prompt": prompt,
                    "system": DOCUMENT_EXTRACTION_SYSTEM_PROMPT,
                    "format": "json",
                    "stream": False,
                    "options": {
                        "temperature": 0.1, # low temperature for deterministic structured extraction
                    }
                }
                res = await client.post(f"{self.base_url}/api/generate", json=payload)
                if res.status_code == 200:
                    response_json = res.json()
                    response_text = response_json.get("response", "{}")
                    parsed = json.loads(response_text)

                    # Build line items
                    items = []
                    for item in parsed.get("line_items", []):
                        items.append(
                            DocumentLineItemSchema(
                                description=item.get("description", "Item"),
                                quantity=clean_decimal(str(item.get("quantity", 1))),
                                unit_price=clean_decimal(str(item.get("unit_price", 0))),
                                total=clean_decimal(str(item.get("total", 0))),
                            )
                        )

                    return DocumentExtractedData(
                        document_type=parsed.get("document_type", "invoice"),
                        vendor=parsed.get("vendor"),
                        invoice_number=parsed.get("invoice_number"),
                        invoice_date=parsed.get("invoice_date"),
                        due_date=parsed.get("due_date"),
                        currency=parsed.get("currency", "USD"),
                        subtotal=clean_decimal(str(parsed.get("subtotal", 0))),
                        tax=clean_decimal(str(parsed.get("tax", 0))),
                        total_amount=clean_decimal(str(parsed.get("total_amount", 0))),
                        payment_status=parsed.get("payment_status", "unknown"),
                        category_name=parsed.get("category_name", "Other"),
                        line_items=items,
                        extraction_method=f"ollama:{self.model}",
                        notes=parsed.get("notes"),
                        raw_text=raw_text[:4000]
                    )
        except Exception as e:
            print(f"Ollama extraction failed: {e}. Using heuristic fallback.")

        extracted = extract_fallback_fields(raw_text)
        extracted.extraction_method = "heuristic_fallback"
        return extracted

    async def answer_financial_query(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Answers user's financial question using local Ollama model fed with factual SQLite data.
        If Ollama is offline, generates a deterministic analysis response directly from the data.
        """
        start_time = time.time()
        status = await self.check_status()

        # Build context summary string
        summary = context.get("summary", {})
        top_categories = context.get("top_categories", [])
        recent_txs = context.get("recent_transactions", [])
        unpaid_invoices = context.get("unpaid_invoices", [])
        duplicates = context.get("duplicates", [])

        context_str = f"""
FACTUAL FINANCIAL METRICS (Calculated accurately via SQLite & Decimal arithmetic):
- Current Month Total Expenses: ${summary.get('total_expenses_month', '0.00')}
- Current Month Total Income: ${summary.get('total_income_month', '0.00')}
- Current Month Net Cash Flow: ${summary.get('net_cashflow_month', '0.00')}
- Pending / Unpaid Invoices: {summary.get('pending_invoices_count', 0)} total amounting to ${summary.get('pending_invoices_total', '0.00')}
- Documents Processed: {summary.get('documents_processed_count', 0)}
- Potential Duplicate Documents: {summary.get('potential_duplicates_count', 0)}
- Expense Change vs Previous Month: {summary.get('expense_change_percentage', '0.00')}%

TOP EXPENSE CATEGORIES:
{json.dumps(top_categories, indent=2)}

UNPAID INVOICES DETAILS:
{json.dumps(unpaid_invoices, indent=2)}

POTENTIAL DUPLICATES DETECTED:
{json.dumps(duplicates, indent=2)}

RECENT SAMPLE TRANSACTIONS:
{json.dumps(recent_txs[:8], indent=2)}
"""

        if status.is_connected:
            system_prompt = """You are OpenLedger AI, a private financial intelligence assistant running entirely on the user's local device.
You have access to verified financial facts calculated deterministically by SQLite and Python's Decimal engine.

CRITICAL INSTRUCTIONS:
1. Always quote the EXACT factual numbers provided in the context. Never fabricate or invent transactions, totals, or dates.
2. If the user asks a question where the data is insufficient, clearly state that there is insufficient data.
3. Distinguish confirmed facts (e.g. recorded expenses) from estimates or pending amounts.
4. Provide structured, executive-level financial insights with clear bullet points.
5. Emphasize that all computations and data remain 100% private on this machine.
"""
            user_prompt = f"{context_str}\n\nUSER QUESTION: {query}\n\nProvide a concise, direct, and well-structured answer:"

            try:
                async with httpx.AsyncClient(timeout=float(self.timeout)) as client:
                    payload = {
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "stream": False,
                        "options": {
                            "temperature": 0.2
                        }
                    }
                    res = await client.post(f"{self.base_url}/api/chat", json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        answer_text = data.get("message", {}).get("content", "")
                        elapsed = round(time.time() - start_time, 2)
                        return {
                            "answer": answer_text,
                            "retrieved_facts": summary,
                            "source_documents": unpaid_invoices if "unpaid" in query.lower() or "invoice" in query.lower() else recent_txs[:5],
                            "model_used": f"ollama/{self.model}",
                            "is_ollama_connected": True,
                            "execution_time_ms": elapsed * 1000,
                            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
                        }
            except Exception as e:
                print(f"Ollama chat error: {e}")

        # Deterministic rule-based response when Ollama is offline or unavailable
        answer_text = self._generate_deterministic_financial_response(query, context)
        elapsed = round(time.time() - start_time, 2)
        return {
            "answer": answer_text,
            "retrieved_facts": summary,
            "source_documents": unpaid_invoices if "unpaid" in query.lower() or "invoice" in query.lower() else recent_txs[:5],
            "model_used": "OpenLedger Local Financial Analysis Engine (Deterministic Fallback)",
            "is_ollama_connected": False,
            "execution_time_ms": elapsed * 1000,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }

    def _generate_deterministic_financial_response(self, query: str, context: Dict[str, Any]) -> str:
        """Generates an accurate, grounded markdown analysis directly from SQLite figures when Ollama is not running."""
        q = query.lower()
        summary = context.get("summary", {})
        top_cats = context.get("top_categories", [])
        unpaid = context.get("unpaid_invoices", [])
        duplicates = context.get("duplicates", [])

        exp = summary.get("total_expenses_month", "0.00")
        inc = summary.get("total_income_month", "0.00")
        net = summary.get("net_cashflow_month", "0.00")
        mom = summary.get("expense_change_percentage", "0.00")

        header = "> [!NOTE]\n> **Local Deterministic Financial Engine**: Calculated with 100% precision from your local SQLite database records using Decimal arithmetic. (Ollama is currently offline).\n\n"

        if "spend this month" in q or "expenses this month" in q or "how much did i spend" in q:
            ans = f"### 📊 Current Month Spending Summary\n\n"
            ans += f"- **Total Expenses Recorded**: **${exp}**\n"
            ans += f"- **Total Income Recorded**: **${inc}**\n"
            ans += f"- **Net Cash Flow**: **${net}**\n"
            ans += f"- **Month-over-Month Change**: {mom}% vs previous month\n\n"
            if top_cats:
                ans += "#### Top Spending Categories This Month:\n"
                for idx, c in enumerate(top_cats[:3], 1):
                    ans += f"{idx}. **{c['category_name']}**: ${c['total_amount']} ({c['percentage']}% of expenses)\n"
            return header + ans

        elif "top" in q and "category" in q:
            ans = f"### 🏆 Top Expense Categories\n\n"
            if not top_cats:
                ans += "There are no recorded expense transactions yet to compute top categories.\n"
            else:
                for idx, c in enumerate(top_cats[:3], 1):
                    ans += f"{idx}. **{c['category_name']}**: **${c['total_amount']}** ({c['percentage']}% of total expenses, {c['transaction_count']} transactions)\n"
                ans += f"\n*Total combined expenses tracked across these categories: ${exp}*"
            return header + ans

        elif "unpaid" in q or "pending invoice" in q or "due" in q:
            count = summary.get("pending_invoices_count", 0)
            total = summary.get("pending_invoices_total", "0.00")
            ans = f"### 📑 Unpaid & Pending Invoices\n\n"
            ans += f"You have **{count}** pending/unpaid invoices totaling **${total}**.\n\n"
            if unpaid:
                ans += "| Vendor | Invoice # | Due Date | Total Amount | Status |\n"
                ans += "| :--- | :--- | :--- | :--- | :--- |\n"
                for inv in unpaid:
                    ans += f"| **{inv.get('vendor', 'Unknown')}** | {inv.get('invoice_number', 'N/A')} | {inv.get('due_date', 'N/A')} | **${inv.get('total_amount', '0.00')} {inv.get('currency', 'USD')}** | Pending |\n"
            else:
                ans += "✅ All invoices have been marked as paid or no unpaid invoices were found in your records.\n"
            return header + ans

        elif "duplicate" in q or "possible duplicate" in q:
            dup_count = summary.get("potential_duplicates_count", 0)
            ans = f"### ⚠️ Duplicate Document Detection\n\n"
            if dup_count == 0:
                ans += "✅ **No duplicate receipts or invoices detected.** Every uploaded document has a unique cryptographic SHA-256 hash and unique vendor/amount fingerprint.\n"
            else:
                ans += f"Found **{dup_count}** possible duplicate document(s) uploaded to the system:\n\n"
                for d in duplicates:
                    ans += f"- **{d.get('filename')}** (Vendor: *{d.get('vendor')}*, Amount: *${d.get('total_amount')}*)\n"
                ans += "\n> [!TIP]\n> Review these documents in the **Documents** section to prevent recording double expenses."
            return header + ans

        elif "software" in q or "quarter" in q:
            soft_cat = next((c for c in top_cats if "software" in c["category_name"].lower()), None)
            ans = f"### 💻 Software & Subscriptions Analysis\n\n"
            if soft_cat:
                ans += f"- **Software & Subscriptions**: **${soft_cat['total_amount']}** recorded ({soft_cat['percentage']}% of expenses, {soft_cat['transaction_count']} transactions).\n"
            else:
                ans += "No transactions specifically categorized under 'Software & Subscriptions' found in the selected period.\n"
            return header + ans

        elif "increase" in q or "compared" in q or "trend" in q:
            ans = f"### 📈 Month-over-Month Trend Analysis\n\n"
            ans += f"- **Current Month Expenses**: **${exp}**\n"
            ans += f"- **Expense Trend**: {mom}% compared with the prior month.\n"
            ans += f"- **Current Net Cashflow**: **${net}**\n\n"
            if float(mom) > 0:
                ans += f"⚠️ Spending increased by **{mom}%** this month. Review your top categories to identify cost drivers."
            else:
                ans += f"✅ Spending decreased by **{abs(float(mom))}%** compared to last month. Great job managing overhead!"
            return header + ans

        else:
            ans = f"### 💡 Financial Overview\n\n"
            ans += f"- **Monthly Expenses**: **${exp}**\n"
            ans += f"- **Monthly Income**: **${inc}**\n"
            ans += f"- **Net Balance**: **${net}**\n"
            ans += f"- **Pending Invoices**: {summary.get('pending_invoices_count', 0)} (${summary.get('pending_invoices_total', '0.00')})\n"
            ans += f"- **Documents Stored**: {summary.get('documents_processed_count', 0)}\n\n"
            ans += "To activate conversational natural-language querying, ensure Ollama is running (`ollama run llama3.2`). The deterministic mathematical engine will remain available at all times."
            return header + ans

ollama_service = OllamaService()
