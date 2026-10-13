import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DocumentUploadModal } from '../documents/DocumentUploadModal';
import { api } from '../../services/api';
import type { Category } from '../../types';

export const MainLayout: React.FC = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.listCategories().then(setCategories).catch(console.error);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onOpenUpload={() => setIsUploadOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet context={{ openUpload: () => setIsUploadOpen(true), categories }} />
          </div>
        </main>
      </div>

      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        categories={categories}
        onDocumentProcessed={() => {
          // Trigger any global refresh event if needed
          window.dispatchEvent(new CustomEvent('openledger:data-updated'));
        }}
      />
    </div>
  );
};
