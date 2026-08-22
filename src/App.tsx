import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { CreateLinkForm } from './components/CreateLinkForm.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { EditLinkModal } from './components/EditLinkModal.tsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.tsx';
import { AdminPinModal } from './components/AdminPinModal.tsx';
import { DomainSettingsModal } from './components/DomainSettingsModal.tsx';
import { RedirectView } from './components/RedirectView.tsx';
import { OfflineBanner } from './components/OfflineBanner.tsx';
import { ShortLink } from './types.ts';
import { fetchLinks, updateLink, deleteLink, getSettings } from './lib/api.ts';
import { initInstallPromptListener, promptInstall } from './lib/pwa.ts';
import { CheckCircle2, AlertCircle, Link2 } from 'lucide-react';

export default function App() {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayDomain, setDisplayDomain] = useState('link.syncrozz.com');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('syncrozz_admin_auth') === 'true';
    }
    return false;
  });

  // PWA & Network State
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  // Modals & Active Items
  const [editingLink, setEditingLink] = useState<ShortLink | null>(null);
  const [deletingLink, setDeletingLink] = useState<ShortLink | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Detect if current URL is a direct short-link path
  const [redirectAlias, setRedirectAlias] = useState<string | null>(() => {
    const pathname = window.location.pathname.replace(/^\/+/, '').trim();
    // Exclude root, static, manifest, or service worker routes
    if (
      pathname &&
      !pathname.startsWith('api') &&
      !pathname.startsWith('src') &&
      !pathname.startsWith('@') &&
      !pathname.startsWith('assets') &&
      pathname !== 'index.html' &&
      pathname !== 'admin' &&
      pathname !== 'manifest.webmanifest' &&
      pathname !== 'manifest.json' &&
      pathname !== 'sw.js'
    ) {
      // If path is like r/soar, strip the r/
      if (pathname.startsWith('r/')) {
        return pathname.replace(/^r\//, '');
      }
      return pathname;
    }
    return null;
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const loadData = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [linksRes, settingsRes] = await Promise.all([
        fetchLinks(searchTerm),
        getSettings(),
      ]);

      if (linksRes.success && linksRes.links) {
        setLinks(linksRes.links);
      }

      if (settingsRes.success && settingsRes.settings?.displayDomain) {
        setDisplayDomain(settingsRes.settings.displayDomain);
      }
    } catch {
      showToast('Gagal memuat data dari pelayan.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  // Network online/offline listener and PWA install prompt
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Sambungan internet kembali aktif.', 'success');
      loadData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    initInstallPromptListener((available) => {
      setCanInstallPwa(available);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Trigger PWA installation dialog
  const handleInstallPwa = async () => {
    const installed = await promptInstall();
    if (installed) {
      setCanInstallPwa(false);
      showToast('PWA SYNCROZZ Link berjaya dipasang!', 'success');
    }
  };

  // Handler for creating link
  const handleLinkCreated = (newLink: ShortLink) => {
    setLinks((prev) => [newLink, ...prev.filter((l) => l.alias !== newLink.alias)]);
    showToast(`Short link /${newLink.alias} berjaya dicipta!`, 'success');
  };

  // Handler for saving edit
  const handleSaveEdit = async (
    oldAlias: string,
    updates: {
      newAlias?: string;
      destinationUrl?: string;
      status?: 'active' | 'inactive';
      notes?: string;
    }
  ): Promise<boolean> => {
    if (!navigator.onLine) {
      showToast('Anda sedang offline. Sila sambung ke internet.', 'error');
      return false;
    }

    try {
      const res = await updateLink(oldAlias, updates);
      if (res.success && res.link) {
        setLinks((prev) =>
          prev.map((l) => (l.alias === oldAlias ? res.link! : l))
        );
        showToast(`Short link /${res.link.alias} berjaya dikemaskini!`, 'success');
        return true;
      } else {
        showToast(res.error || 'Gagal mengemaskini link.', 'error');
        return false;
      }
    } catch {
      showToast('Ralat sambungan pelayan.', 'error');
      return false;
    }
  };

  // Handler for deleting link (Deleted = Deleted)
  const handleDeleteConfirm = async (alias: string) => {
    if (!navigator.onLine) {
      showToast('Anda sedang offline. Sila sambung ke internet.', 'error');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteLink(alias);
      if (res.success) {
        setLinks((prev) => prev.filter((l) => l.alias !== alias));
        setDeletingLink(null);
        showToast(`Short link /${alias} telah dipadam kekal.`, 'success');
      } else {
        showToast(res.error || 'Gagal memadam link.', 'error');
      }
    } catch {
      showToast('Ralat sambungan pelayan.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler for toggling status
  const handleToggleStatus = async (link: ShortLink) => {
    if (!navigator.onLine) {
      showToast('Anda sedang offline. Sila sambung ke internet.', 'error');
      return;
    }

    const nextStatus = link.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await updateLink(link.alias, { status: nextStatus });
      if (res.success && res.link) {
        setLinks((prev) =>
          prev.map((l) => (l.alias === link.alias ? res.link! : l))
        );
        showToast(
          `Status /${link.alias} ditukar ke ${nextStatus === 'active' ? 'Aktif' : 'Tidak Aktif'}.`,
          'success'
        );
      }
    } catch {
      showToast('Gagal menukar status pautan.', 'error');
    }
  };

  // If directly navigated to a short-link alias
  if (redirectAlias) {
    return (
      <RedirectView
        alias={redirectAlias}
        onGoHome={() => {
          setRedirectAlias(null);
          window.history.pushState({}, '', '/');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F4F4F5] flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/90 border-rose-500/30 text-rose-300'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        isAdmin={isAdmin}
        displayDomain={displayDomain}
        onOpenPinModal={() => setIsPinModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onRefresh={loadData}
        isLoading={isLoading}
        canInstallPwa={canInstallPwa}
        onInstallPwa={handleInstallPwa}
      />

      {/* Offline Status Warning Banner */}
      {!isOnline && <OfflineBanner onRetry={loadData} />}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Create Short Link Form */}
        <CreateLinkForm
          displayDomain={displayDomain}
          onLinkCreated={handleLinkCreated}
        />

        {/* Short Links Management Dashboard */}
        <AdminDashboard
          links={links}
          displayDomain={displayDomain}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onEdit={(link) => setEditingLink(link)}
          onDelete={(link) => setDeletingLink(link)}
          onToggleStatus={handleToggleStatus}
          isAdmin={isAdmin}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#27272A] bg-[#121214]/60 py-6 text-center text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-zinc-300">SYNCROZZ Link v1.0</span>
            <span>— Simple, Fast & Authoritative</span>
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">
            link.syncrozz.com • Production Ready Short-link Platform
          </p>
        </div>
      </footer>

      {/* Modals */}
      <EditLinkModal
        link={editingLink}
        displayDomain={displayDomain}
        isOpen={!!editingLink}
        onClose={() => setEditingLink(null)}
        onSave={handleSaveEdit}
      />

      <DeleteConfirmModal
        link={deletingLink}
        displayDomain={displayDomain}
        isOpen={!!deletingLink}
        onClose={() => setDeletingLink(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />

      <AdminPinModal
        isOpen={isPinModalOpen}
        isAdmin={isAdmin}
        onClose={() => setIsPinModalOpen(false)}
        onSuccessLogin={() => {
          setIsAdmin(true);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('syncrozz_admin_auth', 'true');
          }
          showToast('Akses Admin berjaya diaktifkan!', 'success');
        }}
        onLogout={() => {
          setIsAdmin(false);
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('syncrozz_admin_auth');
          }
          showToast('Admin dikunci.', 'success');
        }}
      />

      <DomainSettingsModal
        isOpen={isSettingsModalOpen}
        currentDomain={displayDomain}
        onClose={() => setIsSettingsModalOpen(false)}
        onDomainUpdated={(newDom) => {
          setDisplayDomain(newDom);
          showToast(`Domain paparan ditukar ke ${newDom}`, 'success');
        }}
      />
    </div>
  );
}
