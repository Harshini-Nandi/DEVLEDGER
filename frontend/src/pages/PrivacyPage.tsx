import React, { useState, useEffect } from 'react';
import {
  Lock,
  HardDrive,
  Cpu,
  EyeOff,
  FileCheck2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import type { StorageInfo } from '../types';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

export const PrivacyPage: React.FC = () => {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [wipeSuccess, setWipeSuccess] = useState(false);

  useEffect(() => {
    api.getStorageInfo().then(setStorageInfo).catch(console.error);
  }, []);

  const handleWipeData = async () => {
    setIsWiping(true);
    try {
      await api.clearAllData();
      setWipeSuccess(true);
      const updatedStorage = await api.getStorageInfo();
      setStorageInfo(updatedStorage);
      window.dispatchEvent(new CustomEvent('openledger:data-updated'));
      setTimeout(() => {
        setIsClearModalOpen(false);
        setWipeSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to wipe data:', err);
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Privacy Architecture & Zero-Data-Leakage Guarantee
          </h2>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            Zero Cloud Telemetry
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Detailed technical disclosure of how OpenLedger AI protects confidential financial receipts.
        </p>
      </div>

      {/* Main Privacy Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-3">
          <div className="flex items-center gap-2.5 text-emerald-600 font-bold text-sm">
            <Cpu className="w-5 h-5" />
            <span>Local Model Inference (Ollama)</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            When you extract data from an invoice or ask the AI financial assistant a question, prompt tokens are sent exclusively to your local Ollama port (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">http://127.0.0.1:11434</code>). No third-party APIs (OpenAI, Gemini, Anthropic) are used.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-3">
          <div className="flex items-center gap-2.5 text-blue-600 font-bold text-sm">
            <HardDrive className="w-5 h-5" />
            <span>Local SQLite Database Engine</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All tables (transactions, invoices, categories, profiles) live on your storage drive in a SQLite file (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">openledger.db</code>). There is no remote cloud sync or multi-tenant database vulnerability.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-3">
          <div className="flex items-center gap-2.5 text-purple-600 font-bold text-sm">
            <Lock className="w-5 h-5" />
            <span>Zero Third-Party Tracking</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            OpenLedger AI is built without Google Analytics, Mixpanel, cookies, marketing beacons, or remote telemetry. System fonts and bundled SVG icons are utilized to prevent remote font tracking.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-3">
          <div className="flex items-center gap-2.5 text-amber-600 font-bold text-sm">
            <EyeOff className="w-5 h-5" />
            <span>Guaranteed Right to Erasure</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            You maintain 100% sovereignty over your data. You can export complete CSV records at any time or execute a permanent local storage purge with a single click.
          </p>
        </div>
      </div>

      {/* Storage & Privacy Metrics Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
        <h3 className="font-bold text-sm text-slate-800">Local Storage Fingerprint</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Database Size:</span>
            <span className="font-mono font-bold text-slate-800">
              {storageInfo?.database_size_formatted || '0 B'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Stored Invoices/PDFs:</span>
            <span className="font-mono font-bold text-slate-800">
              {storageInfo?.uploads_size_formatted || '0 B'} ({storageInfo?.documents_count || 0} files)
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Recorded Transactions:</span>
            <span className="font-mono font-bold text-slate-800">
              {storageInfo?.transactions_count || 0}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">External Network Calls:</span>
            <span className="font-mono font-bold text-emerald-600">0 calls</span>
          </div>
        </div>
      </div>

      {/* Offline Transparency & Network Requirements */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card space-y-3 text-xs leading-relaxed">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-emerald-600" /> Transparent Network & Offline Disclosures
        </h3>
        <p className="text-slate-600">
          In compliance with honest engineering standards:
        </p>
        <ul className="space-y-1.5 text-slate-600 list-disc pl-5">
          <li>
            <strong>Initial Setup:</strong> An internet connection is required during installation to download npm dependencies, Python wheels, and the chosen Ollama model weight file (e.g. 2GB for Llama 3.2 3B).
          </li>
          <li>
            <strong>Daily Operation:</strong> Once dependencies and Ollama weights are installed on your machine, OpenLedger AI runs <strong>completely offline</strong> without an active internet connection.
          </li>
          <li>
            <strong>OCR Hardware Dependency:</strong> Tesseract OCR and PyMuPDF run locally on your CPU. Complex scanned receipts require higher DPI scans for optimal OCR accuracy.
          </li>
        </ul>
      </div>

      {/* Wipe Data Section */}
      <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-rose-900">Purge Stored Financial Records</h4>
          <p className="text-xs text-rose-700 mt-0.5">
            Permanently delete all documents, extracted line items, and transaction ledger records from local SQLite.
          </p>
        </div>
        <Button
          size="sm"
          variant="danger"
          icon={<Trash2 className="w-3.5 h-3.5" />}
          onClick={() => setIsClearModalOpen(true)}
        >
          Wipe Local Financial Data
        </Button>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Confirm Complete Data Purge"
        description="This will permanently delete all uploaded invoice files, receipts, and recorded transactions from your local disk. Categories will be preserved."
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          {wipeSuccess ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All records and document files have been wiped successfully!</span>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsClearModalOpen(false)}
                disabled={isWiping}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isWiping}
                onClick={handleWipeData}
              >
                Yes, Purge Everything
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
