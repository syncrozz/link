import { Shield, ShieldCheck, Settings, RefreshCw, Download } from 'lucide-react';

interface NavbarProps {
  isAdmin: boolean;
  displayDomain: string;
  onOpenPinModal: () => void;
  onOpenSettingsModal: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
  onGoHome?: () => void;
}

export function Navbar({
  isAdmin,
  displayDomain,
  onOpenPinModal,
  onOpenSettingsModal,
  onRefresh,
  isLoading,
  canInstallPwa,
  onInstallPwa,
  onGoHome,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0B]/90 backdrop-blur-md border-b border-[#27272A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={onGoHome}
          className={`flex items-center gap-3 ${onGoHome ? 'cursor-pointer select-none group' : ''}`}
        >
          <img
            src="https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/logo/Link/android-chrome-192x192.png"
            alt="SYNCROZZ Link"
            className="w-10 h-10 rounded-xl object-contain shadow-sm shadow-emerald-500/10 group-hover:scale-105 transition-transform"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-emerald-400 transition-colors">SYNCROZZ Link</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                v1.0
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono hidden sm:block">
              {displayDomain}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* PWA Install Button (Shown when browser supports installation) */}
          {canInstallPwa && onInstallPwa && (
            <button
              id="btn-pwa-install"
              onClick={onInstallPwa}
              title="Pasang SYNCROZZ Link sebagai Aplikasi (PWA)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-lg transition-colors cursor-pointer animate-pulse hover:animate-none"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pasang App</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            id="btn-refresh-data"
            onClick={onRefresh}
            title="Muat semula senarai"
            disabled={isLoading}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 rounded-lg border border-[#27272A] hover:border-zinc-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Domain Settings */}
          {isAdmin && (
            <button
              id="btn-domain-settings"
              onClick={onOpenSettingsModal}
              title="Tetapan Domain & Sistem"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-[#18181B] hover:bg-zinc-800 border border-[#27272A] hover:border-zinc-700 rounded-lg transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden md:inline">Domain</span>
            </button>
          )}

          {/* Admin Access Status / PIN Button */}
          <button
            id="btn-admin-access"
            onClick={onOpenPinModal}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isAdmin
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/40'
                : 'bg-[#18181B] text-zinc-300 border-[#27272A] hover:border-zinc-700 hover:text-white'
            }`}
          >
            {isAdmin ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Unlocked</span>
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5 text-zinc-400" />
                <span>Admin Login</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
