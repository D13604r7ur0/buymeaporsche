import React, { useState } from 'react';
import { useSponsors } from '../../context/SponsorContext';
import { ZONES } from '../../utils/sampleData';
import type { SponsorTier } from '../../types/sponsor';
import { ArrowRight, Calculator, Sparkles } from 'lucide-react';

export const WhatYouPayBreakdown: React.FC<{ onNavigateTo3D?: () => void }> = () => {

  const {
    setIsBuyModalOpen,
    setDraftSponsor,
    totalAreaSoldCm2,
    totalAvailableCm2,
    remainingAreaCm2,
    areaSoldPercentage,
  } = useSponsors();

  const [customWidth, setCustomWidth] = useState<number>(35);
  const [customHeight, setCustomHeight] = useState<number>(20);
  const [selectedZoneTier, setSelectedZoneTier] = useState<SponsorTier>('hood_central');

  const currentZone = ZONES.find((z) => z.id === selectedZoneTier) || ZONES[1];
  const customArea = customWidth * customHeight;
  const customTotalMxn = customArea * currentZone.pricePerCm2;

  return (
    <section id="calculator" className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-black/[0.06]">
      <div className="max-w-7xl mx-auto">
        
        {/* Title & Capacity Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-500 block mb-2 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-neutral-800" />
              <span>Calculadora de Superficie & Retorno de Inversión</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-neutral-900 tracking-tight">
              ¿Qué estás pagando exactamente?
            </h2>
            <p className="text-sm text-neutral-500 mt-2 font-sans">
              El costo se calcula estrictamente por centímetro cuadrado ($cm^2$) de tu diseño en la carrocería del <strong>Porsche 911 (992)</strong> durante los <strong>2 años</strong> de contrato.
            </p>
          </div>

          <div className="bg-[#fafafa] border border-black/[0.06] p-4 rounded-2xl min-w-[280px] space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-neutral-500">
              <span>Capacidad del Auto:</span>
              <strong className="text-neutral-900">{totalAvailableCm2.toLocaleString()} cm²</strong>
            </div>
            <div className="flex justify-between items-center text-neutral-500">
              <span>Espacio Ocupado:</span>
              <strong className="text-neutral-900">{totalAreaSoldCm2.toLocaleString()} cm² ({areaSoldPercentage}%)</strong>
            </div>
            <div className="flex justify-between items-center text-neutral-500">
              <span>Espacio Restante:</span>
              <strong className="text-emerald-600 font-bold">{remainingAreaCm2.toLocaleString()} cm²</strong>
            </div>
            <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden mt-1">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(areaSoldPercentage, 4)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Custom Dimension Slider Studio */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#fafafa] border border-black/[0.06] shadow-sm">
          <div className="max-w-3xl mb-8">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-1">
              Calculadora Dinámica de Centímetros
            </span>
            <h3 className="text-xl font-heading font-bold text-neutral-900">
              Personaliza tus dimensiones exactas en centímetros
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Ajusta el ancho y alto deseado para calcular tu inversión en tiempo real.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Sliders and Zone Selector */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Zone selector */}
              <div>
                <label className="text-xs font-mono text-neutral-500 block mb-2">Zona de la carrocería en el 911:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ZONES.filter(z => z.id !== 'showroom_floor').map((z) => (
                    <button
                      key={z.id}
                      onClick={() => setSelectedZoneTier(z.id)}
                      className={`p-2.5 rounded-xl border text-xs font-mono transition text-left cursor-pointer ${
                        selectedZoneTier === z.id
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                          : 'bg-white text-neutral-700 border-black/[0.06] hover:border-black/20'
                      }`}
                    >
                      <div className="font-semibold line-clamp-1">{z.shortName}</div>
                      <div className={`text-[10px] ${selectedZoneTier === z.id ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        ${z.pricePerCm2} MXN/cm²
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Width Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-neutral-500">Ancho del Sticker:</span>
                  <span className="text-neutral-900 font-bold">{customWidth} cm</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={120}
                  step={1}
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                  className="w-full accent-neutral-900 bg-neutral-200 cursor-pointer h-2 rounded-lg"
                />
              </div>

              {/* Height Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-neutral-500">Alto del Sticker:</span>
                  <span className="text-neutral-900 font-bold">{customHeight} cm</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={60}
                  step={1}
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Number(e.target.value))}
                  className="w-full accent-neutral-900 bg-neutral-200 cursor-pointer h-2 rounded-lg"
                />
              </div>
            </div>

            {/* Calculated Results Card */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-black/10 shadow-sm space-y-4 text-xs font-mono">
              <div className="flex justify-between items-center text-neutral-500 pb-3 border-b border-black/[0.06]">
                <span>Superficie:</span>
                <span className="text-neutral-900 font-bold">{customWidth} x {customHeight} cm ({customArea} cm²)</span>
              </div>

              <div className="flex justify-between items-center text-neutral-500">
                <span>Vigencia:</span>
                <span className="text-emerald-600 font-bold">2 Años de Contrato</span>
              </div>

              <div className="flex justify-between items-center text-neutral-500">
                <span>Tarifa de Zona:</span>
                <span className="text-emerald-600 text-lg font-bold">${currentZone.pricePerCm2} MXN / cm²</span>
              </div>

              <div className="pt-3 border-t border-black/[0.06] flex justify-between items-end">
                <div>
                  <div className="text-[10px] text-neutral-400">Total Pago Único:</div>
                  <div className="text-2xl font-bold text-neutral-900">
                    ${customTotalMxn.toLocaleString()} <span className="text-xs text-neutral-500 font-normal">MXN</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setDraftSponsor({
                      widthCm: customWidth,
                      heightCm: customHeight,
                      areaCm2: customArea,
                      pricePerCm2: currentZone.pricePerCm2,
                      totalPriceMxn: customTotalMxn,
                      tier: currentZone.id,
                      zoneName: currentZone.name,
                      position3D: currentZone.defaultPosition,
                      rotation3D: currentZone.defaultRotation,
                      scale3D: [customWidth / 25, customHeight / 25, 1],
                    });
                    setIsBuyModalOpen(true);
                  }}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Subir Mi Logo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
