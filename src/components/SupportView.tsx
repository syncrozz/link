import { useState } from 'react';
import { ArrowLeft, Download, ChevronDown, CheckCircle2, QrCode, Heart, Sparkles, Smartphone } from 'lucide-react';

interface SupportViewProps {
  onReturn: () => void;
}

const QR_IMAGE_URL = 'https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/Bank%20QR/QR%20RYT%20for%20Sumbangan.jpg';

export function SupportView({ onReturn }: SupportViewProps) {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleSaveQr = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(QR_IMAGE_URL, { mode: 'cors' });
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'SYNCROZZ-Sumbangan-QR.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch {
      // Fallback: direct download link / open in new tab
      const link = document.createElement('a');
      link.href = QR_IMAGE_URL;
      link.target = '_blank';
      link.download = 'SYNCROZZ-Sumbangan-QR.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Return Button Top Navigation */}
      <div className="mb-6">
        <button
          id="btn-return-top"
          onClick={onReturn}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-[#18181B] hover:bg-zinc-800 border border-[#27272A] hover:border-zinc-700 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke PLATFORM</span>
        </button>
      </div>

      {/* Main Support Card */}
      <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-6 sm:p-8 shadow-xl text-center relative overflow-hidden">
        {/* Subtle Ambient Accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Title */}
        <div className="inline-flex items-center justify-center gap-2 mb-3">
          <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Heart className="w-5 h-5 fill-rose-500/20 text-rose-400" />
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
          Sokong Inovasi Ini ❤️
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-zinc-300 max-w-lg mx-auto leading-relaxed mb-6">
          Platform SYNCROZZ Link dibangunkan untuk memudahkan pengurusan pautan anda secara pantas, selamat dan percuma. Jika platform ini memberi manfaat kepada anda, sokongan ikhlas anda amat kami hargai untuk mengekalkan kelangsungan dan inovasi berterusan.
        </p>

        {/* QR Code Container */}
        <div className="my-6 inline-block bg-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-zinc-200 max-w-[280px] sm:max-w-[320px] w-full">
          <div className="relative aspect-square w-full bg-white flex items-center justify-center rounded-xl overflow-hidden">
            <img
              id="support-qr-image"
              src={QR_IMAGE_URL}
              alt="SYNCROZZ Sumbangan DuitNow QR Code"
              className="w-full h-full object-contain select-none"
              loading="eager"
            />
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
            <QrCode className="w-3.5 h-3.5 text-zinc-800" />
            <span>Imbas Menggunakan Mana-Mana Bank / E-Wallet</span>
          </div>
        </div>

        {/* Save QR Code Button */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            id="btn-save-qr"
            onClick={handleSaveQr}
            disabled={isDownloading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold bg-white text-zinc-900 hover:bg-zinc-100 active:scale-95 transition-all shadow-md hover:shadow cursor-pointer disabled:opacity-50"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>QR Berjaya Disimpan!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-zinc-900" />
                <span>Save QR Code</span>
              </>
            )}
          </button>
        </div>

        {/* How to Pay Accordion */}
        <div className="max-w-lg mx-auto text-left mb-6">
          <div className="border border-[#27272A] rounded-xl overflow-hidden bg-[#18181B]/80">
            <button
              id="accordion-how-to-pay-trigger"
              onClick={() => setIsAccordionOpen((prev) => !prev)}
              aria-expanded={isAccordionOpen}
              className="w-full flex items-center justify-between px-4 py-3.5 text-xs sm:text-sm font-semibold text-zinc-200 hover:text-white transition-colors cursor-pointer bg-[#18181B]"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cara Bayar Guna Galeri (How To Pay)</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                  isAccordionOpen ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {isAccordionOpen && (
              <div
                id="accordion-how-to-pay-content"
                className="px-4 py-4 text-xs sm:text-sm text-zinc-300 border-t border-[#27272A] space-y-3 bg-[#121214]/90 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <ol className="space-y-2.5 list-none">
                  <li className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>Tekan butang <strong className="text-white">"Save QR Code"</strong> untuk menyimpan imej kod QR ke peranti/galeri anda.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>Buka aplikasi perbankan (cth: MAE / Maybank, CIMB, Bank Islam) atau e-dompet (cth: Touch 'n Go eWallet).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>Pilih menu <strong className="text-white">DuitNow QR / Scan</strong>, kemudian tekan ikon galeri foto (<em>"Scan from Gallery / Album"</em>).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] shrink-0 mt-0.5">
                      4
                    </span>
                    <span>Pilih gambar kod QR SYNCROZZ yang disimpan tadi dari galeri anda.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] shrink-0 mt-0.5">
                      5
                    </span>
                    <span>Sahkan jumlah sumbangan mengikut keikhlasan anda dan lengkapkan pembayaran.</span>
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Appreciation Message */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium text-emerald-300 bg-emerald-950/40 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>RM1 pun amat dihargai 👏</span>
          </div>
        </div>

        {/* Bottom Return Button */}
        <div>
          <button
            id="btn-return-platform"
            onClick={onReturn}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white bg-[#18181B] hover:bg-zinc-800 border border-[#27272A] hover:border-zinc-700 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke PLATFORM</span>
          </button>
        </div>
      </div>
    </div>
  );
}
