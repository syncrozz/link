import React, { useState } from 'react';
import { Shield, KeyRound, Lock, Unlock, X, Check, AlertCircle } from 'lucide-react';
import { verifyAdminPin, changeAdminPin } from '../lib/api.ts';

interface AdminPinModalProps {
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onSuccessLogin: () => void;
  onLogout: () => void;
}

export function AdminPinModal({
  isOpen,
  isAdmin,
  onClose,
  onSuccessLogin,
  onLogout,
}: AdminPinModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'changePin'>('login');
  const [pin, setPin] = useState('');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pin.trim()) {
      setError('Sila masukkan PIN Admin.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyAdminPin(pin);
      if (res.success) {
        onSuccessLogin();
        setPin('');
        onClose();
      } else {
        setError(res.error || 'PIN admin tidak tepat.');
      }
    } catch {
      setError('Ralat sambungan ke pelayan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!oldPin) {
      setError('Sila masukkan PIN lama.');
      return;
    }

    if (!newPin || newPin.length < 4) {
      setError('PIN baharu mesti sekurang-kurangnya 4 aksara.');
      return;
    }

    if (newPin !== confirmPin) {
      setError('Pengesahan PIN baharu tidak sepadan.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await changeAdminPin(oldPin, newPin);
      if (res.success) {
        setSuccess('Admin PIN berjaya dikemaskini!');
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
      } else {
        setError(res.error || 'Gagal mengemaskini PIN.');
      }
    } catch {
      setError('Ralat sambungan ke pelayan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        id="modal-admin-pin"
        className="bg-[#18181B] border border-[#27272A] rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>Akses Pentadbir (Admin PIN)</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        {isAdmin && (
          <div className="flex rounded-xl bg-[#101012] p-1 border border-[#27272A] mt-4 mb-2">
            <button
              onClick={() => {
                setActiveTab('login');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'login' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Status Akses
            </button>
            <button
              onClick={() => {
                setActiveTab('changePin');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'changePin' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tukar PIN
            </button>
          </div>
        )}

        {/* Tab 1: Login / Status */}
        {activeTab === 'login' && (
          <div className="mt-4">
            {isAdmin ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-3">
                  <Unlock className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-300">Admin Mode Aktif</h4>
                    <p className="text-[11px] text-emerald-400/80 mt-0.5">
                      Anda mempunyai kebenaran penuh untuk mencipta, mengedit, memadam, dan mengurus short links.
                    </p>
                  </div>
                </div>

                <button
                  id="btn-admin-logout"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-[#27272A] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Kunci / Log Keluar Admin</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <p className="text-xs text-zinc-400">
                  Masukkan PIN Pentadbir untuk mengakses fungsi pengurusan penuh (Default: <code className="text-emerald-400 font-mono">admin123</code>).
                </p>

                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">
                    Admin PIN
                  </label>
                  <div className="relative">
                    <input
                      id="input-admin-pin"
                      type="password"
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="••••••••"
                      autoFocus
                      className="w-full bg-[#101012] border border-[#27272A] text-white rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:border-emerald-500"
                    />
                    <KeyRound className="w-4 h-4 text-zinc-500 absolute right-3 top-3" />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  id="btn-submit-pin"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {isLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                  <span>Buka Akses Admin</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Change PIN */}
        {activeTab === 'changePin' && (
          <form onSubmit={handleChangePin} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                PIN Semasa
              </label>
              <input
                id="input-old-pin"
                type="password"
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value)}
                placeholder="PIN lama"
                className="w-full bg-[#101012] border border-[#27272A] text-white rounded-xl px-3 py-2 text-xs font-mono tracking-wider focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                PIN Baharu
              </label>
              <input
                id="input-new-pin"
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="PIN baharu (min 4 aksara)"
                className="w-full bg-[#101012] border border-[#27272A] text-white rounded-xl px-3 py-2 text-xs font-mono tracking-wider focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Sahkan PIN Baharu
              </label>
              <input
                id="input-confirm-pin"
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Ulang PIN baharu"
                className="w-full bg-[#101012] border border-[#27272A] text-white rounded-xl px-3 py-2 text-xs font-mono tracking-wider focus:outline-none focus:border-emerald-500"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs">
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>{success}</span>
              </div>
            )}

            <button
              id="btn-save-new-pin"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
              ) : (
                <KeyRound className="w-3.5 h-3.5" />
              )}
              <span>Kemaskini PIN</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
