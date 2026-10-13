import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Sparkles,
  BarChart3,
  Settings,
  ShieldCheck,
  CreditCard,
  Lock,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Documents', path: '/documents', icon: FileText },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'AI Finance Assistant', path: '/ai-assistant', icon: Sparkles, badge: 'Local AI' },
    { name: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
    { name: 'Pricing Plans', path: '/pricing', icon: CreditCard },
    { name: 'Privacy & Security', path: '/privacy', icon: ShieldCheck },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0c1527] text-slate-300 flex flex-col h-screen border-r border-slate-800/80 sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-bold text-lg">
            OL
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base tracking-tight">OpenLedger</span>
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Private Finance Assistant</p>
          </div>
        </div>

        {/* Privacy Assurance Badge */}
        <div className="mt-4 flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-lg text-[11px] text-slate-300">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <div className="leading-tight">
            <span className="text-emerald-400 font-semibold block">100% Local Inference</span>
            <span className="text-slate-400 text-[10px]">Zero Cloud Telemetry</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-emerald-400/10 text-emerald-400 font-semibold px-1.5 py-0.5 rounded border border-emerald-400/20">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-emerald-400 shrink-0">
              AM
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">Alex Mercer</p>
              <p className="text-[10px] text-slate-400 truncate">Independent Consultant</p>
            </div>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" title="System Online" />
        </div>
      </div>
    </aside>
  );
};
