import React from 'react';
import { Heart } from 'lucide-react';

interface FooterProps {
  onOpenSupport: () => void;
}

export function Footer({ onOpenSupport }: FooterProps) {
  const handleSupportClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    // If inside SPA, smoothly open support view without full page reload
    onOpenSupport();
  };

  return (
    <footer className="border-t border-[#27272A] bg-[#121214]/80 backdrop-blur-sm py-6 text-xs text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Support CTA Button */}
        <div className="flex items-center">
          <a
            id="footer-support-cta"
            href="https://syncrozz.com/#support"
            onClick={(e) => {
              // Smooth SPA navigation while keeping exact destination URL semantics
              e.preventDefault();
              handleSupportClick(e);
            }}
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white text-zinc-900 hover:bg-zinc-100 active:scale-95 border border-zinc-200 shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
            title="Sokong Inovasi Ini"
          >
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 group-hover:scale-110 transition-transform duration-200" />
            <span>Sokong Inovasi Ini ❤️</span>
          </a>
        </div>

        {/* Developer Credit */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
          <span>Develop By</span>
          <a
            id="footer-dev-credit"
            href="https://wasap.my/60145313756"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-300 hover:text-emerald-400 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
            title="Hubungi Developer Syncrozz melalui WhatsApp"
          >
            Syncrozz
          </a>
        </div>
      </div>
    </footer>
  );
}
