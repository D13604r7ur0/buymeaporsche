import React from 'react';
import { useSponsors, PORSCHE_COLORS, WHEEL_COLORS } from '../../context/SponsorContext';
import { X, Check } from 'lucide-react';


export const PorscheConfigurator: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { carConfig, setCarConfig } = useSponsors();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-black/10 shadow-2xl overflow-hidden text-neutral-900">
        
        {/* Header */}
        <div className="p-5 border-b border-black/[0.06] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 block mb-0.5">
              Configurador
            </span>
            <h2 className="text-base font-heading font-bold text-neutral-900">
              Pintura & Rines Porsche 911 (992)
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Paint Colors */}
          <div className="space-y-2.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-500">Color de Carrocería:</span>
              <strong className="text-neutral-900">{carConfig.bodyColorName}</strong>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {PORSCHE_COLORS.map((color) => (
                <button
                  key={color.hex}
                  onClick={() =>
                    setCarConfig((prev) => ({
                      ...prev,
                      bodyColor: color.hex,
                      bodyColorName: color.name,
                    }))
                  }
                  className={`flex flex-col items-center gap-1 p-2 rounded-2xl border transition cursor-pointer ${
                    carConfig.bodyColor === color.hex
                      ? 'border-neutral-900 bg-neutral-50 shadow-sm'
                      : 'border-black/[0.06] hover:border-black/20'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-full shadow-inner border border-black/10 flex items-center justify-center"
                    style={{ backgroundColor: color.hex }}
                  >
                    {carConfig.bodyColor === color.hex && (
                      <Check className={`w-3.5 h-3.5 ${color.hex === '#f7f8fa' ? 'text-black' : 'text-white'}`} />
                    )}
                  </div>
                  <span className="text-[9px] text-center text-neutral-600 line-clamp-1">
                    {color.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Wheels */}
          <div className="space-y-2.5 pt-4 border-t border-black/[0.06]">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-500">Acabado de Rines:</span>
              <strong className="text-neutral-900">{carConfig.wheelColorName}</strong>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {WHEEL_COLORS.map((wheel) => (
                <button
                  key={wheel.hex}
                  onClick={() =>
                    setCarConfig((prev) => ({
                      ...prev,
                      wheelColor: wheel.hex,
                      wheelColorName: wheel.name,
                    }))
                  }
                  className={`flex items-center gap-2 p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                    carConfig.wheelColor === wheel.hex
                      ? 'border-neutral-900 bg-neutral-50 shadow-sm'
                      : 'border-black/[0.06] hover:border-black/20'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: wheel.hex }}
                  />
                  <span className="text-xs text-neutral-800 line-clamp-1">
                    {wheel.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/[0.06] bg-[#fafafa] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition cursor-pointer"
          >
            Listo
          </button>
        </div>

      </div>
    </div>
  );
};
