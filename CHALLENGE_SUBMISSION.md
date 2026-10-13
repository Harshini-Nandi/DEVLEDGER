# Open-Source AI Building Challenge Submission: "Side Hustle"

## 1. Project Information
* **Project Name**: OpenLedger AI
* **Tagline**: Your Private AI Finance Assistant — 100% Local Inference, Zero Data Leakage.
* **Category / Theme**: Side Hustle
* **Repository Root**: `c:\Users\Harshini\Downloads\OpenLedger`

---

## 2. The Real Problem Being Solved
Freelancers, gig workers, and side-hustle business owners face severe administrative friction:
1. **Time Sink**: Logging receipts, reading invoice dates, matching line items, and categorizing business deductions consumes 5–10 hours per month.
2. **The Cloud Privacy Dilemma**: Accounting SaaS platforms transmit confidential invoices, client names, hourly rates, and tax identifiers to third-party multi-tenant cloud databases where privacy cannot be guaranteed.
3. **The Closed AI API Tax**: Paid proprietary LLMs (OpenAI, Claude) charge \$0.02 to \$0.06 per document scan. For a side hustle processing dozens of monthly receipts, recurring per-token fees silently destroy profit margins.
4. **Hallucination Risks in Financial Ledgers**: Probabilistic models cannot be trusted with raw arithmetic. Calculating tax percentages and month-over-month trends requires mathematical certainty, not language model approximations.

---

## 3. Who Would Pay for It?
* **Independent Contractors & Freelancers**: Willing to pay \$9–\$19/month for automated, friction-free receipt and invoice data entry that requires zero manual spreadsheet work.
* **Side Hustle Agency Owners**: Micro-agencies needing professional month-over-month trend analysis and printable financial statements without paying \$50+/seat for enterprise accounting software.
* **Privacy-First Professionals & Solopreneurs**: Lawyers, accountants, and security-conscious operators who are contractually forbidden from uploading client invoices to third-party AI cloud vendors.

---

## 4. What the Application Does
1. **Optical Document Ingestion**: Ingests PDF invoices and mobile receipt captures (PNG, JPG, JPEG) via drag-and-drop.
2. **Local Text Extraction**: Uses PyMuPDF and Tesseract OCR to read digital text layers and raster image receipts.
3. **Structured Open-Weight Extraction**: Queries local Ollama models (such as Llama 3.2 or Qwen 2.5) with strict JSON output schemas to automatically extract:
   * Document Type (invoice vs. receipt)
   * Vendor / Merchant Name
   * Invoice / Receipt Number
   * Invoice Date & Due Date
   * Subtotal, Tax, and Total Amount
   * Payment Status (Paid, Unpaid, Pending)
   * Expense Category
   * Extracted Line Items
4. **Cryptographic Duplicate Shield**: Computes SHA-256 hashes on upload to instantly flag duplicate receipts before they create duplicate expenses.
5. **Deterministic Python Decimal Math Engine**: Completely separates natural language reasoning from arithmetic. All subtotals, tax sums, cash flow, and trend percentages are computed via Python's `decimal.Decimal` module.
6. **Local AI Financial Assistant Workspace**: A dedicated analysis workspace allowing natural-language queries (e.g. *"What are my top three expense categories?"*, *"Which invoices are still unpaid?"*) grounded in verified SQLite records.
7. **Comprehensive Financial Reporting**: Interactive Recharts visualizations, monthly trend graphs, category donut charts, RFC 4180 CSV exports, and downloadable printable HTML financial statements.
8. **Onboarding & Realistic Demo Sandbox**: New users can explore realistic freelance side-hustle records with a single click, or easily wipe records for complete privacy.

---

## 5. Open-Weight Models & Open-Source Stack
* **Open-Weight Models Supported**:
  * **Meta Llama 3.2 (1B & 3B)**: Recommended default for ultra-fast, local structured JSON extraction.
  * **Qwen 2.5 (3B & 7B)**: Outstanding multilingual and reasoning performance.
  * **Mistral 7B**: High-capacity instruction model for nuanced financial analysis.
