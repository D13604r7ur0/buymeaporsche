import React, { useState } from 'react';
import { useSponsors } from '../../context/SponsorContext';
import { SIZE_COMPARISONS, CONTRACT_DAYS, ZONES } from '../../utils/sampleData';
import type { SponsorTier } from '../../types/sponsor';
import { 
  CreditCard, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Trophy, 
  ArrowRight
} from 'lucide-react';

export const WhatYouPayBreakdown: React.FC<{ onNavigateTo3D?: () => void }> = () => {

  const {
    setIsBuyModalOpen,
    setDraftSponsor,
    setCameraPreset,
    totalAreaSoldCm2,
    totalAvailableCm2,
    remainingAreaCm2,
    areaSoldPercentage,
  } = useSponsors();

  const [customWidth, setCustomWidth] = useState<number>(15);
  const [customHeight, setCustomHeight] = useState<number>(15);
  const [selectedZoneTier, setSelectedZoneTier] = useState<SponsorTier>('premium_door');

  const currentZone = ZONES.find((z) => z.id === selectedZoneTier) || ZONES[2];
  const customArea = customWidth * customHeight;
  const customTotalMxn = customArea * currentZone.pricePerCm2;
  const customDailyCost = customTotalMxn / CONTRACT_DAYS;
  const customMonthlyCost = customDailyCost * 30.4;

  const handleSelectPreset = (comparison: typeof SIZE_COMPARISONS[0]) => {
    const tier: SponsorTier = comparison.cm2 > 2000 ? 'vip_wing' : comparison.cm2 > 800 ? 'premium_door' : 'body_standard';
    const zone = ZONES.find((z) => z.id === tier) || ZONES[0];
    
    setDraftSponsor({
      widthCm: Math.round(Math.sqrt(comparison.cm2 * 1.5)),
      heightCm: Math.round(Math.sqrt(comparison.cm2 / 1.5)),
      areaCm2: comparison.cm2,
      pricePerCm2: zone.pricePerCm2,
      totalPriceMxn: comparison.totalMxn,
      tier: zone.id,
      zoneName: zone.name,
      position3D: zone.defaultPosition,
      rotation3D: zone.defaultRotation,
      scale3D: zone.defaultScale,
    });

    if (tier === 'vip_wing') setCameraPreset('wing');
    else if (tier === 'premium_door') setCameraPreset('door_right');
    else setCameraPreset('overview');

    setIsBuyModalOpen(true);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'CreditCard': return <CreditCard className="w-4 h-4" />;
      case 'Smartphone': return <Smartphone className="w-4 h-4" />;
      case 'Tablet': return <Tablet className="w-4 h-4" />;
      case 'Monitor': return <Monitor className="w-4 h-4" />;
      case 'Trophy': return <Trophy className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  return (
    <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-black/[0.06]">
      <div className="max-w-7xl mx-auto">
        
        {/* Title & Capacity Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-500 block mb-2">
              Transparencia & Retorno de Inversión
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-neutral-900 tracking-tight">
              ¿Qué estás pagando exactamente?
            </h2>
            <p className="text-sm text-neutral-500 mt-2 font-sans">
              Superficie total limitada a <strong>{totalAvailableCm2.toLocaleString()} cm² (12 m²)</strong> en la carrocería del <strong>Porsche 911 (992)</strong> durante los <strong>2 años ({CONTRACT_DAYS} días)</strong> de contrato.
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

        {/* 5 Minimalist Size Presets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 mb-12">
          {SIZE_COMPARISONS.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#fafafa] border border-black/[0.06] hover:border-black/20 hover:shadow-sm transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center mb-3">
                  {getIcon(item.iconName)}
                </div>

                <div className="text-xs font-semibold text-neutral-900 group-hover:text-neutral-700">
                  {item.name}
                </div>
                <div className="text-[11px] text-neutral-500 font-sans mt-0.5">
                  {item.objectComparison}
                </div>

                <div className="my-4 py-2 border-y border-black/[0.06] text-xs font-mono">
                  <span className="text-neutral-500">{item.dimensions}</span>
                  <span className="text-neutral-900 font-semibold block">{item.cm2} cm²</span>
                </div>

                <div className="space-y-0.5 my-2">
                  <div className="text-[10px] font-mono uppercase text-neutral-400">Costo diario:</div>
                  <div className="text-xl font-mono font-bold text-emerald-600">
                    ${item.dailyCostMxn.toFixed(2)} <span className="text-[10px] text-neutral-500 font-normal">MXN/día</span>
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    ${item.totalMxn.toLocaleString()} MXN total
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSelectPreset(item)}
                className="w-full mt-4 bg-white hover:bg-neutral-900 text-neutral-800 hover:text-white border border-black/10 py-2 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Elegir</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Custom Dimension Slider */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#fafafa] border border-black/[0.06] shadow-sm">
          <div className="max-w-3xl mb-8">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-1">
              Calculadora Dinámica
            </span>
            <h3 className="text-xl font-heading font-bold text-neutral-900">
              Personaliza tus dimensiones exactas en centímetros
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Ajusta el ancho y alto deseado para calcular tu inversión en el Porsche 911.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Sliders */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Zone selector */}
              <div>
                <label className="text-xs font-mono text-neutral-500 block mb-2">Zona de la carrocería:</label>
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
                  min={5}
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
                  min={5}
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
                <span className="text-emerald-600 font-bold">2 Años ({CONTRACT_DAYS} Días)</span>
              </div>

              <div className="flex justify-between items-center text-neutral-500">
                <span>Costo / Día:</span>
                <span className="text-emerald-600 text-lg font-bold">${customDailyCost.toFixed(2)} MXN</span>
              </div>

              <div className="flex justify-between items-center text-neutral-500">
                <span>Costo / Mes aprox:</span>
                <span className="text-neutral-900 font-semibold">${customMonthlyCost.toFixed(2)} MXN</span>
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
                      scale3D: [customWidth / 20, customHeight / 20, 1],
                    });
                    setIsBuyModalOpen(true);
                  }}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <span>Apartar Espacio</span>
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
