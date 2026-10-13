import React, { useState, useRef } from 'react';
import {
  Upload,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import type { DocumentRecord, Category } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onDocumentProcessed?: (doc: DocumentRecord) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  categories,
  onDocumentProcessed,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedDoc, setExtractedDoc] = useState<DocumentRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable fields state
  const [vendor, setVendor] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [subtotal, setSubtotal] = useState('');
  const [tax, setTax] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'pending' | 'unknown'>('unknown');
  const [documentType, setDocumentType] = useState<'invoice' | 'receipt' | 'bill' | 'other'>('invoice');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);

  const resetState = () => {
    setIsDragging(false);
    setIsProcessing(false);
    setError(null);
    setExtractedDoc(null);
    setIsSaving(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (selectedFile: File) => {
    // Validate extension
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg'];
    const name = selectedFile.name.toLowerCase();
    const hasAllowedExt = allowed.some((ext) => name.endsWith(ext));
    if (!hasAllowedExt) {
      setError('Unsupported file type. Please upload a PDF, PNG, JPG, or JPEG.');
      return;
    }

    // Validate size (15MB)
    if (selectedFile.size > 15 * 1024 * 1024) {
      setError('File exceeds 15MB limit.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const doc = await api.uploadDocument(selectedFile);
      setExtractedDoc(doc);
      // Pre-fill editable inputs
      setVendor(doc.vendor || '');
      setInvoiceNumber(doc.invoice_number || '');
      setInvoiceDate(doc.invoice_date || '');
      setDueDate(doc.due_date || '');
      setTotalAmount(String(doc.total_amount || '0.00'));
      setSubtotal(String(doc.subtotal || '0.00'));
      setTax(String(doc.tax || '0.00'));
      setCurrency(doc.currency || 'USD');
      setPaymentStatus(doc.payment_status);
      setDocumentType(doc.document_type);
      setCategoryId(doc.category_id);

      if (onDocumentProcessed) {
        onDocumentProcessed(doc);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!extractedDoc) return;
    setIsSaving(true);
    try {
      const updated = await api.updateDocument(extractedDoc.id, {
        vendor,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate,
        total_amount: totalAmount,
        subtotal,
        tax,
        currency,
        payment_status: paymentStatus,
        document_type: documentType,
        category_id: categoryId,
      });
      setExtractedDoc(updated);
      if (onDocumentProcessed) onDocumentProcessed(updated);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save edits.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecordAsTransaction = async () => {
    if (!extractedDoc) return;
    try {
      await api.createTransactionFromDocument(extractedDoc.id);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record transaction.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={extractedDoc ? 'Review & Verify Extracted Data' : 'Upload Document or Receipt'}
      description={
        extractedDoc
          ? 'Confirm or adjust the fields extracted by your local AI model before finalizing.'
          : 'Drag and drop your PDF invoices or photo receipts. Processed 100% on your machine.'
      }
      maxWidth={extractedDoc ? '2xl' : 'lg'}
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!extractedDoc && !isProcessing && (
          <div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Click to browse or drag and drop invoice / receipt
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports PDF, PNG, JPG, and JPEG up to 15MB
              </p>
            </div>

            <div className="mt-4 p-3 bg-slate-100/70 rounded-lg text-[11px] text-slate-500 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Privacy Guarantee:</strong> Documents are stored in your local folder and processed locally. No file bytes or text are transmitted to remote cloud APIs.
              </span>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="py-12 text-center space-y-4">
            <div className="inline-flex p-4 rounded-full bg-emerald-50 text-emerald-600">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Extracting Document Data Locally...
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Extracting text with PyMuPDF/OCR and querying local AI structured JSON engine.
              </p>
            </div>
          </div>
        )}

        {/* Extracted Document Preview & Inline Edit Form */}
        {extractedDoc && (
          <div className="space-y-4">
            {/* Duplicate Alert Banner */}
            {extractedDoc.is_duplicate && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Potential Duplicate Document Detected!</span>
                  <p className="mt-0.5 text-amber-800">
                    This file matches the exact SHA-256 fingerprint of Document #{extractedDoc.duplicate_of_id}. Proceed with caution to prevent double-counting expenses.
                  </p>
                </div>
              </div>
            )}

            {/* Model Badge */}
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Extraction Engine:</span>
              <Badge variant="emerald">
                <CheckCircle2 className="w-3 h-3" />
                {extractedDoc.extraction_method}
              </Badge>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Vendor / Merchant</label>
                <input
                  type="text"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Amazon Web Services"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Invoice / Receipt #</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. INV-9842"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Document Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Total Amount</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full pl-6 pr-3 py-1.5 border border-slate-200 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Tax</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    className="w-full pl-6 pr-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e: any) => setPaymentStatus(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="paid">Paid (Receipt)</option>
                  <option value="unpaid">Unpaid (Invoice Due)</option>
                  <option value="pending">Pending</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Category</label>
                <select
                  value={categoryId || ''}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Line Items Preview */}
            {extractedDoc.line_items && extractedDoc.line_items.length > 0 && (
              <div className="border border-slate-200 rounded-lg overflow-hidden mt-3">
                <div className="bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 border-b border-slate-200">
                  Extracted Line Items ({extractedDoc.line_items.length})
                </div>
                <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {extractedDoc.line_items.map((item, idx) => (
                    <div key={idx} className="p-2 flex justify-between items-center text-slate-700">
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-[11px] text-slate-400">Qty: {item.quantity} × ${item.unit_price}</p>
                      </div>
                      <span className="font-bold text-slate-900">${item.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRecordAsTransaction}>
                  Record as Transaction
                </Button>
                <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSaveChanges}>
                  Save Document
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
