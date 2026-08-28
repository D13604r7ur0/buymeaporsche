import React from 'react';
import { TRACK_EVENTS_ROADMAP, CONTRACT_DAYS, CONTRACT_YEARS } from '../../utils/sampleData';
import { useSponsors } from '../../context/SponsorContext';
import { MapPin, ArrowRight, ShieldCheck, Sparkles, Store, Flame, Trophy } from 'lucide-react';

export const EventExpositionRoadmap: React.FC<{ onNavigateTo3D?: () => void }> = () => {

  const { setIsBuyModalOpen } = useSponsors();

  return (
    <section id="roadmap" className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-[#fafafa] border-t border-black/[0.06]">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-500 block mb-2">
            Exposición Física, Envíos & Pistas
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-neutral-900 tracking-tight">
            ¿Dónde se verá tu marca durante {CONTRACT_YEARS} años?
          </h2>
          <p className="text-sm text-neutral-500 mt-2 font-sans leading-relaxed">
            La campaña financia un <strong>Porsche 911 (992)</strong> real que portará los logotipos de todos los patrocinadores en <strong>vinil automotriz de alta resistencia</strong> durante <strong>{CONTRACT_YEARS} años ({CONTRACT_DAYS} días)</strong> en Car Meets, autódromos, visitas a negocios y eventos exclusivos.
          </p>
        </div>

        {/* 4 Pillars of Value */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          
          {/* Pillar 1: High Resistance Vinyl */}
          <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-sm space-y-2.5 hover:border-black/20 transition group">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-neutral-900">Vinil de Alta Resistencia</h3>
            <p className="text-xs text-neutral-500 leading-relaxed font-sans">
              Rotulación profesional con vinil automotriz fundido de grado premium, resistente a rayos UV, altas velocidades, calor de pista y lluvia, sellado con laca cerámica para durar 2 años completos.
            </p>
          </div>

          {/* Pillar 2: Car Meets & Luxury Expos */}
          <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-sm space-y-2.5 hover:border-black/20 transition group">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-neutral-900">Car Meets & Caravanas</h3>
            <p className="text-xs text-neutral-500 leading-relaxed font-sans">
              Presencia mensual en los encuentros y exposiciones de superautos más exclusivas del país (CDMX, Valle de Bravo, Cancún, Zapopan, San Pedro Garza García) ante miles de entusiastas y empresarios.
            </p>
          </div>

          {/* Pillar 3: Visit to your Store / Business */}
          <div className="p-6 rounded-2xl bg-white border-2 border-emerald-500/30 bg-emerald-500/[0.02] shadow-sm space-y-2.5 hover:border-emerald-500/60 transition group relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                <Store className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-mono uppercase tracking-wider bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                ¡En tu Negocio!
              </span>
            </div>
            <h3 className="font-semibold text-sm text-neutral-900">Visita a tu Local o Empresa</h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              <strong>Pagando el costo de envío/traslado</strong> (y sujeto a fechas disponibles en calendario), llevamos el Porsche 911 rotulado hasta las puertas de tu local o sucursal para inauguraciones, sesiones de fotos y activación de marca.
            </p>
          </div>

          {/* Pillar 4: Track Days & Digital Documental */}
          <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-sm space-y-2.5 hover:border-black/20 transition group">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-neutral-900">Autódromos F1 & Cobertura</h3>
            <p className="text-xs text-neutral-500 leading-relaxed font-sans">
              Track Days en el Autódromo Hermanos Rodríguez, Tangamanga y Monterrey, además de menciones y material en video para YouTube, Instagram y TikTok durante los 2 años.
            </p>
          </div>

        </div>

        {/* Business Visit Special Highlight Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900 text-white mb-16 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-white/10 relative overflow-hidden">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3" />
              <span>Activación de Marca Presencial</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-heading font-bold text-white">
              ¿Quieres el Porsche 911 en la puerta de tu local?
            </h3>
            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              Todos los patrocinadores tienen derecho a solicitar la presencia del Porsche 911 (992) con sus logos en su establecimiento para eventos especiales o promocionales. El patrocinador únicamente cubre los gastos de traslado/envío (grúa cerrada o rodando) y se agenda conforme a las fechas disponibles del tour.
            </p>
          </div>

          <button
            onClick={() => setIsBuyModalOpen(true)}
            className="px-6 py-3 rounded-full bg-white hover:bg-neutral-100 text-neutral-950 font-semibold text-xs transition shrink-0 shadow-md cursor-pointer flex items-center gap-2"
          >
            <Store className="w-4 h-4 text-neutral-900" />
            <span>Apartar mi Espacio & Solicitar Fecha</span>
          </button>
        </div>

        {/* Calendar Events List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono uppercase tracking-wider text-neutral-500">
              Calendario Oficial de Gira & Eventos
            </h3>
            <span className="text-xs text-neutral-400 font-mono">2 Años ({CONTRACT_DAYS} Días de Vigencia)</span>
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

                <p className="text-xs text-neutral-500 font-sans pt-1">
                  {event.description}
                </p>
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
