import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Printer,
  FileSpreadsheet,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { api } from '../services/api';
import type {
  DashboardSummary,
  MonthlyTrend,
  CategoryExpenseSummary,
  VendorSummary,
  PendingInvoiceSummary,
} from '../types';
import { Badge } from '../components/common/Badge';
import { formatCurrency, formatDate } from '../utils/formatters';

export const AnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [categories, setCategories] = useState<CategoryExpenseSummary[]>([]);
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
  const [unpaid, setUnpaid] = useState<PendingInvoiceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Custom filter dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [trendMonths, setTrendMonths] = useState(6);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [sumRes, trendRes, catRes, venRes, unpRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getMonthlyTrends(trendMonths),
        api.getCategoryExpenses(startDate || undefined, endDate || undefined),
        api.getTopVendors(5),
        api.getUnpaidInvoices(),
      ]);
      setSummary(sumRes);
      setTrends(trendRes);
      setCategories(catRes);
      setVendors(venRes);
      setUnpaid(unpRes);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate, trendMonths]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <div className="h-7 w-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Calculating financial analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial Analytics & Reports</h2>
          <p className="text-xs text-slate-500">
            {summary
              ? `Monthly Expenses: ${formatCurrency(summary.total_expenses_month)} • Net Cashflow: ${formatCurrency(summary.net_cashflow_month)}`
              : 'Computed with Python Decimal arithmetic from your local database'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/transactions/export/csv"
            download="transactions_ledger.csv"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
          </a>
          <a
            href="/api/analytics/report/monthly-html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-navy-900 rounded-lg hover:bg-slate-800 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" /> Printable Summary Report
          </a>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" /> Custom Filter:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-slate-400 hover:text-slate-600 underline"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">Trend Horizon:</span>
          <select
            value={trendMonths}
            onChange={(e) => setTrendMonths(Number(e.target.value))}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value={3}>3 Months</option>
            <option value={6}>6 Months</option>
            <option value={12}>12 Months</option>
          </select>
        </div>
      </div>

      {/* Income vs Expenses Bar Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Income vs. Expenses Comparison</h3>
            <p className="text-xs text-slate-500">Gross revenue versus operational expenses</p>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="month_label" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                formatter={(val: any) => formatCurrency(val)}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown & Top Vendors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Spending Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <div className="mb-4">
            <h3 className="font-bold text-sm text-slate-900">Expense Category Distribution</h3>
            <p className="text-xs text-slate-500">Ranking by total monetary expenditure</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Transactions</th>
                  <th className="py-2.5 px-3 text-right">Share (%)</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <tr key={c.category_name} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3">
                        <span className="flex items-center gap-2 font-medium text-slate-800">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.category_name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{c.transaction_count}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                        {c.percentage}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(c.total_amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No expense records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Vendors Ranking */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <div className="mb-4">
            <h3 className="font-bold text-sm text-slate-900">Top Vendors by Spending</h3>
            <p className="text-xs text-slate-500">Highest aggregate expense suppliers</p>
          </div>

          <div className="space-y-3">
            {vendors.length > 0 ? (
              vendors.map((v, i) => (
                <div
                  key={v.vendor}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-400 w-4">{i + 1}.</span>
                    <div>
                      <p className="font-semibold text-slate-900">{v.vendor}</p>
                      <p className="text-[11px] text-slate-400">
                        {v.transaction_count} transaction(s) recorded
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatCurrency(v.total_amount)}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-slate-400 text-xs">No vendor data available yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Pending / Unpaid Invoices Schedule */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Outstanding Invoices Schedule</h3>
            <p className="text-xs text-slate-500">Unsettled accounts awaiting payment confirmation</p>
          </div>
          <Badge variant="amber">
            <Clock className="w-3.5 h-3.5" />
            {unpaid.length} Pending
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-2.5 px-3">Vendor / Client</th>
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-right">Amount Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unpaid.length > 0 ? (
                unpaid.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {inv.vendor || 'Unknown Vendor'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {inv.invoice_number || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-rose-600 font-medium">
                      {formatDate(inv.due_date)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(inv.total_amount, inv.currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    ✅ All invoices are paid or settled.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
