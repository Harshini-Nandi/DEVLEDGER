import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  FileText,
  Upload,
  Search,
  Download,
  Trash2,
  Edit2,
  Plus,
} from 'lucide-react';
import { api } from '../services/api';
import type { DocumentRecord, Category } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { formatCurrency, formatDate, formatFileSize } from '../utils/formatters';

export const DocumentsPage: React.FC = () => {
  const { openUpload, categories } = useOutletContext<{
    openUpload: () => void;
    categories: Category[];
  }>();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Edit document modal state
  const [editingDoc, setEditingDoc] = useState<DocumentRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editVendor, setEditVendor] = useState('');
  const [editInvoiceNum, setEditInvoiceNum] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editTotal, setEditTotal] = useState('');
  const [editTax, setEditTax] = useState('');
  const [editSubtotal, setEditSubtotal] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState<string>('unknown');
  const [editCategoryId, setEditCategoryId] = useState<number | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal state
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await api.listDocuments({
        query: searchQuery || undefined,
        document_type: selectedType || undefined,
        payment_status: selectedStatus || undefined,
        category_id: selectedCategory ? Number(selectedCategory) : undefined,
      });
      setDocuments(docs);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    const handleUpdate = () => fetchDocuments();
    window.addEventListener('openledger:data-updated', handleUpdate);
    return () => window.removeEventListener('openledger:data-updated', handleUpdate);
  }, [searchQuery, selectedType, selectedStatus, selectedCategory]);

  const handleOpenEdit = (doc: DocumentRecord) => {
    setEditingDoc(doc);
    setEditVendor(doc.vendor || '');
    setEditInvoiceNum(doc.invoice_number || '');
    setEditDate(doc.invoice_date || '');
    setEditDueDate(doc.due_date || '');
    setEditTotal(String(doc.total_amount));
    setEditTax(String(doc.tax));
    setEditSubtotal(String(doc.subtotal));
    setEditPaymentStatus(doc.payment_status);
    setEditCategoryId(doc.category_id);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingDoc) return;
    setIsSaving(true);
    try {
      await api.updateDocument(editingDoc.id, {
        vendor: editVendor,
        invoice_number: editInvoiceNum,
        invoice_date: editDate,
        due_date: editDueDate,
        total_amount: editTotal,
        tax: editTax,
        subtotal: editSubtotal,
        payment_status: editPaymentStatus as any,
        category_id: editCategoryId,
      });
      setIsEditModalOpen(false);
      fetchDocuments();
    } catch (err) {
      console.error('Failed to update document:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDocId) return;
    try {
      await api.deleteDocument(deletingDocId);
      setDeletingDocId(null);
      fetchDocuments();
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const handleRecordAsTransaction = async (docId: number) => {
    try {
      await api.createTransactionFromDocument(docId);
      window.dispatchEvent(new CustomEvent('openledger:data-updated'));
      fetchDocuments();
    } catch (err) {
      console.error('Failed to convert document:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Documents & Receipts</h2>
          <p className="text-xs text-slate-500">
            Local optical extraction and structured financial record repository
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/documents/export/csv"
            download="openledger_documents.csv"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </a>
          <Button size="sm" variant="primary" icon={<Upload className="w-3.5 h-3.5" />} onClick={openUpload}>
            Upload Document
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-wrap items-center gap-3 text-xs">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor, invoice #, or file name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
        >
          <option value="">All Document Types</option>
          <option value="invoice">Invoices</option>
          <option value="receipt">Receipts</option>
          <option value="bill">Bills</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
        >
          <option value="">All Payment Statuses</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="pending">Pending</option>
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {(searchQuery || selectedType || selectedStatus || selectedCategory) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedType('');
              setSelectedStatus('');
              setSelectedCategory('');
            }}
            className="text-slate-400 hover:text-slate-600 underline text-xs"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Document / Vendor</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading stored documents...
                  </td>
                </tr>
              ) : documents.length > 0 ? (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Document / Vendor */}
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded bg-slate-100 text-slate-600 mt-0.5 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="max-w-[220px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 truncate block">
                              {doc.vendor || doc.original_filename}
                            </span>
                            {doc.is_duplicate && (
                              <Badge variant="amber" size="sm">
                                Duplicate
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {doc.original_filename} ({formatFileSize(doc.file_size)})
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4 capitalize font-medium text-slate-600">
                      {doc.document_type}
                    </td>

                    {/* Invoice # */}
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {doc.invoice_number || '—'}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-600">{formatDate(doc.invoice_date)}</td>

                    {/* Due Date */}
                    <td className="py-3 px-4 text-slate-600">{formatDate(doc.due_date)}</td>

                    {/* Total Amount */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">
                        {formatCurrency(doc.total_amount, doc.currency)}
                      </span>
                      {Number(doc.tax) > 0 && (
                        <span className="text-[10px] text-slate-400">
                          Tax: {formatCurrency(doc.tax, doc.currency)}
                        </span>
                      )}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                          doc.payment_status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : doc.payment_status === 'unpaid'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {doc.payment_status}
                      </span>
                    </td>

                    {/* Extraction Method */}
                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                        {doc.extraction_method.split(' ')[0]}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleRecordAsTransaction(doc.id)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Record as Transaction"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(doc)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Review / Edit Fields"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <a
                          href={`/api/documents/${doc.id}/download`}
                          download={doc.original_filename}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                          title="Download Original File"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => setDeletingDocId(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No documents found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Extracted Fields Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Document Fields"
        description="Correct any inaccuracies from the optical extraction model."
        maxWidth="lg"
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Vendor / Merchant</label>
              <input
                type="text"
                value={editVendor}
                onChange={(e) => setEditVendor(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Invoice / Receipt #</label>
              <input
                type="text"
                value={editInvoiceNum}
                onChange={(e) => setEditInvoiceNum(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Invoice Date</label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Due Date</label>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Total ($)</label>
              <input
                type="number"
                step="0.01"
                value={editTotal}
                onChange={(e) => setEditTotal(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Subtotal ($)</label>
              <input
                type="number"
                step="0.01"
                value={editSubtotal}
                onChange={(e) => setEditSubtotal(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Tax ($)</label>
              <input
                type="number"
                step="0.01"
                value={editTax}
                onChange={(e) => setEditTax(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Payment Status</label>
              <select
                value={editPaymentStatus}
                onChange={(e) => setEditPaymentStatus(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
              >
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="pending">Pending</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Category</label>
              <select
                value={editCategoryId || ''}
                onChange={(e) => setEditCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
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

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSaveEdit}>
              Update Fields
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingDocId !== null}
        onClose={() => setDeletingDocId(null)}
        title="Confirm Document Deletion"
        description="Are you sure you want to delete this document? The file will be permanently removed from local disk storage."
        maxWidth="sm"
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" size="sm" onClick={() => setDeletingDocId(null)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Permanently Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};
