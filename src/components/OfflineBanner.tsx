import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineBannerProps {
  onRetry: () => void;
}

export function OfflineBanner({ onRetry }: OfflineBannerProps) {
  return (
    <div
      id="offline-status-banner"
      role="alert"
      className="bg-amber-950/70 border-b border-amber-500/30 px-4 py-2.5 text-amber-200 text-sm backdrop-blur-sm sticky top-16 z-30 flex items-center justify-between gap-3 shadow-lg"
    >
      <div className="flex items-center gap-2.5 max-w-5xl mx-auto w-full justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-md bg-amber-500/20 text-amber-400">
            <WifiOff className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white">Anda sedang offline. </span>
            <span className="text-amber-200/90 text-xs sm:text-sm">
              Sambungan internet diperlukan untuk mengurus dan menggunakan short link.
            </span>
          </div>
        </div>

        <button
          id="btn-offline-retry"
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-white border border-amber-500/40 rounded-md text-xs font-semibold transition-colors shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Semak Semula</span>
        </button>
      </div>
    </div>
  );
}
