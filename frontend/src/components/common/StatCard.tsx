import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  changePercentage?: string | number;
  changePositive?: boolean;
  trendLabel?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  changePercentage,
  changePositive,
  trendLabel = 'vs last month',
}) => {
  const hasChange = changePercentage !== undefined && changePercentage !== null;
  const numChange = typeof changePercentage === 'string' ? parseFloat(changePercentage) : (changePercentage || 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <div className="p-2.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-100">
          {icon}
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>

        {hasChange && (
          <div
            className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
              changePositive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {changePositive ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            <span>{Math.abs(numChange)}%</span>
          </div>
        )}
      </div>

      {hasChange && (
        <p className="text-[11px] text-slate-400 mt-2 font-medium">{trendLabel}</p>
      )}
    </div>
  );
};
