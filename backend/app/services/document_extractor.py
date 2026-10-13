import os
import hashlib
import re
from pathlib import Path
from typing import Tuple, Optional
import pymupdf as fitz
from PIL import Image
import pytesseract
from fastapi import UploadFile, HTTPException
from app.core.config import settings

ALLOWED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
}

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}

def sanitize_filename(filename: str) -> str:
    """Sanitize original filename to prevent path traversal and shell injection."""
    base = filename.replace("\\", "/").rstrip("/").split("/")[-1]
    clean = re.sub(r"[^A-Za-z0-9._-]", "_", base)
    return clean[:100]

def calculate_sha256(content: bytes) -> str:
    """Calculate SHA-256 hash of file bytes for duplicate detection."""
    return hashlib.sha256(content).hexdigest()

def extract_text_from_pdf(content: bytes) -> str:
    """Extract text from PDF using PyMuPDF."""
    text_chunks = []
    try:
        doc = fitz.open(stream=content, filetype="pdf")
        for page_idx in range(len(doc)):
            page = doc.load_page(page_idx)
            page_text = page.get_text("text")
            if page_text:
                text_chunks.append(page_text.strip())
        doc.close()
    except Exception as e:
        print(f"Error reading PDF with PyMuPDF: {e}")
        return ""
    
    extracted_text = "\n\n".join(text_chunks).strip()
    return extracted_text

def extract_text_from_image(file_path: str) -> Tuple[str, bool]:
    """
    Extract text from an image using PIL and Tesseract OCR.
    Returns (extracted_text, ocr_available).
    """
    try:
        img = Image.open(file_path)
        # Convert RGBA to RGB if necessary
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        text = pytesseract.image_to_string(img)
        return text.strip(), True
    except pytesseract.TesseractNotFoundError:
        # Tesseract is not installed on system PATH
        return "[Tesseract OCR binary not found on local PATH. For image OCR, please install Tesseract OCR.]", False
    except Exception as e:
        print(f"Error extracting image text: {e}")
        return f"[Image OCR processing error: {str(e)}]", False

def validate_and_process_upload(file: UploadFile, content: bytes) -> Tuple[str, str, str, str, bool]:
    """
    Validates the uploaded file, saves it securely, and extracts raw text.
    Returns:
        (saved_filename, full_file_path, file_hash, raw_text, ocr_used)
    """
    # 1. Check file size
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    # 2. Check extension & MIME
    orig_name = sanitize_filename(file.filename or "uploaded_file")
    ext = Path(orig_name).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: PDF, PNG, JPG, JPEG."
        )

    # 3. Calculate SHA-256
    file_hash = calculate_sha256(content)

    # 4. Save file to disk
    stored_filename = f"{file_hash[:16]}_{orig_name}"
    save_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

    with open(save_path, "wb") as f:
        f.write(content)

    # 5. Extract text based on type
    raw_text = ""
    ocr_used = False

    if ext == ".pdf":
        raw_text = extract_text_from_pdf(content)
        # If PDF has zero extracted text (e.g. scanned PDF), try page pixmap OCR if needed
        if not raw_text.strip():
            raw_text = "[Scanned PDF detected without embedded text layer. Please upload receipt image directly or verify OCR setup.]"
    else:
        # Image file
        raw_text, ocr_used = extract_text_from_image(save_path)

    return stored_filename, save_path, file_hash, raw_text, ocr_used
