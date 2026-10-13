import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  TrendingDown,
  TrendingUp,
  FileText,
  Clock,
  Upload,
  Sparkles,
  Database,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../services/api';
import type {
  DashboardSummary,
  MonthlyTrend,
  CategoryExpenseSummary,
  AISpendingInsight,
  DocumentRecord,
  TransactionRecord,
} from '../types';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { formatCurrency, formatDate } from '../utils/formatters';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { openUpload } = useOutletContext<{ openUpload: () => void }>();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [categories, setCategories] = useState<CategoryExpenseSummary[]>([]);
  const [insight, setInsight] = useState<AISpendingInsight | null>(null);
  const [recentDocs, setRecentDocs] = useState<DocumentRecord[]>([]);
  const [recentTxs, setRecentTxs] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, trendRes, catRes, insRes, docRes, txRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getMonthlyTrends(6),
        api.getCategoryExpenses(),
        api.getAISpendingInsight(),
        api.listDocuments({ limit: 5 }),
        api.listTransactions({ limit: 5 }),
      ]);
      setSummary(sumRes);
      setTrends(trendRes);
      setCategories(catRes);
      setInsight(insRes);
      setRecentDocs(docRes);
      setRecentTxs(txRes);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleUpdate = () => fetchData();
    window.addEventListener('openledger:data-updated', handleUpdate);
    return () => window.removeEventListener('openledger:data-updated', handleUpdate);
  }, []);

  const handleLoadDemo = async () => {
    setIsDemoLoading(true);
    try {
      await api.loadDemoData();
      await fetchData();
    } catch (err) {
      console.error('Failed to load demo data:', err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading financial metrics...</p>
        </div>
      </div>
    );
  }

  // Attractive Onboarding State when DB has no real data
  if (summary && !summary.has_real_data) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-900 to-navy-950 text-white rounded-2xl p-8 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-400 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-2xl space-y-4 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Private & Open-Source
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome to OpenLedger AI
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Your private financial productivity workstation. Designed for freelancers, independent contractors, and side hustles to extract invoice data, track deductible expenses, and gain AI intelligence without transmitting private financial records to third-party cloud APIs.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="md"
                icon={<Upload className="w-4 h-4" />}
                onClick={openUpload}
              >
                Upload Your First Document
              </Button>
              <Button
                variant="outline"
                size="md"
                isLoading={isDemoLoading}
                icon={<Database className="w-4 h-4 text-emerald-400" />}
                onClick={handleLoadDemo}
                className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                Load Realistic Demo Data
              </Button>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-2">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Automated Document Parsing</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Drop PDFs or scanned receipts. PyMuPDF and local OCR parse vendor, dates, totals, and line items instantly.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-2">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Deterministic Decimal Math</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every balance, tax calculation, and category sum is verified with Python's Decimal library—never language model hallucinations.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-2">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Local Ollama AI Assistant</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Query your financial records in plain English. Works with Llama 3.2, Mistral, or Qwen models running completely on localhost.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Spending Insight Card */}
      {insight && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all shadow-subtle ${
            insight.severity === 'warning'
              ? 'bg-amber-50/70 border-amber-200 text-amber-900'
              : insight.severity === 'positive'
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-blue-50/70 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white/80 border border-slate-200/50 shadow-sm mt-0.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Local AI Spending Insight
                </span>
                <Badge variant={insight.severity === 'warning' ? 'amber' : 'emerald'} size="sm">
                  {insight.title}
                </Badge>
              </div>
              <p className="text-sm font-semibold mt-1 text-slate-900">{insight.summary}</p>
              <p className="text-xs text-slate-600 mt-0.5">{insight.detail}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 bg-white"
            onClick={() => navigate('/ai-assistant')}
          >
            Explore with AI
          </Button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Expenses (Mo)"
          value={formatCurrency(summary?.total_expenses_month)}
          changePercentage={summary?.expense_change_percentage}
          changePositive={Number(summary?.expense_change_percentage) <= 0}
          icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
        />
        <StatCard
          title="Total Income (Mo)"
          value={formatCurrency(summary?.total_income_month)}
          changePercentage={summary?.income_change_percentage}
          changePositive={Number(summary?.income_change_percentage) >= 0}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Net Cash Flow"
          value={formatCurrency(summary?.net_cashflow_month)}
          subtitle={Number(summary?.net_cashflow_month) >= 0 ? 'Surplus' : 'Deficit'}
          icon={<CheckCircle2 className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Pending Invoices"
          value={String(summary?.pending_invoices_count || 0)}
          subtitle={`Total: ${formatCurrency(summary?.pending_invoices_total)}`}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          title="Documents Stored"
          value={String(summary?.documents_processed_count || 0)}
          subtitle={
            summary?.potential_duplicates_count
              ? `${summary.potential_duplicates_count} possible duplicate(s)`
              : '0 duplicates'
          }
          icon={<FileText className="w-5 h-5 text-indigo-600" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Expense Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Cash Flow & Expense Trends</h3>
              <p className="text-xs text-slate-500">Last 6 months recorded activity</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Expenses
              </span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month_label" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  formatter={(val: any) => formatCurrency(val)}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#incomeGrad)"
                  name="Income"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Donut */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card flex flex-col">
          <div className="mb-2">
            <h3 className="font-bold text-sm text-slate-900">Spending by Category</h3>
            <p className="text-xs text-slate-500">Distribution of confirmed expenses</p>
          </div>

          <div className="h-44 relative flex items-center justify-center">
            {categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="total_amount"
                    nameKey="category_name"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#10b981'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(val)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No category data yet.</p>
            )}
          </div>

          <div className="mt-auto space-y-1.5 max-h-36 overflow-y-auto text-xs pr-1">
            {categories.slice(0, 4).map((c) => (
              <div key={c.category_name} className="flex items-center justify-between py-0.5">
                <span className="flex items-center gap-2 truncate text-slate-700">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="truncate">{c.category_name}</span>
                </span>
                <span className="font-semibold text-slate-900 shrink-0">
                  {formatCurrency(c.total_amount)} ({c.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Transactions & Recent Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Recent Transactions</h3>
              <p className="text-xs text-slate-500">Latest recorded income & expenses</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/transactions')}
              className="text-xs text-emerald-600 hover:text-emerald-700"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentTxs.length > 0 ? (
              recentTxs.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
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
                      <p className="font-semibold text-slate-900 truncate max-w-[200px]">
                        {tx.description}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatDate(tx.date)} • {tx.category?.name || 'General'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-bold ${
                      tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">No transactions recorded yet.</p>
            )}
          </div>
        </div>

        {/* Recently Processed Documents */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Recently Uploaded Documents</h3>
              <p className="text-xs text-slate-500">Invoices & receipts processed locally</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/documents')}
              className="text-xs text-emerald-600 hover:text-emerald-700"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentDocs.length > 0 ? (
              recentDocs.map((doc) => (
                <div key={doc.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-slate-900 truncate max-w-[180px]">
                          {doc.vendor || doc.original_filename}
                        </p>
                        {doc.is_duplicate && (
                          <Badge variant="amber" size="sm">
                            Duplicate
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {formatDate(doc.invoice_date)} • {doc.document_type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">
                      {formatCurrency(doc.total_amount, doc.currency)}
                    </span>
                    <span
                      className={`text-[10px] font-medium capitalize ${
                        doc.payment_status === 'paid'
                          ? 'text-emerald-600'
                          : doc.payment_status === 'unpaid'
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {doc.payment_status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">No documents uploaded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
