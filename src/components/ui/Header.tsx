import React, { useState } from 'react';
import { useSponsors } from '../../context/SponsorContext';
import { sounds } from '../../utils/soundEffects';
import { Plus, Volume2, VolumeX } from 'lucide-react';

interface HeaderProps {
  activeTab: '3d' | 'roi' | 'events' | 'directory';
  setActiveTab: (tab: '3d' | 'roi' | 'events' | 'directory') => void;
  onOpenConfigurator?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const {
    setIsBuyModalOpen,
  } = useSponsors();

  const [isMuted, setIsMuted] = useState<boolean>(sounds.getIsMuted());

  const scrollTo = (id: string) => {
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 z-40 w-full bg-[#0b0d14]/85 backdrop-blur-2xl border-b border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand (Porsche Minimalist Badge) */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => scrollTo('top')}
        >
          <div className="w-8 h-8 rounded-full bg-white text-neutral-950 flex items-center justify-center text-xs font-heading font-black tracking-tighter shadow-md group-hover:bg-[#D5001C] group-hover:text-white transition">
            911
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-xs sm:text-sm tracking-widest uppercase text-white">
                PORSCHE 911 (992)
              </span>
              <span className="text-[10px] font-mono text-neutral-300 bg-white/10 border border-white/15 px-2 py-0.5 rounded-full font-medium">
                2 Años
              </span>
            </div>
          </div>
        </div>

        {/* Minimal High-Contrast Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-wider uppercase">
          <button
            onClick={() => scrollTo('top')}
            className="text-neutral-300 hover:text-white font-medium transition cursor-pointer flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>Showroom 3D</span>
          </button>

          <button
            onClick={() => scrollTo('sponsors')}
            className="text-neutral-300 hover:text-white font-medium transition cursor-pointer flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Ranking</span>
          </button>

          <button
            onClick={() => scrollTo('events')}
            className="text-neutral-300 hover:text-white font-medium transition cursor-pointer"
          >
            Exposición
          </button>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2.5">
          
          <button
            onClick={() => {
              const muted = sounds.toggleMute();
              setIsMuted(muted);
              if (!muted) sounds.playClickSound();
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white border border-white/15 transition text-xs font-medium flex items-center justify-center cursor-pointer"
            title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Porsche Guards Red Primary CTA */}
          <button
            onClick={() => {
              sounds.playClickSound();
              setIsBuyModalOpen(true);
            }}
            className="bg-[#D5001C] hover:bg-[#b00017] text-white font-bold text-xs px-4 sm:px-5 py-2 rounded-full transition shadow-lg shadow-red-900/30 flex items-center gap-1.5 cursor-pointer shrink-0 uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Comprar Espacio</span>
            <span className="sm:hidden">Comprar</span>
          </button>

        </div>

      </div>
    </header>
  );
};
