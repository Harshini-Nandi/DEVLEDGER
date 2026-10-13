import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Cpu,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import type { OllamaStatusResponse } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface HeaderProps {
  onOpenUpload?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenUpload }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [aiStatus, setAiStatus] = useState<OllamaStatusResponse | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.getAIStatus();
        setAiStatus(res);
      } catch {
        setAiStatus({
          is_connected: false,
          host: 'http://127.0.0.1:11434',
          current_model: 'llama3.2',
          available_models: [],
          error_message: 'Cannot reach local Ollama daemon.',
        });
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // refresh status every 30s
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Financial Overview';
      case '/documents':
        return 'Documents & Invoices';
      case '/transactions':
        return 'Transactions Ledger';
      case '/ai-assistant':
        return 'AI Finance Assistant';
      case '/analytics':
        return 'Analytics & Reports';
      case '/pricing':
        return 'Side-Hustle Subscription Plans';
      case '/privacy':
        return 'Privacy & Local Architecture';
      case '/settings':
        return 'System Settings';
      default:
        return 'OpenLedger AI';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/transactions?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
        {/* Breadcrumb & Title */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">OpenLedger</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <h1 className="text-base font-bold text-slate-800 tracking-tight">{getPageTitle()}</h1>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-6">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendor, description, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </form>
        </div>

        {/* Right Section: Status Indicator, Action Buttons, Profile */}
        <div className="flex items-center gap-3">
          {/* Local Processing Status Pill */}
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              aiStatus?.is_connected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
            title="Click to view local model status & instructions"
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  aiStatus?.is_connected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  aiStatus?.is_connected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span className="font-semibold">
              {aiStatus?.is_connected
                ? `Ollama: ${aiStatus.current_model}`
                : 'Deterministic Engine'}
            </span>
            <span className="text-[10px] text-slate-500 underline ml-0.5">status</span>
          </button>

          {/* Quick Upload Action */}
          {onOpenUpload && (
            <Button
              size="sm"
              variant="outline"
              icon={<Upload className="w-3.5 h-3.5 text-slate-600" />}
              onClick={onOpenUpload}
            >
              Upload Doc
            </Button>
          )}

          {/* Quick AI Ask Action */}
          <Button
            size="sm"
            variant="primary"
            icon={<Sparkles className="w-3.5 h-3.5" />}
            onClick={() => navigate('/ai-assistant')}
          >
            Ask AI
          </Button>

          {/* User Avatar */}
          <div className="ml-2 pl-3 border-l border-slate-200 flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold border border-slate-700">
              AM
            </div>
          </div>
        </div>
      </header>

      {/* Ollama & Local Processing Diagnostic Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Local AI & Privacy Engine Diagnostics"
        description="OpenLedger AI processes all financial documents and prompts locally on your device."
      >
        <div className="space-y-4">
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              aiStatus?.is_connected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {aiStatus?.is_connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <div className="font-bold text-sm">
                {aiStatus?.is_connected
                  ? 'Local Ollama Model Connected'
                  : 'Ollama Offline — Deterministic Engine Active'}
              </div>
              <p>
                {aiStatus?.is_connected
                  ? `Active model '${aiStatus.current_model}' is running on ${aiStatus.host}. All structured document extractions and chat queries run 100% on this computer.`
                  : 'Ollama is not running on localhost:11434. The application is seamlessly utilizing its built-in rule-based extractor and SQLite decimal arithmetic engine. Financial totals and categorizations remain 100% functional.'}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Model Server URL:</span>
              <span className="font-mono text-slate-800">{aiStatus?.host || 'http://127.0.0.1:11434'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Configured Model:</span>
              <span className="font-semibold text-slate-800">{aiStatus?.current_model || 'llama3.2'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Installed Local Models:</span>
              <span className="font-mono text-slate-800">
                {aiStatus?.available_models && aiStatus.available_models.length > 0
                  ? aiStatus.available_models.join(', ')
                  : 'None detected'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-medium">Data Storage:</span>
              <span className="font-medium text-emerald-700">Local SQLite (Zero Cloud Sync)</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-900 text-slate-100 text-xs">
            <p className="font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
              <Cpu className="w-4 h-4" /> Start Local Ollama Model (PowerShell):
            </p>
            <pre className="bg-slate-950 p-2.5 rounded font-mono text-[11px] overflow-x-auto text-emerald-300">
              ollama run llama3.2
            </pre>
            <p className="text-[11px] text-slate-400 mt-2">
              Supports any open-weight model: <code className="text-slate-300">llama3.2</code>, <code className="text-slate-300">qwen2.5:7b</code>, <code className="text-slate-300">mistral</code>, or <code className="text-slate-300">phi3</code>.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsStatusModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
