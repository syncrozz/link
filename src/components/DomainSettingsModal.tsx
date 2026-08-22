import React, { useState } from 'react';
import { Globe, X, Check, Save } from 'lucide-react';
import { saveSettings } from '../lib/api.ts';

interface DomainSettingsModalProps {
  isOpen: boolean;
  currentDomain: string;
  onClose: () => void;
  onDomainUpdated: (domain: string) => void;
}

export function DomainSettingsModal({
  isOpen,
  currentDomain,
  onClose,
  onDomainUpdated,
}: DomainSettingsModalProps) {
  const [domain, setDomain] = useState(currentDomain);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (!cleanDomain) return;

    setIsLoading(true);
    try {
      const res = await saveSettings({ displayDomain: cleanDomain });
      if (res.success && res.settings?.displayDomain) {
        onDomainUpdated(res.settings.displayDomain);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1200);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseCurrentHost = () => {
    setDomain(window.location.host);
  };

  const handleUseOfficial = () => {
    setDomain('link.syncrozz.com');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        id="modal-domain-settings"
        className="bg-[#18181B] border border-[#27272A] rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Globe className="w-5 h-5 text-emerald-400" />
            <span>Tetapan Domain Short Link</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">
              Domain Paparan (Display Domain)
            </label>
            <input
              id="input-display-domain"
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="link.syncrozz.com"
              className="w-full bg-[#101012] border border-[#27272A] text-emerald-400 font-mono text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Domain ini digunakan untuk memaparkan dan menyalin pautan pendek.
            </p>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleUseOfficial}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono border border-[#27272A] transition-colors cursor-pointer"
            >
              link.syncrozz.com (Default)
            </button>
            <button
              type="button"
              onClick={handleUseCurrentHost}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono border border-[#27272A] transition-colors cursor-pointer"
            >
              Guna Preview URL Semasa
            </button>
          </div>

          {success && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Domain berjaya dikemaskini!</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272A]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              id="btn-save-domain"
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/20"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Simpan Tetapan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
