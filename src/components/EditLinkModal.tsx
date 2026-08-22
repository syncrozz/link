import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { ShortLink } from '../types.ts';

interface EditLinkModalProps {
  link: ShortLink | null;
  displayDomain: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    oldAlias: string,
    updates: {
      newAlias?: string;
      destinationUrl?: string;
      status?: 'active' | 'inactive';
      notes?: string;
    }
  ) => Promise<boolean>;
}

export function EditLinkModal({
  link,
  displayDomain,
  isOpen,
  onClose,
  onSave,
}: EditLinkModalProps) {
  const [alias, setAlias] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (link) {
      setAlias(link.alias);
      setDestinationUrl(link.destinationUrl);
      setStatus(link.status);
      setNotes(link.notes || '');
      setError(null);
    }
  }, [link]);

  if (!isOpen || !link) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanAlias = alias.toLowerCase().trim();
    const cleanUrl = destinationUrl.trim();

    if (!cleanAlias) {
      setError('Sila masukkan custom alias.');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(cleanAlias)) {
      setError('Alias hanya boleh mengandungi huruf kecil (a-z), nombor (0-9), dan tanda sempang (-).');
      return;
    }

    if (!cleanUrl) {
      setError('Sila masukkan destination URL.');
      return;
    }

    setIsLoading(true);
    const success = await onSave(link.alias, {
      newAlias: cleanAlias !== link.alias ? cleanAlias : undefined,
      destinationUrl: cleanUrl,
      status,
      notes: notes.trim(),
    });
    setIsLoading(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        id="modal-edit-link"
        className="bg-[#18181B] border border-[#27272A] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#27272A]">
          <div>
            <h3 className="text-lg font-bold text-white">Kemaskini Short Link</h3>
            <p className="text-xs text-zinc-400 font-mono">ID: {link.id}</p>
          </div>
          <button
            id="btn-close-edit-modal"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Custom Alias */}
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">
              Custom Alias
            </label>
            <div className="flex rounded-xl overflow-hidden border border-[#27272A] bg-[#101012] focus-within:border-emerald-500">
              <span className="inline-flex items-center px-3 bg-[#141416] text-zinc-400 text-xs font-mono border-r border-[#27272A]">
                {displayDomain}/
              </span>
              <input
                id="edit-input-alias"
                type="text"
                value={alias}
                onChange={(e) => {
                  setAlias(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                  if (error) setError(null);
                }}
                className="flex-1 bg-transparent text-emerald-400 px-3 py-2.5 text-xs font-mono font-semibold focus:outline-none"
              />
            </div>
            {alias !== link.alias && (
              <p className="text-[11px] text-amber-400/90 mt-1">
                ⚠️ Menukar alias akan mengemaskini pautan redirect utama.
              </p>
            )}
          </div>

          {/* Destination URL */}
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">
              Destination URL
            </label>
            <input
              id="edit-input-url"
              type="text"
              value={destinationUrl}
              onChange={(e) => {
                setDestinationUrl(e.target.value);
                if (error) setError(null);
              }}
              className="w-full bg-[#101012] border border-[#27272A] text-zinc-100 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Status Radio */}
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">
              Status Pautan
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  status === 'active'
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#101012] border-[#27272A] text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={status === 'active'}
                  onChange={() => setStatus('active')}
                  className="hidden"
                />
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold">Active</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  status === 'inactive'
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                    : 'bg-[#101012] border-[#27272A] text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={status === 'inactive'}
                  onChange={() => setStatus('inactive')}
                  className="hidden"
                />
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-semibold">Inactive</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">
              Nota / Label
            </label>
            <input
              id="edit-input-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Link rasmi SOAR"
              className="w-full bg-[#101012] border border-[#27272A] text-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-zinc-700"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272A]">
            <button
              id="btn-cancel-edit"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              id="btn-save-edit"
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/20"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
