import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Database,
  User,
  RefreshCw,
  Save,
  CheckCircle2,
  Download,
  Trash2,
} from 'lucide-react';
import { api } from '../services/api';
import type {
  UserProfile,
  OllamaStatusResponse,
  StorageInfo,
} from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const SettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    business_name: '',
    email: '',
    default_currency: 'USD',
  });
  const [aiStatus, setAiStatus] = useState<OllamaStatusResponse | null>(null);
  const [storage, setStorage] = useState<StorageInfo | null>(null);

  // Editable model name
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Clear data modal
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [pRes, aiRes, stRes] = await Promise.all([
        api.getUserProfile(),
        api.getAIStatus(),
        api.getStorageInfo(),
      ]);
      setProfile(pRes);
      setAiStatus(aiRes);
      setSelectedModel(aiRes.current_model || 'llama3.2');
      setStorage(stRes);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleTestAIConnection = async () => {
    setIsTestingAI(true);
    try {
      const res = await api.getAIStatus();
      setAiStatus(res);
    } catch (err) {
      console.error('Test connection failed:', err);
    } finally {
      setIsTestingAI(false);
    }
  };

  const handleUpdateModel = async () => {
    try {
      await api.setActiveModel(selectedModel);
      const updated = await api.getAIStatus();
      setAiStatus(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update model:', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const updated = await api.updateUserProfile(profile);
      setProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleWipeData = async () => {
    setIsWiping(true);
    try {
      await api.clearAllData();
      const st = await api.getStorageInfo();
      setStorage(st);
      setIsClearModalOpen(false);
      window.dispatchEvent(new CustomEvent('openledger:data-updated'));
    } catch (err) {
      console.error('Failed to wipe data:', err);
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System & Profile Settings</h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure local open-weight AI inference, storage paths, profile parameters, and privacy controls.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* 1. Local AI Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Local AI Model Configuration (Ollama)</h3>
          </div>
          <Badge variant={aiStatus?.is_connected ? 'emerald' : 'amber'}>
            {aiStatus?.is_connected ? 'Connected' : 'Daemon Offline'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">Ollama Host URL</label>
            <input
              type="text"
              readOnly
              value={aiStatus?.host || 'http://127.0.0.1:11434'}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-700"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Configured via <code className="font-mono">OLLAMA_BASE_URL</code> environment variable.
            </p>
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Active Model Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                placeholder="e.g. llama3.2, mistral, qwen2.5:7b"
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <Button size="sm" variant="outline" onClick={handleUpdateModel}>
                Save Model
              </Button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Any installed Ollama model name (e.g. <code className="font-mono">llama3.2</code>, <code className="font-mono">mistral</code>, <code className="font-mono">qwen2.5:7b</code>).
            </p>
          </div>
        </div>

        {/* Installed Models list if available */}
        {aiStatus?.available_models && aiStatus.available_models.length > 0 && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="font-semibold text-slate-700 block mb-1">
              Detected Models Installed on Local Machine:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {aiStatus.available_models.map((m: string) => (
                <button
                  key={m}
                  onClick={() => setSelectedModel(m)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                    selectedModel === m
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-500">
            {aiStatus?.version ? `Ollama Daemon Version: ${aiStatus.version}` : 'Runs on local loopback (127.0.0.1)'}
          </span>
          <Button
            size="sm"
            variant="outline"
            isLoading={isTestingAI}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={handleTestAIConnection}
          >
            Test Connection
          </Button>
        </div>
      </div>

      {/* 2. User & Business Profile */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-slate-200 p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <User className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-sm text-slate-900">User Profile & Currency Settings</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">Full Name</label>
            <input
              type="text"
              required
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Business / Agency Name</label>
            <input
              type="text"
              required
              value={profile.business_name}
              onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Contact Email</label>
            <input
              type="email"
              required
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Default Reporting Currency</label>
            <select
              value={profile.default_currency}
              onChange={(e) => setProfile({ ...profile, default_currency: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
            >
              <option value="USD">USD ($) — US Dollar</option>
              <option value="EUR">EUR (€) — Euro</option>
              <option value="GBP">GBP (£) — British Pound</option>
              <option value="CAD">CAD ($) — Canadian Dollar</option>
              <option value="AUD">AUD ($) — Australian Dollar</option>
              <option value="INR">INR (₹) — Indian Rupee</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button size="sm" variant="primary" type="submit" isLoading={isSavingProfile}>
            <Save className="w-3.5 h-3.5" /> Save Profile
          </Button>
        </div>
      </form>

      {/* 3. Local Storage & Data Operations */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card space-y-4 text-xs">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Database className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-sm text-slate-900">Database & File Storage Status</h3>
        </div>

        <div className="space-y-2 text-slate-600">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="font-medium text-slate-700">SQLite Database Path:</span>
            <span className="font-mono text-slate-800">{storage?.database_path || 'openledger.db'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="font-medium text-slate-700">Database Disk Size:</span>
            <span className="font-mono text-slate-800">{storage?.database_size_formatted || '0 B'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="font-medium text-slate-700">Uploaded Documents Folder:</span>
            <span className="font-mono text-slate-800">{storage?.uploads_path || './uploads'}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="font-medium text-slate-700">Total Uploads Size:</span>
            <span className="font-mono text-slate-800">{storage?.uploads_size_formatted || '0 B'}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <a
              href="/api/transactions/export/csv"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium"
            >
              <Download className="w-3.5 h-3.5" /> Export All Ledger Data (CSV)
            </a>
          </div>

          <Button
            size="sm"
            variant="danger"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => setIsClearModalOpen(true)}
          >
            Clear All Data
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Confirm Storage Reset"
        description="Are you sure you want to delete all uploaded invoices and transaction ledger records? This action cannot be reversed."
        maxWidth="sm"
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" size="sm" onClick={() => setIsClearModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" isLoading={isWiping} onClick={handleWipeData}>
            Permanently Wipe
          </Button>
        </div>
      </Modal>
    </div>
  );
};
