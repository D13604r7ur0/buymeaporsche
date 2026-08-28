import React from 'react';
import { TRACK_EVENTS_ROADMAP } from '../../utils/sampleData';
import { useSponsors } from '../../context/SponsorContext';
import { MapPin, ArrowRight } from 'lucide-react';

export const EventExpositionRoadmap: React.FC<{ onNavigateTo3D?: () => void }> = () => {

  const { setIsBuyModalOpen } = useSponsors();

  return (
    <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-[#fafafa] border-t border-black/[0.06]">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-500 block mb-2">
            Exposición Física & Digital
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-neutral-900 tracking-tight">
            ¿Dónde se verá tu marca durante 2 años?
          </h2>
          <p className="text-sm text-neutral-500 mt-2 font-sans">
            La campaña financia un <strong>Porsche 911 (992)</strong> real que portará los logotipos de todos los patrocinadores en vinil de alta resistencia durante 2 años en pistas y eventos de superautos.
          </p>
        </div>

        {/* 4 Pillars of Value */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-sm space-y-2.5">
            <span className="text-xl">🏁</span>
            <h3 className="font-semibold text-sm text-neutral-900">Vinilado Oficial en Auto Real</h3>
            <p className="text-xs text-neutral-500 leading-relaxed font-sans">
              Rotulado profesional en las coordenadas 3D exactas que elijas, sellado con laca cerámica para durar 2 años completos.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-sm space-y-2.5">
            <span className="text-xl">🏎️</span>
            <h3 className="font-semibold text-sm text-neutral-900">Gira en Autódromos (F1)</h3>
            <p className="text-xs text-neutral-500 leading-relaxed font-sans">
              Track days anuales en el Autódromo Hermanos Rodríguez (CDMX), Tangamanga (SLP) y Autódromo Monterrey.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-sm space-y-2.5">
            <span className="text-xl">📱</span>
            <h3 className="font-semibold text-sm text-neutral-900">Serie y Cobertura en Redes</h3>
            <p className="text-xs text-neutral-500 leading-relaxed font-sans">
              Documental y videos de entrega, unboxing, track days y menciones a las marcas patrocinadoras en YouTube, Instagram y TikTok.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-sm space-y-2.5">
            <span className="text-xl">🎟️</span>
            <h3 className="font-semibold text-sm text-neutral-900">Pases VIP a Paddock & Pits</h3>
            <p className="text-xs text-neutral-500 leading-relaxed font-sans">
              Acceso exclusivo para directores y representantes de marca a sesiones de track day y fotos profesionales con el 911.
            </p>
          </div>
        </div>

        {/* Calendar Events List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono uppercase tracking-wider text-neutral-500">
              Calendario de Eventos & Gira
            </h3>
            <span className="text-xs text-neutral-400 font-mono">1,825 Días de Vigencia</span>
          </div>

          {TRACK_EVENTS_ROADMAP.map((event) => (
            <div
              key={event.id}
              className="p-5 rounded-2xl bg-white border border-black/[0.06] hover:border-black/20 shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-neutral-100 text-neutral-700">
                    {event.type}
                  </span>
                  <span className="text-xs font-mono text-emerald-600 font-semibold">
                    {event.yearSpan}
                  </span>
                </div>

                <h4 className="font-semibold text-sm text-neutral-900">{event.title}</h4>
                
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-sans">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>{event.trackName} · {event.location}</span>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-black/[0.04] text-xs font-mono">
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 block">ALCANCE ESTIMADO:</span>
                  <span className="text-neutral-800">{event.estimatedReach}</span>
                </div>

                <button
                  onClick={() => setIsBuyModalOpen(true)}
                  className="bg-[#fafafa] hover:bg-neutral-900 text-neutral-700 hover:text-white border border-black/10 px-3.5 py-1.5 rounded-xl transition cursor-pointer text-xs flex items-center gap-1 shrink-0 font-sans font-medium"
                >
                  <span>Patrocinar</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
