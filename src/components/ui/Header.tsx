import React, { useState } from 'react';
import { useSponsors } from '../../context/SponsorContext';
import { sounds } from '../../utils/soundEffects';
import { Palette, Plus, Volume2, VolumeX } from 'lucide-react';

interface HeaderProps {
  activeTab: '3d' | 'roi' | 'events' | 'directory';
  setActiveTab: (tab: '3d' | 'roi' | 'events' | 'directory') => void;
  onOpenConfigurator: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenConfigurator,
}) => {
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
    <header className="fixed top-0 left-0 z-40 w-full bg-white/75 backdrop-blur-xl border-b border-black/[0.05]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand */}
        <div 
          className="flex items-center gap-3 cursor-pointer" 
          onClick={() => scrollTo('top')}
        >
          <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center text-white text-xs shadow-sm font-heading font-bold">
            911
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sm tracking-wider uppercase text-neutral-900">
                Porsche 911 (992)
              </span>
              <span className="text-[10px] font-mono text-neutral-500 bg-black/[0.04] px-2 py-0.5 rounded-full">
                2 Años
              </span>
            </div>
          </div>
        </div>

        {/* Minimal Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-600">
          <button
            onClick={() => scrollTo('top')}
            className="hover:text-neutral-900 transition cursor-pointer"
          >
            Showroom 3D
          </button>

          <button
            onClick={() => scrollTo('calculator')}
            className="hover:text-neutral-900 transition cursor-pointer"
          >
            Calculadora & ROI
          </button>

          <button
            onClick={() => scrollTo('events')}
            className="hover:text-neutral-900 transition cursor-pointer"
          >
            Gira Autódromos
          </button>

          <button
            onClick={() => scrollTo('ranking')}
            className="hover:text-neutral-900 transition cursor-pointer flex items-center gap-1"
          >
            <span>Ranking cm²</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </button>

          <button
            onClick={() => scrollTo('directory')}
            className="hover:text-neutral-900 transition cursor-pointer"
          >
            Patrocinadores
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
            className="p-2 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-neutral-700 hover:text-neutral-900 border border-black/[0.06] transition text-xs font-medium flex items-center justify-center cursor-pointer"
            title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onOpenConfigurator}
            className="px-3 py-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-neutral-700 hover:text-neutral-900 border border-black/[0.06] transition text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            title="Personalizar Color"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="text-[11px]">Color</span>
          </button>

          <button
            onClick={() => {
              sounds.playClickSound();
              setIsBuyModalOpen(true);
            }}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs px-3.5 sm:px-4 py-2 rounded-full transition shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
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
