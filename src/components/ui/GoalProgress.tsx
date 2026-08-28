import React from 'react';
import { useSponsors } from '../../context/SponsorContext';
import { ArrowRight, MousePointerClick } from 'lucide-react';


export const GoalProgress: React.FC = () => {
  const {
    totalRaisedMxn,
    goalMxn,
    goalProgressPercentage,
    totalAreaSoldCm2,
    setIsBuyModalOpen,
    setIsPlacementMode,
    contractYears,
    contractDays,
  } = useSponsors();

  const remainingMxn = Math.max(0, goalMxn - totalRaisedMxn);

  return (
    <section className="w-full bg-[#050507] border-b border-white/[0.06] py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Title & Introduction */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div className="max-w-3xl space-y-2">
            <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-400 block">
              Iniciativa de Financiamiento Colectivo & Publicidad
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white tracking-tight">
              Compra tu espacio en un <span className="text-neutral-300">Porsche 911</span> por 2 años.
            </h1>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-2xl font-sans">
              Venta de espacios publicitarios en centímetros cuadrados ($cm^2$). Los patrocinadores formarán parte del showroom 3D y del <strong>wrap de vinil oficial en el auto físico</strong> durante <strong>2 años ({contractDays} días)</strong> en eventos y autódromos de México.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsPlacementMode(true)}
              className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] text-neutral-200 hover:text-white border border-white/[0.08] px-4 py-2.5 rounded-full text-xs font-medium transition cursor-pointer"
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              <span>Elegir punto en el 3D</span>
            </button>

            <button
              onClick={() => setIsBuyModalOpen(true)}
              className="flex items-center gap-2 bg-white hover:bg-neutral-200 text-neutral-950 font-semibold text-xs px-5 py-2.5 rounded-full transition shadow cursor-pointer"
            >
              <span>Patrocinar Ahora</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Minimal Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-white/[0.06]">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Recaudado</span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white">
              ${totalRaisedMxn.toLocaleString()} <span className="text-xs text-neutral-500 font-normal">MXN</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono block">
              {goalProgressPercentage}% de la meta
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Meta Oficial</span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-neutral-300">
              ${goalMxn.toLocaleString()} <span className="text-xs text-neutral-500 font-normal">MXN</span>
            </div>
            <span className="text-[11px] text-neutral-500 font-mono block">
              Porsche 911 (992)
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Área Vendida</span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white">
              {totalAreaSoldCm2.toLocaleString()} <span className="text-xs text-neutral-500 font-normal">cm²</span>
            </div>
            <span className="text-[11px] text-neutral-500 font-mono block">
              Superficie reservada
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Vigencia Garantizada</span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-neutral-200">
              {contractYears} Años
            </div>
            <span className="text-[11px] text-neutral-500 font-mono block">
              {contractDays} días continuos
            </span>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-[11px] font-mono text-neutral-400">
            <span>Progreso de Financiación</span>
            <span>Faltan: ${remainingMxn.toLocaleString()} MXN</span>
          </div>
          <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-white/[0.06]">
            <div
              className="h-full bg-white transition-all duration-1000 ease-out"
              style={{ width: `${Math.max(1.5, goalProgressPercentage)}%` }}
            />
          </div>
        </div>

        {/* 4 Quiet Value Points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1">
            <div className="text-xs font-semibold text-white">Rotulado en Auto Real</div>
            <p className="text-[11px] text-neutral-400">Vinil de alta resistencia en el Porsche 911 físico.</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1">
            <div className="text-xs font-semibold text-white">Autódromo F1 & Gira</div>
            <p className="text-[11px] text-neutral-400">Presencia en Hermanos Rodríguez, Tangamanga y Monterrey.</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1">
            <div className="text-xs font-semibold text-white">Cobertura Digital</div>
            <p className="text-[11px] text-neutral-400">Serie documental en YouTube y redes sociales por 2 años.</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1">
            <div className="text-xs font-semibold text-white">Showroom 3D 24/7</div>
            <p className="text-[11px] text-neutral-400">Plataforma interactiva con enlaces directos a tu web.</p>
          </div>
        </div>

      </div>
    </section>
  );
};
