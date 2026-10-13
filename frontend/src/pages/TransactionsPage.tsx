import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Download,
  Trash2,
  Edit2,
  TrendingUp,
  TrendingDown,
  FileText,
  Tag,
} from 'lucide-react';
import { api } from '../services/api';
import type { TransactionRecord, Category } from '../types';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { TransactionFormModal } from '../components/transactions/TransactionFormModal';
import { formatCurrency, formatDate } from '../utils/formatters';

export const TransactionsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';

  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<TransactionRecord | null>(null);

  // Delete modal
  const [deletingTxId, setDeletingTxId] = useState<number | null>(null);

  // Custom Category Creation Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');
  const [newCatColor, setNewCatColor] = useState('#10b981');

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await api.listTransactions({
        query: searchQuery || undefined,
        type: selectedType || undefined,
        category_id: selectedCategory ? Number(selectedCategory) : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    api.listCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [searchQuery, selectedType, selectedCategory, startDate, endDate, sortBy, sortOrder]);

  const handleDelete = async () => {
    if (!deletingTxId) return;
    try {
      await api.deleteTransaction(deletingTxId);
      setDeletingTxId(null);
      fetchTransactions();
      window.dispatchEvent(new CustomEvent('openledger:data-updated'));
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.createCategory({
        name: newCatName.trim(),
        type: newCatType,
        color: newCatColor,
      });
      const updatedCats = await api.listCategories();
      setCategories(updatedCats);
      setNewCatName('');
      setIsCategoryModalOpen(false);
    } catch (err) {
      console.error('Failed to create category:', err);
    }
  };

  // Compute live totals for current view
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + parseFloat(String(t.amount)), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + parseFloat(String(t.amount)), 0);

  const netBalance = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Transactions Ledger</h2>
          <p className="text-xs text-slate-500">
            Categorized income and business expenses recorded in local SQLite
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Tag className="w-3.5 h-3.5" />}
            onClick={() => setIsCategoryModalOpen(true)}
          >
            New Category
          </Button>
          <a
            href="/api/transactions/export/csv"
            download="openledger_transactions.csv"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </a>
          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => {
              setTransactionToEdit(null);
              setIsFormOpen(true);
            }}
          >
            Record Transaction
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-wrap items-center gap-3 text-xs">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor, description..."
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
          <option value="">All Types (Income & Expenses)</option>
          <option value="expense">Expenses Only</option>
          <option value="income">Income Only</option>
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

        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
            title="Start date"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
            title="End date"
          />
        </div>

        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [sb, so] = e.target.value.split('-');
            setSortBy(sb);
            setSortOrder(so as any);
          }}
          className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
        >
          <option value="date-desc">Date (Newest First)</option>
          <option value="date-asc">Date (Oldest First)</option>
          <option value="amount-desc">Amount (Highest First)</option>
          <option value="amount-asc">Amount (Lowest First)</option>
          <option value="vendor-asc">Vendor (A-Z)</option>
        </select>

        {(searchQuery || selectedType || selectedCategory || startDate || endDate) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedType('');
              setSelectedCategory('');
              setStartDate('');
              setEndDate('');
            }}
            className="text-slate-400 hover:text-slate-600 underline text-xs ml-auto"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description / Vendor</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading ledger records...
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Date */}
                    <td className="py-3 px-4 font-mono text-slate-600">{formatDate(tx.date)}</td>

                    {/* Description / Vendor */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 ${
                            tx.type === 'income'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{tx.description}</p>
                          {tx.vendor && (
                            <p className="text-[11px] text-slate-400">Vendor: {tx.vendor}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      {tx.category ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: tx.category.color }}
                          />
                          {tx.category.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Uncategorized</span>
                      )}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-4 text-slate-600">{tx.payment_method}</td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          tx.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>

                    {/* Linked Document */}
                    <td className="py-3 px-4">
                      {tx.document_id ? (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium hover:underline cursor-pointer"
                          title={`Linked to Document #${tx.document_id}`}
                        >
                          <FileText className="w-3.5 h-3.5" /> Doc #{tx.document_id}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[11px]">Manual entry</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-bold text-sm ${
                          tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>
                      {tx.is_tax_deductible && tx.type === 'expense' && (
                        <span className="block text-[10px] text-emerald-600 font-medium">
                          Tax Deductible
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setTransactionToEdit(tx);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingTxId(tx.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No transactions match your search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Summary Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="text-slate-500 font-medium">
            Showing {transactions.length} record(s)
          </div>
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-400 mr-2">Income:</span>
              <span className="font-bold text-emerald-600">{formatCurrency(totalIncome)}</span>
            </div>
            <div>
              <span className="text-slate-400 mr-2">Expenses:</span>
              <span className="font-bold text-slate-900">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="pl-4 border-l border-slate-200">
              <span className="text-slate-400 mr-2">Net:</span>
              <span
                className={`font-bold ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
              >
                {formatCurrency(netBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setTransactionToEdit(null);
        }}
        categories={categories}
        transactionToEdit={transactionToEdit}
        onSuccess={() => {
          fetchTransactions();
          window.dispatchEvent(new CustomEvent('openledger:data-updated'));
        }}
      />

      {/* New Custom Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Create Custom Expense Category"
        description="Add a personalized category to organize your freelance records."
        maxWidth="sm"
      >
        <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">Category Name</label>
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. Cloud Compute, Client Entertainment"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Type</label>
              <select
                value={newCatType}
                onChange={(e: any) => setNewCatType(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Color Tag</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="h-7 w-10 border border-slate-200 rounded cursor-pointer"
                />
                <span className="font-mono text-slate-600">{newCatColor}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingTxId !== null}
        onClose={() => setDeletingTxId(null)}
        title="Confirm Transaction Deletion"
        description="Are you sure you want to delete this transaction record? This cannot be undone."
        maxWidth="sm"
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" size="sm" onClick={() => setDeletingTxId(null)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Delete Transaction
          </Button>
        </div>
      </Modal>
    </div>
  );
};