* **Inference Runtime**: **Ollama** running locally on `http://127.0.0.1:11434`.
* **Backend**: FastAPI, Python 3.13, Pydantic v2, SQLAlchemy 2.0, SQLite.
* **Document Processing**: PyMuPDF (`pymupdf`), Pillow (`PIL`), Tesseract OCR (`pytesseract`).
* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, React Router v7.

---

## 6. Why Open Innovation Matters
* **Zero Vendor Lock-In**: Users are not tied to a single tech giant's pricing whims or terms of service.
* **Perpetual Operational Longevity**: If a proprietary AI provider shuts down or changes its API, OpenLedger AI continues functioning on local hardware without disruption.
* **Democratization**: High-fidelity AI financial document processing is accessible to anyone with a laptop, leveling the playing field for side-hustlers globally.

---

## 7. How the Local-First Design Improves Privacy
* **Local Loopback Communication**: All inference calls are sent to `127.0.0.1:11434`. No external network requests are made.
* **Local Storage Isolation**: SQLite databases and raw PDF files reside strictly on the user's disk (`./openledger.db` and `./uploads`).
* **Zero Telemetry**: The application contains no tracking beacons, third-party cookies, Google Analytics, or remote fonts.
* **Right to Erasure**: Complete one-click data wipe removes all database records and file artifacts immediately upon user confirmation.

---

## 8. Reducing Dependence on Paid APIs
* Proprietary closed APIs charge on every single token sent and received. Over 500 documents per month, this costs \$15–\$30 in pure API fees.
* With local Ollama open-weight inference, the per-document marginal cost is **\$0.00**. You utilize compute power you already own.

---

## 9. Honest Limitations & Trade-Offs
* **Hardware Requirements**: Local models require at least 8 GB of RAM and a modern quad-core CPU. Very low-power devices (e.g. basic Chromebooks) will experience latency during model execution.
* **Severely Degraded Physical Receipts**: While digital PDF invoices parse with 100% precision, badly crumpled or blurry paper receipts with faint thermal printer ink can challenge local OCR engines compared to massive multi-billion parameter cloud vision models.
* **Model Warmup**: On initial query, loading the open-weight model weights into RAM/VRAM takes 1–3 seconds, whereas subsequent queries execute in hundreds of milliseconds.

---

## 10. Product Demonstration Plan (Step-by-Step)

1. **Step 1: Launch Backend and Frontend**:
   * Run FastAPI backend on port 8000: `python -m uvicorn app.main:app --port 8000 --reload`
   * Run React frontend on port 5173: `npm run dev`
   * Access dashboard at `http://localhost:5173`.
2. **Step 2: Explore Empty State & Load Demo Data**:
   * Observe the clean, zero-fabricated onboarding dashboard.
   * Click **"Load Realistic Demo Data"** to immediately populate 15 realistic side-hustle records across AWS hosting, WeWork day passes, consulting client retainers, and equipment purchases.
3. **Step 3: Document Upload & Automatic Extraction**:
   * Click **"Upload Document"** and drag `sample_data/sample_freelance_invoice.pdf`.
   * Watch local PyMuPDF extract the text and local AI extract the vendor (*ACME Consulting Services LLC*), subtotal (\$3,350.00), tax (\$0.00), total (\$3,350.00), and line items.
   * Review fields in the inline modal, make any quick adjustments, and click **"Save Document"** or **"Record as Transaction"**.
4. **Step 4: Cryptographic Duplicate Detection**:
   * Upload the same PDF again.
   * Observe the instant **"Potential Duplicate Document Detected!"** amber alert triggered by the SHA-256 fingerprint.
5. **Step 5: Test Grounded AI Finance Assistant**:
   * Navigate to **AI Finance Assistant**.
   * Click the prompt: *"How much did I spend this month?"* or *"Which invoices are still unpaid?"*.
   * Observe the verified response quoting the exact database figures with zero hallucination.
6. **Step 6: Financial Analytics & Export**:
   * Open **Analytics & Reports** to inspect the interactive cash flow bar chart, category donut breakdown, and top vendors.
   * Click **"Printable Summary Report"** to view the clean, printable financial statement.
7. **Step 7: Privacy & One-Click Storage Purge**:
   * Navigate to **Privacy & Security**.
   * Review the local storage fingerprint and click **"Wipe Local Financial Data"** to verify complete data erasure.
