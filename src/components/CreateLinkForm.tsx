import React, { useState } from 'react';
import { Link2, Copy, Check, ExternalLink, Sparkles, AlertCircle, ArrowRight, ClipboardPaste } from 'lucide-react';
import { ShortLink } from '../types.ts';

interface CreateLinkFormProps {
  displayDomain: string;
  onLinkCreated: (link: ShortLink) => void;
}

export function CreateLinkForm({ displayDomain, onLinkCreated }: CreateLinkFormProps) {
  const [destinationUrl, setDestinationUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<ShortLink | null>(null);
  const [copied, setCopied] = useState(false);

  // Clean alias input dynamically: lowercase, no whitespace
  const handleAliasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setAlias(raw);
    if (errorMessage) setErrorMessage(null);
  };

  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setDestinationUrl(text.trim());
        if (errorMessage) setErrorMessage(null);
      }
    } catch {
      // Clipboard read may be restricted, ignore silently
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    const cleanUrl = destinationUrl.trim();
    const cleanAlias = alias.toLowerCase().trim();

    if (!cleanUrl) {
      setErrorMessage('Sila masukkan destination URL.');
      return;
    }

    if (!cleanAlias) {
      setErrorMessage('Sila masukkan custom alias.');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(cleanAlias)) {
      setErrorMessage('Alias hanya boleh mengandungi huruf kecil (a-z), nombor (0-9), dan tanda sempang (-).');
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setErrorMessage('Anda sedang offline. Sambungan internet diperlukan untuk menghasilkan short link.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationUrl: cleanUrl,
          alias: cleanAlias,
          notes: notes.trim() || undefined,
          status: 'active',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        let msg = data.error || 'Gagal mencipta short link.';
        if (msg.includes('5 NOT_FOUND') || msg.includes('not-found')) {
          msg = 'Pangkalan data sedang dimuatkan atau pautan tidak ditemui. Sila cuba sebentar lagi.';
        } else if (msg.includes('ALREADY_EXISTS') || msg.toLowerCase().includes('alias ini telah digunakan')) {
          msg = 'Alias ini telah digunakan. Sila gunakan custom alias yang lain.';
        }
        setErrorMessage(msg);
        setIsLoading(false);
        return;
      }

      setCreatedLink(data.link);
      onLinkCreated(data.link);
      setDestinationUrl('');
      setAlias('');
      setNotes('');
    } catch (err: any) {
      setErrorMessage('Ralat sambungan ke pelayan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async (targetAlias: string) => {
    // Generate standard display URL
    const fullUrl = `https://${displayDomain}/${targetAlias}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const livePreviewUrl = alias ? `https://${displayDomain}/${alias}` : `https://${displayDomain}/[alias]`;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simple • Fast • Authoritative</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F4F4F5] tracking-tight mb-2">
          SYNCROZZ Link
        </h1>
        <p className="text-zinc-400 text-base sm:text-lg max-w-lg mx-auto">
          Pendekkan dan urus link anda dengan mudah.
        </p>
      </div>

      {/* Main Creation Card */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle geometric glow accent */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {/* Destination URL Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="input-destination-url" className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Destination URL <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                id="btn-paste-url"
                onClick={handlePasteUrl}
                className="text-[11px] font-medium text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ClipboardPaste className="w-3 h-3" />
                <span>Tampal dari Clipboard</span>
              </button>
            </div>
            <div className="relative">
              <input
                id="input-destination-url"
                type="text"
                value={destinationUrl}
                onChange={(e) => {
                  setDestinationUrl(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="https://docs.google.com/spreadsheets/d/1rVq7hhQxm1CT1f5GVZ3g9vZy-_6gBM5d6vk3YAXYlUg/edit?usp=sharing"
                className="w-full bg-[#101012] border border-[#27272A] text-zinc-100 placeholder:text-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Masukkan pautan penuh (contoh: Google Sheets, Form, Drive, Website, Meeting).
            </p>
          </div>

          {/* Custom Alias Field */}
          <div>
            <label htmlFor="input-custom-alias" className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
              Custom Alias <span className="text-rose-400">*</span>
            </label>
            <div className="flex rounded-xl overflow-hidden border border-[#27272A] focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all bg-[#101012]">
              <span className="inline-flex items-center px-4 bg-[#141416] text-zinc-400 text-xs sm:text-sm font-mono border-r border-[#27272A] select-none">
                {displayDomain}/
              </span>
              <input
                id="input-custom-alias"
                type="text"
                value={alias}
                onChange={handleAliasChange}
                placeholder="soar"
                className="flex-1 bg-transparent text-emerald-400 placeholder:text-zinc-600 px-4 py-3.5 text-sm font-mono font-semibold focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[11px]">
              <span className="text-zinc-500">
                Huruf kecil, tanpa jarak (contoh: <code className="text-zinc-400">soar</code>, <code className="text-zinc-400">pic-soar</code>, <code className="text-zinc-400">borang</code>)
              </span>
              {alias && (
                <span className="text-zinc-400 font-mono hidden sm:inline">
                  Preview: <span className="text-emerald-400">{livePreviewUrl}</span>
                </span>
              )}
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label htmlFor="input-notes" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Label / Nota Ringkas <span className="text-zinc-600 text-[10px] font-normal lowercase">(pilihan)</span>
            </label>
            <input
              id="input-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Borang Pendaftaran SOAR 2026"
              className="w-full bg-[#101012] border border-[#27272A] text-zinc-200 placeholder:text-zinc-600 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-zinc-700"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              id="error-create-link"
              className="flex items-start gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="btn-create-shortlink"
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer text-sm"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                <span>Mencipta short link...</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                <span>🔗 Create Short Link</span>
              </>
            )}
          </button>
        </form>

        {/* Success Card */}
        {createdLink && (
          <div
            id="card-created-success"
            className="mt-6 pt-6 border-t border-[#27272A] animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold mb-3">
                <Check className="w-4 h-4 bg-emerald-500 text-zinc-950 rounded-full p-0.5" />
                <span>✅ Short link berjaya dicipta</span>
              </div>

              {/* Short Link display box */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#101012] border border-emerald-500/20 rounded-lg p-3">
                <div className="overflow-hidden">
                  <div className="text-[11px] text-zinc-400 font-mono mb-0.5">Short URL:</div>
                  <div className="text-emerald-300 font-mono font-bold text-sm sm:text-base truncate">
                    {displayDomain}/{createdLink.alias}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Copy Button */}
                  <button
                    id="btn-copy-new-link"
                    type="button"
                    onClick={() => handleCopyLink(createdLink.alias)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm shadow-emerald-500/20"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>✓ Link copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  {/* Direct Test in window */}
                  <a
                    id="btn-test-new-link"
                    href={`/r/${createdLink.alias}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Uji redirect ke destinasi"
                    className="flex items-center justify-center p-2 text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-[#27272A] rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Destination preview */}
              <div className="mt-3 text-[11px] text-zinc-400 flex items-center gap-1.5 truncate">
                <span className="text-zinc-500">Destinasi:</span>
                <span className="text-zinc-300 truncate font-mono">{createdLink.destinationUrl}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
