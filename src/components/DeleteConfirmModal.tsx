import { Trash2, AlertTriangle, X } from 'lucide-react';
import { ShortLink } from '../types.ts';

interface DeleteConfirmModalProps {
  link: ShortLink | null;
  displayDomain: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (alias: string) => Promise<void>;
  isLoading: boolean;
}

export function DeleteConfirmModal({
  link,
  displayDomain,
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: DeleteConfirmModalProps) {
  if (!isOpen || !link) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        id="modal-delete-link"
        className="bg-[#18181B] border border-[#27272A] rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-white">Padam Short Link?</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Tindakan ini adalah kekal (<span className="text-rose-400 font-semibold">Deleted = Deleted</span>).
              Pautan ini tidak akan dapat diakses atau redirect lagi selepas dipadam.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Link summary box */}
        <div className="mt-4 p-3.5 bg-[#101012] border border-[#27272A] rounded-xl">
          <div className="text-xs font-mono font-bold text-rose-400">
            /{link.alias}
          </div>
          <div className="text-[11px] text-zinc-500 truncate mt-1">
            {link.destinationUrl}
          </div>
          <div className="text-[11px] text-zinc-400 mt-2 flex items-center gap-3">
            <span>Klik terkumpul: <strong className="text-zinc-200">{link.clickCount}</strong></span>
            <span>Status: <strong className="text-zinc-200 uppercase">{link.status}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            id="btn-cancel-delete"
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            id="btn-confirm-delete"
            type="button"
            onClick={() => onConfirm(link.alias)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-rose-600/20"
          >
            {isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>Ya, Padam Pautan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
