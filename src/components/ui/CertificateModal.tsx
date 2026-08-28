import React from 'react';
import { useSponsors } from '../../context/SponsorContext';
import { 
  X, 
  Award, 
  ShieldCheck, 
  Share2, 
  Download
} from 'lucide-react';

export const CertificateModal: React.FC = () => {
  const { certificateSponsor, setCertificateSponsor, contractDays, contractYears } = useSponsors();

  if (!certificateSponsor) return null;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Certificado de Patrocinio - ${certificateSponsor.brandName}`,
        text: `¡${certificateSponsor.brandName} es patrocinador oficial del Porsche 911 (992) por 2 años!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('¡Enlace copiado al portapapeles!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-black/10 shadow-2xl overflow-hidden my-auto p-6 sm:p-8 text-neutral-900">
        
        {/* Close Button */}
        <button
          onClick={() => setCertificateSponsor(null)}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Box */}
        <div className="border border-black/[0.08] rounded-2xl p-6 sm:p-8 bg-[#fafafa] relative text-center space-y-5">
          
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow-md">
              <Award className="w-6 h-6" />
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 block mb-1">
              Certificado Oficial de Patrocinio
            </span>
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-neutral-900">
              Porsche 911 (992)
            </h1>
          </div>

          <div className="py-3 border-y border-black/[0.06] space-y-1">
            <span className="text-xs text-neutral-500 font-sans">Otorgado a la marca:</span>
            <div className="text-2xl font-heading font-bold text-neutral-900">
              {certificateSponsor.brandName.toUpperCase()}
            </div>
            <p className="text-xs text-neutral-600 italic font-sans max-w-md mx-auto">
              "{certificateSponsor.slogan}"
            </p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-left text-xs font-mono">
            <div className="p-3 rounded-xl bg-white border border-black/[0.06]">
              <span className="text-[9px] text-neutral-400 block">UBICACIÓN:</span>
              <strong className="text-neutral-900">{certificateSponsor.zoneName}</strong>
            </div>

            <div className="p-3 rounded-xl bg-white border border-black/[0.06]">
              <span className="text-[9px] text-neutral-400 block">SUPERFICIE:</span>
              <strong className="text-neutral-900">{certificateSponsor.widthCm}x{certificateSponsor.heightCm} cm ({certificateSponsor.areaCm2} cm²)</strong>
            </div>

            <div className="p-3 rounded-xl bg-white border border-black/[0.06] col-span-2 sm:col-span-1">
              <span className="text-[9px] text-neutral-400 block">VIGENCIA:</span>
              <strong className="text-emerald-600">{contractYears} Años ({contractDays} Días)</strong>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 pt-3 border-t border-black/[0.06] text-left">
            <div>
              <div>Folio: <strong className="text-neutral-800">{certificateSponsor.certificateId}</strong></div>
              <div>Válido hasta: <strong className="text-neutral-800">{certificateSponsor.expiryDate}</strong></div>
            </div>

            <div className="flex items-center gap-1.5 text-neutral-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Registro Oficial</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 mt-6">
          <span className="text-xs text-neutral-500">Patrocinador oficial Porsche 911 (992).</span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
