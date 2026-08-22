import { useState } from 'react';
import {
  Search,
  Copy,
  Check,
  Edit3,
  Trash2,
  ExternalLink,
  MousePointerClick,
  Link as LinkIcon,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Activity,
  FolderOpen,
} from 'lucide-react';
import { ShortLink } from '../types.ts';

interface AdminDashboardProps {
  links: ShortLink[];
  displayDomain: string;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onEdit: (link: ShortLink) => void;
  onDelete: (link: ShortLink) => void;
  onToggleStatus: (link: ShortLink) => void;
  isAdmin: boolean;
}

export function AdminDashboard({
  links,
  displayDomain,
  searchTerm,
  onSearchChange,
  onEdit,
  onDelete,
  onToggleStatus,
  isAdmin,
}: AdminDashboardProps) {
  const [copiedAlias, setCopiedAlias] = useState<string | null>(null);

  const handleCopy = async (alias: string) => {
    const fullUrl = `https://${displayDomain}/${alias}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedAlias(alias);
      setTimeout(() => setCopiedAlias(null), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedAlias(alias);
      setTimeout(() => setCopiedAlias(null), 2000);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('ms-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  // Metrics
  const totalLinks = links.length;
  const totalClicks = links.reduce((sum, item) => sum + (item.clickCount || 0), 0);
  const activeLinks = links.filter((l) => l.status === 'active').length;

  return (
    <div className="w-full max-w-7xl mx-auto mt-12 space-y-6">
      {/* Section Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#F4F4F5] tracking-tight flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>Pengurusan Short Link</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Urus, pantau klik, dan selia semua pautan aktif dalam sistem.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300">
              <LinkIcon className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-zinc-500">Jumlah Link</div>
              <div className="text-sm font-bold text-white font-mono">{totalLinks}</div>
            </div>
          </div>

          <div className="bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-zinc-500">Jumlah Klik</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">{totalClicks}</div>
            </div>
          </div>

          <div className="bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-zinc-500">Aktif</div>
              <div className="text-sm font-bold text-emerald-300 font-mono">
                {activeLinks}/{totalLinks}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl overflow-hidden shadow-2xl">
        {/* Search Bar */}
        <div className="p-4 sm:p-5 border-b border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            <input
              id="input-search-links"
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari berdasarkan alias atau destination URL..."
              className="w-full bg-[#101012] border border-[#27272A] text-zinc-200 placeholder:text-zinc-500 text-xs sm:text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <span>Menunjukkan <strong>{links.length}</strong> rekod</span>
          </div>
        </div>

        {/* Empty State */}
        {links.length === 0 ? (
          <div id="empty-state-container" className="py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 border border-[#27272A] text-zinc-400 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-7 h-7 text-zinc-500" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              🔗 Belum ada short link
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
              Cipta short link pertama anda untuk mula menggunakan SYNCROZZ Link.
            </p>
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#121214] border-b border-[#27272A] text-zinc-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4 sm:px-6">Alias</th>
                  <th className="py-3.5 px-4 sm:px-6">Destination URL</th>
                  <th className="py-3.5 px-4 sm:px-6">Short URL</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Klik</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6">Tarikh Cipta</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]">
                {links.map((link) => {
                  const isCopied = copiedAlias === link.alias;
                  const displayShort = `${displayDomain}/${link.alias}`;

                  return (
                    <tr
                      key={link.id || link.alias}
                      className="hover:bg-zinc-800/40 transition-colors group"
                    >
                      {/* Alias */}
                      <td className="py-4 px-4 sm:px-6 font-mono font-bold">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
                            /{link.alias}
                          </span>
                          {link.notes && (
                            <span className="text-[11px] text-zinc-400 font-sans truncate max-w-[120px] hidden lg:inline" title={link.notes}>
                              • {link.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Destination URL */}
                      <td className="py-4 px-4 sm:px-6 max-w-xs sm:max-w-sm">
                        <div className="flex items-center gap-2">
                          <a
                            href={link.destinationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-300 hover:text-emerald-400 font-mono text-xs truncate max-w-[200px] sm:max-w-[280px] transition-colors"
                            title={link.destinationUrl}
                          >
                            {link.destinationUrl}
                          </a>
                          <a
                            href={link.destinationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Buka URL asal di tab baharu"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Short URL with single-click copy */}
                      <td className="py-4 px-4 sm:px-6">
                        <button
                          onClick={() => handleCopy(link.alias)}
                          className="flex items-center gap-1.5 font-mono text-xs text-zinc-300 hover:text-emerald-400 transition-colors cursor-pointer"
                          title="Klik untuk salin short link"
                        >
                          <span className="truncate max-w-[160px] sm:max-w-[200px]">{displayShort}</span>
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 shrink-0" />
                          )}
                        </button>
                      </td>

                      {/* Klik */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#101012] border border-[#27272A] text-xs font-mono font-bold text-emerald-400">
                          <MousePointerClick className="w-3 h-3 text-zinc-500" />
                          <span>{link.clickCount || 0}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <button
                          onClick={() => onToggleStatus(link)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                            link.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                          }`}
                          title={`Tukar status ke ${link.status === 'active' ? 'Inactive' : 'Active'}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              link.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                            }`}
                          />
                          <span className="capitalize">{link.status}</span>
                        </button>
                      </td>

                      {/* Created Date */}
                      <td className="py-4 px-4 sm:px-6 text-xs text-zinc-400 whitespace-nowrap">
                        {formatDate(link.createdAt)}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Copy Button */}
                          <button
                            id={`btn-copy-${link.alias}`}
                            onClick={() => handleCopy(link.alias)}
                            title="Salin short link"
                            className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                          >
                            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>

                          {/* Test redirect in tab */}
                          <a
                            id={`btn-test-${link.alias}`}
                            href={`/r/${link.alias}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Uji redirect"
                            className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          {/* Edit Button */}
                          <button
                            id={`btn-edit-${link.alias}`}
                            onClick={() => onEdit(link)}
                            title="Kemaskini maklumat link"
                            className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            id={`btn-delete-${link.alias}`}
                            onClick={() => onDelete(link)}
                            title="Padam link (Deleted = Deleted)"
                            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
