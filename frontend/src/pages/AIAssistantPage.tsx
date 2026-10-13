import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Cpu,
  ShieldCheck,
  AlertCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import type { AIQueryResponse, OllamaStatusResponse } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { formatCurrency } from '../utils/formatters';

const SUGGESTED_QUESTIONS = [
  'How much did I spend this month?',
  'What are my top three expense categories?',
  'Which invoices are still unpaid?',
  'How much did I spend on software this quarter?',
  'Show my expenses for the last three months.',
  'Are there any possible duplicate receipts?',
  'Which expenses increased compared with last month?',
];

export const AIAssistantPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<OllamaStatusResponse | null>(null);
  const [currentResponse, setCurrentResponse] = useState<AIQueryResponse | null>(null);
  const [queryHistory, setQueryHistory] = useState<
    Array<{ query: string; response: AIQueryResponse }>
  >([]);

  useEffect(() => {
    api.getAIStatus().then(setAiStatus).catch(console.error);
  }, []);

  const handleExecuteQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const res = await api.queryAIAssistant(queryText.trim());
      setCurrentResponse(res);
      setQueryHistory((prev) => [{ query: queryText.trim(), response: res }, ...prev]);
      setQuery('');
    } catch (err: any) {
      console.error('Error querying AI assistant:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              AI Financial Analysis Workspace
            </h2>
            <Badge variant={aiStatus?.is_connected ? 'emerald' : 'amber'}>
              {aiStatus?.is_connected
                ? `Ollama: ${aiStatus.current_model}`
                : 'Deterministic Engine'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Grounded local intelligence powered by your verified SQLite database and open-weight models.
          </p>
        </div>

        {/* Model Status Badge */}
        <div className="flex items-center gap-2 text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-medium text-slate-700">100% On-Device Isolation</span>
        </div>
      </div>

      {/* Connection Notice if Ollama is Offline */}
      {aiStatus && !aiStatus.is_connected && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start justify-between gap-3 shadow-subtle">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Ollama Model Daemon is not running locally.</span>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                OpenLedger AI is actively answering queries using its built-in Python Decimal calculation engine. To enable natural-language conversational reasoning, launch Ollama in PowerShell: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-950">ollama run {aiStatus.current_model || 'llama3.2'}</code>.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 bg-white"
            onClick={() => api.getAIStatus().then(setAiStatus)}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
          </Button>
        </div>
      )}

      {/* Suggested Prompts Cards */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Suggested Financial Queries:
        </span>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleExecuteQuery(q)}
              disabled={isLoading}
              className="text-xs bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 transition-all font-medium text-left shadow-subtle"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Query Input Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-card focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecuteQuery(query);
          }}
          className="flex items-center gap-2"
        >
          <div className="p-2 text-slate-400">
            <Sparkles className="w-5 h-5 text-emerald-500" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            placeholder="Ask about spending this month, top categories, unpaid bills, tax deductions..."
            className="flex-1 py-2 text-xs md:text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
          />
          <Button
            type="submit"
            size="sm"
            variant="primary"
            isLoading={isLoading}
            disabled={!query.trim()}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            Analyze
          </Button>
        </form>
      </div>

      {/* Active Response Display */}
      {currentResponse && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-6">
          {/* Header Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Inference Engine:</span>
              <Badge variant={currentResponse.is_ollama_connected ? 'emerald' : 'slate'}>
                <Cpu className="w-3 h-3" />
                {currentResponse.model_used}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Execution: {currentResponse.execution_time_ms.toFixed(0)} ms
              </span>
              <span>{currentResponse.timestamp}</span>
            </div>
          </div>

          {/* Answer Markdown Body */}
          <div className="prose prose-sm max-w-none text-slate-800 text-xs md:text-sm leading-relaxed space-y-3">
            {currentResponse.answer.split('\n\n').map((paragraph, idx) => {
              // Simple markdown alert or heading formatting
              if (paragraph.startsWith('> [!NOTE]')) {
                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border-l-4 border-emerald-500 rounded-r-lg text-xs text-slate-700"
                  >
                    {paragraph.replace('> [!NOTE]\n>', '').trim()}
                  </div>
                );
              }
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={idx} className="font-bold text-sm md:text-base text-slate-900 pt-2">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('#### ')) {
                return (
                  <h4 key={idx} className="font-semibold text-xs md:text-sm text-slate-800 pt-1">
                    {paragraph.replace('#### ', '')}
                  </h4>
                );
              }
              return (
                <p key={idx} className="text-slate-700">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Source Documents & Deterministic Grounding Facts */}
          {currentResponse.source_documents && currentResponse.source_documents.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                Retrieved Source Records (Ground Truth):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {currentResponse.source_documents.map((src, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 truncate">
                        {src.vendor || src.description || 'Record'}
                      </span>
                      <span className="font-bold text-emerald-700">
                        {formatCurrency(src.total_amount || src.amount)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {src.invoice_number ? `Invoice #${src.invoice_number}` : ''}{' '}
                      {src.date || src.due_date ? `• ${src.date || src.due_date}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Query History */}
      {queryHistory.length > 1 && (
        <div className="space-y-4 pt-6">
          <h3 className="font-bold text-sm text-slate-900">Previous Analyses in this Session</h3>
          <div className="space-y-3">
            {queryHistory.slice(1).map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">Q: {item.query}</span>
                  <span className="text-[11px] text-slate-400">{item.response.timestamp}</span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {item.response.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
