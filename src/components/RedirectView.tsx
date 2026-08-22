import { useState, useEffect } from 'react';
import { trackClick } from '../lib/api.ts';
import { AlertCircle, ExternalLink, ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';

interface RedirectViewProps {
  alias: string;
  onGoHome: () => void;
}

export function RedirectView({ alias, onGoHome }: RedirectViewProps) {
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'notFound' | 'inactive' | 'error'>('loading');
  const [destinationUrl, setDestinationUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function performRedirect() {
      try {
        const res = await trackClick(alias);
        if (!isMounted) return;

        if (res.success && res.destinationUrl) {
          setDestinationUrl(res.destinationUrl);
          setStatus('redirecting');

          // Smooth timeout to allow visual feedback, then redirect
          setTimeout(() => {
            if (isMounted) {
              window.location.href = res.destinationUrl!;
            }
          }, 800);
        } else {
          if (res.error === 'Link ini tidak aktif.') {
            setStatus('inactive');
          } else {
            setStatus('notFound');
          }
          setErrorMsg(res.error || 'Link tidak ditemui.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMsg('Ralat memproses pautan redirect.');
      }
    }

    performRedirect();

    return () => {
      isMounted = false;
    };
  }, [alias]);

  if (status === 'loading' || status === 'redirecting') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Mengarahkan ke destinasi...</h2>
          <p className="text-xs text-zinc-400 font-mono mb-4">/{alias}</p>

          {destinationUrl && (
            <div className="bg-[#101012] p-3 rounded-xl border border-[#27272A] text-[11px] font-mono text-zinc-300 truncate mb-5">
              {destinationUrl}
            </div>
          )}

          {destinationUrl && (
            <a
              href={destinationUrl}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-xl transition-colors shadow-md shadow-emerald-500/20"
            >
              <span>Buka Sekarang</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    );
  }

  if (status === 'inactive') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold mb-3">
            Status: Inactive
          </span>
          <h2 className="text-xl font-bold text-white mb-2">Link Ini Tidak Aktif</h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            Pautan pendek <code className="text-amber-400 font-mono">/{alias}</code> telah dinyahaktifkan oleh pentadbir sistem.
          </p>

          <button
            onClick={onGoHome}
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-[#27272A] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Utama</span>
          </button>
        </div>
      </div>
    );
  }

  // Not Found (404) or Error
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <span className="inline-block px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-xs font-semibold mb-3">
          404 Not Found
        </span>
        <h2 className="text-xl font-bold text-white mb-2">Link Tidak Ditemui</h2>
        <p className="text-xs text-zinc-400 mb-2 leading-relaxed">
          Pautan pendek <code className="text-rose-400 font-mono">/{alias}</code> tidak wujud atau telah dipadam.
        </p>
        <p className="text-[11px] text-zinc-500 mb-6">
          Sila pastikan ejaan alias adalah tepat.
        </p>

        <button
          onClick={onGoHome}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-xl transition-colors shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke SYNCROZZ Link</span>
        </button>
      </div>
    </div>
  );
}
