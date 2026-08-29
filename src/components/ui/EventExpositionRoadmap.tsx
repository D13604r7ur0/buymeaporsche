import React from 'react';
import { CONTRACT_DAYS, CONTRACT_YEARS } from '../../utils/sampleData';
import { ShieldCheck, Flame, Trophy, Video } from 'lucide-react';

export const EventExpositionRoadmap: React.FC<{ onNavigateTo3D?: () => void }> = () => {

  return (
    <section id="events" className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-[#f8f9fa] border-t border-black/[0.08]">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-mono tracking-widest uppercase text-[#D5001C] font-bold block mb-2">
            Exposición Física, Pistas & Eventos
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-neutral-950 tracking-tight">
            ¿Dónde se verá tu logo durante {CONTRACT_YEARS} años?
          </h2>
          <p className="text-sm text-neutral-700 mt-2 font-sans leading-relaxed font-medium">
            La campaña financia un <strong className="text-neutral-950">Porsche 911 (992)</strong> real que portará los logotipos de todos los patrocinadores en <strong className="text-neutral-950">vinil automotriz de alta resistencia</strong> durante <strong className="text-neutral-950">{CONTRACT_YEARS} años ({CONTRACT_DAYS} días)</strong> en Car Meets, autódromos y eventos exclusivos.
          </p>
        </div>

        {/* 4 Pillars of Value */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Pillar 1: High Resistance Vinyl */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-3 hover:border-neutral-400 transition group">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center group-hover:bg-[#D5001C] group-hover:text-white transition">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-950">Vinil de Alta Resistencia</h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans font-medium">
              Rotulación profesional con vinil automotriz fundido de grado premium, resistente a rayos UV, altas velocidades, calor de pista y lluvia, sellado con laca cerámica para durar 2 años completos.
            </p>
          </div>

          {/* Pillar 2: Car Meets & Luxury Expos */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-3 hover:border-neutral-400 transition group">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center group-hover:bg-[#D5001C] group-hover:text-white transition">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-950">Car Meets & Caravanas</h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans font-medium">
              Presencia mensual en los encuentros y exposiciones de superautos más exclusivas del país (CDMX, Valle de Bravo, Cancún, Zapopan, San Pedro Garza García) ante miles de entusiastas y empresarios.
            </p>
          </div>

          {/* Pillar 3: Track Days & F1 Circuits */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-3 hover:border-neutral-400 transition group">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center group-hover:bg-[#D5001C] group-hover:text-white transition">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-950">Autódromos F1 & Pistas</h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans font-medium">
              Track Days anuales y time attack en el Autódromo Hermanos Rodríguez (CDMX), Parque Tangamanga II (SLP) y Autódromo Monterrey con tomas de alta velocidad y acceso a pits.
            </p>
          </div>

          {/* Pillar 4: Digital Documentary & Social Media */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-3 hover:border-neutral-400 transition group">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center group-hover:bg-[#D5001C] group-hover:text-white transition">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-950">Serie y Cobertura Digital</h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans font-medium">
              Documental y contenido audiovisual continuo en YouTube, Instagram y TikTok durante los 2 años, con menciones y tomas de detalle a los logos patrocinadores.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
