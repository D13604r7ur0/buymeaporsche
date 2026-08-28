import React from 'react';
import { useSponsors } from '../../context/SponsorContext';
import { 
  X, 
  ExternalLink, 
  Camera
} from 'lucide-react';


export const SponsorDetailModal: React.FC = () => {
  const {
    selectedSponsor,
    setSelectedSponsor,
    setCertificateSponsor,
    focusSponsor,
    recordClick,
    contractDays,
  } = useSponsors();

  if (!selectedSponsor) return null;

  const handleVisitWebsite = () => {
    recordClick(selectedSponsor.id);
    window.open(selectedSponsor.targetUrl, '_blank', 'noopener,noreferrer');
  };

  const dailyCost = selectedSponsor.totalPriceMxn / contractDays;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-black/10 shadow-2xl overflow-hidden my-auto text-neutral-900">
        
        {/* Header */}
        <div className="p-6 border-b border-black/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#fafafa] border border-black/10 p-1.5 flex items-center justify-center overflow-hidden shrink-0">
              {selectedSponsor.logoUrl ? (
                <img
                  src={selectedSponsor.logoUrl}
                  alt={selectedSponsor.brandName}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="font-bold text-neutral-900 text-sm">
                  {selectedSponsor.brandName.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                {selectedSponsor.zoneName} · 2 Años
              </span>
              <h2 className="text-xl font-heading font-bold text-neutral-900">
                {selectedSponsor.brandName}
              </h2>
              {selectedSponsor.sponsorName && (
                <span className="text-xs text-neutral-500 font-sans block">
                  Patrocinador: <strong className="text-neutral-800 font-medium">{selectedSponsor.sponsorName}</strong>
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setSelectedSponsor(null)}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-neutral-600 leading-relaxed font-sans bg-[#fafafa] p-3.5 rounded-2xl border border-black/[0.04]">
            "{selectedSponsor.slogan}"
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="p-3 rounded-2xl bg-[#fafafa] border border-black/[0.04]">
              <span className="text-[10px] text-neutral-400 block">Medidas:</span>
              <strong className="text-neutral-900">{selectedSponsor.widthCm}x{selectedSponsor.heightCm} cm</strong>
            </div>

            <div className="p-3 rounded-2xl bg-[#fafafa] border border-black/[0.04]">
              <span className="text-[10px] text-neutral-400 block">Inversión:</span>
              <strong className="text-neutral-900">${selectedSponsor.totalPriceMxn.toLocaleString()}</strong>
            </div>

            <div className="p-3 rounded-2xl bg-[#fafafa] border border-black/[0.04]">
              <span className="text-[10px] text-neutral-400 block">Costo / Día:</span>
              <strong className="text-emerald-600">${dailyCost.toFixed(2)}</strong>
            </div>

            <div className="p-3 rounded-2xl bg-[#fafafa] border border-black/[0.04]">
              <span className="text-[10px] text-neutral-400 block">Vigencia:</span>
              <strong className="text-neutral-900">2 Años</strong>
            </div>
          </div>

          <div className="flex justify-between text-[11px] font-mono text-neutral-500 pt-2 border-t border-black/[0.06]">
            <span>Folio: <strong className="text-neutral-800">{selectedSponsor.certificateId}</strong></span>
            <span>Válido hasta: <strong className="text-neutral-800">{selectedSponsor.expiryDate}</strong></span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-black/[0.06] flex items-center justify-between bg-[#fafafa]">
          <button
            onClick={() => {
              focusSponsor(selectedSponsor.id);
              setSelectedSponsor(null);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-medium border border-black/10 transition cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Ver en 3D</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCertificateSponsor(selectedSponsor);
                setSelectedSponsor(null);
              }}
              className="px-4 py-2 rounded-full bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-medium border border-black/10 transition cursor-pointer"
            >
              Certificado
            </button>

            <button
              onClick={handleVisitWebsite}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition cursor-pointer"
            >
              <span>Visitar Web</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
