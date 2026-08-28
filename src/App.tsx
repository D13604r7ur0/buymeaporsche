import React, { useState } from 'react';
import { SponsorProvider } from './context/SponsorContext';
import { Header } from './components/ui/Header';
import { PorscheScene } from './components/3d/PorscheScene';
import { WhatYouPayBreakdown } from './components/ui/WhatYouPayBreakdown';
import { EventExpositionRoadmap } from './components/ui/EventExpositionRoadmap';
import { SponsorDirectory } from './components/ui/SponsorDirectory';
import { BuyModal } from './components/ui/BuyModal';
import { SponsorDetailModal } from './components/ui/SponsorDetailModal';
import { PorscheConfigurator } from './components/ui/PorscheConfigurator';
import { CertificateModal } from './components/ui/CertificateModal';
import { useSponsors } from './context/SponsorContext';
import { ChevronDown, MousePointerClick, ArrowRight } from 'lucide-react';


const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'3d' | 'roi' | 'events' | 'directory'>('3d');
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState<boolean>(false);
  
  const {
    totalRaisedMxn,
    goalMxn,
    goalProgressPercentage,
    setIsBuyModalOpen,
    setIsPlacementMode,
    contractYears,
  } = useSponsors();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
      
      {/* Floating Minimalist Header over the 3D Porsche */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenConfigurator={() => setIsConfiguratorOpen(true)}
      />

      {/* 1. HERO SECTION: 100VH FULLSCREEN 3D PORSCHE (FIRST THING YOU SEE) */}
      <section className="relative w-full h-screen bg-[#f8f9fa] overflow-hidden">
        
        {/* Fullscreen 3D Canvas */}
        <PorscheScene />

        {/* Floating Top-Center Goal Badge */}
        <div className="absolute top-20 sm:top-24 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none w-full max-w-md px-4 text-center">
          <div className="inline-flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-black/[0.08] shadow-sm pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-medium text-neutral-800">
              ${totalRaisedMxn.toLocaleString()} de ${goalMxn.toLocaleString()} MXN
            </span>
            <span className="text-[10px] font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
              {goalProgressPercentage}% · {contractYears} Años
            </span>
          </div>
        </div>

        {/* Floating Bottom Action Buttons over 3D Car */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-3 w-full px-4">
          <button
            onClick={() => setIsPlacementMode(true)}
            className="flex items-center gap-2 bg-white/90 hover:bg-white text-neutral-800 px-4 py-2.5 rounded-full text-xs font-medium border border-black/10 shadow-sm transition cursor-pointer"
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>Colocar Sticker en 3D</span>
          </button>

          <button
            onClick={() => setIsBuyModalOpen(true)}
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <span>Patrocinar ($1 MXN/cm²)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scroll Down Indicator */}
        <button
          onClick={() => scrollToSection('calculator')}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center gap-0.5 text-neutral-400 hover:text-neutral-900 transition cursor-pointer text-[10px] font-mono uppercase tracking-widest"
        >
          <span>Ver Calculadora & Patrocinadores</span>
          <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
        </button>
      </section>

      {/* 2. MAIN CONTENT SECTIONS */}
      <main className="flex-1 w-full bg-[#fafafa]">
        
        {/* Section: Calculator & ROI */}
        <div id="calculator">
          <WhatYouPayBreakdown onNavigateTo3D={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        </div>

        {/* Section: Event Exposition Roadmap */}
        <div id="events">
          <EventExpositionRoadmap onNavigateTo3D={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        </div>

        {/* Section: Sponsors Hall of Fame */}
        <div id="directory">
          <SponsorDirectory onNavigateTo3D={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        </div>

        {/* Section: Technical Specs */}
        <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-black/[0.06]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 block mb-1">
                Ficha Técnica
              </span>
              <h3 className="text-2xl font-heading font-bold text-neutral-900">
                Porsche 911 Carrera (992)
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.04] text-center space-y-0.5">
                <span className="text-[10px] text-neutral-500 font-mono">Motor:</span>
                <div className="text-lg font-heading font-bold text-neutral-900">3.0L Twin-Turbo</div>
                <div className="text-[10px] text-neutral-500">6 Cilindros Bóxer</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.04] text-center space-y-0.5">
                <span className="text-[10px] text-neutral-500 font-mono">Potencia:</span>
                <div className="text-lg font-heading font-bold text-neutral-900">385 - 450 HP</div>
                <div className="text-[10px] text-neutral-500">0-100 km/h en 3.5s</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.04] text-center space-y-0.5">
                <span className="text-[10px] text-neutral-500 font-mono">Transmisión:</span>
                <div className="text-lg font-heading font-bold text-neutral-900">PDK 8-Speed</div>
                <div className="text-[10px] text-neutral-500">Doble Embrague</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.04] text-center space-y-0.5">
                <span className="text-[10px] text-neutral-500 font-mono">Velocidad Máxima:</span>
                <div className="text-lg font-heading font-bold text-neutral-900">293 km/h</div>
                <div className="text-[10px] text-neutral-500">Deportivo Legendario</div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Minimal Footer */}
      <footer className="w-full bg-[#fafafa] border-t border-black/[0.06] py-10 px-4 sm:px-6 lg:px-8 text-neutral-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">🏎️</span>
            <div>
              <span className="font-heading font-bold text-neutral-900 text-xs tracking-wider uppercase">
                Porsche 911 (992)
              </span>
              <p className="text-[11px] text-neutral-400">
                Iniciativa de patrocinio publicitario en 3D & pista por 5 años.
              </p>
            </div>
          </div>

          <div className="text-[11px] text-center sm:text-right text-neutral-400 font-mono">
            Meta: $3,000,000 MXN · 5 Años de Vigencia
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BuyModal />
      <SponsorDetailModal />
      <PorscheConfigurator
        isOpen={isConfiguratorOpen}
        onClose={() => setIsConfiguratorOpen(false)}
      />
      <CertificateModal />

    </div>
  );
};

export function App() {
  return (
    <SponsorProvider>
      <MainApp />
    </SponsorProvider>
  );
}

export default App;
