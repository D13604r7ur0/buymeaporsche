import React from 'react';
import { X, ShieldAlert, FileText, CheckCircle, Scale, AlertTriangle, RefreshCw } from 'lucide-react';
import { CONTRACT_DAYS, CONTRACT_YEARS } from '../../utils/sampleData';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white text-neutral-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-neutral-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-heading font-black text-neutral-950 uppercase tracking-wide">
                Términos, Condiciones & Política PG-13
              </h2>
              <span className="text-[10px] font-mono text-neutral-500 block">
                Campaña Publicitaria Porsche 911 (992) · Vigencia {CONTRACT_YEARS} Años
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-950 hover:bg-neutral-200 transition cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-neutral-700 leading-relaxed font-sans">
          
          {/* Important Warning Banner */}
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-red-900 text-xs">
              <ShieldAlert className="w-4 h-4 text-[#D5001C] shrink-0" />
              <span>AVISO CRÍTICO DE MODERACIÓN Y POLÍTICA DE CONTENIDO PG-13</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Todos los espacios publicitarios en el Porsche 911 son visibles por miles de personas, familias y menores en eventos físicos y plataformas digitales. <strong>Queda estrictamente prohibido cualquier contenido para adultos, desnudez, violencia, actividades ilícitas o delictivas.</strong>
            </p>
          </div>

          {/* Clause 1 */}
          <div className="space-y-1.5">
            <h3 className="font-heading font-bold text-neutral-950 text-xs sm:text-sm flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-neutral-500" />
              1. Objeto del Patrocinio y Vigencia
            </h3>
            <p>
              El patrocinador adquiere el derecho de exhibición publicitaria por centímetro cuadrado (<strong className="text-neutral-900">cm²</strong>) sobre la carrocería del automóvil <strong className="text-neutral-900">Porsche 911 Carrera (992)</strong> durante un periodo ininterrumpido de <strong className="text-neutral-900">{CONTRACT_YEARS} años ({CONTRACT_DAYS} días naturales)</strong> a partir de la adquisición del vehículo.
            </p>
            <p>
              La exhibición incluye presencia digital interactiva 3D con enlace web personalizado y rotulación física con vinil automotriz de alta resistencia en Car Meets, concentraciones, pistas y eventos del sector automotriz.
            </p>
          </div>

          {/* Clause 2: Strict PG-13 */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
            <h3 className="font-heading font-bold text-neutral-950 text-xs sm:text-sm flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              2. Restricción Estricta de Contenido (Clasificación PG-13)
            </h3>
            <p>
              Todo material subido (logotipos, nombres comerciales, eslóganes, imágenes y enlaces URL de destino) debe ser apto para todo público. Se prohíbe terminantemente:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-neutral-800 font-medium">
              <li>Desnudez, pornografía o contenido sexualmente explícito / sugestivo.</li>
              <li>Apología de la violencia, armas, actos delictivos o crimen organizado.</li>
              <li>Promoción de sustancias ilícitas, estafas, esquemas fraudulentos o actividades ilegales.</li>
              <li>Contenido de odio, discriminatorio, difamatorio o que vulnere derechos de terceros.</li>
              <li>Uso no autorizado de marcas registradas ajenas.</li>
            </ul>
          </div>

          {/* Clause 3: Penalties and Space Resale */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-neutral-900 text-white">
            <h3 className="font-heading font-bold text-white text-xs sm:text-sm flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-red-400" />
              3. Sanción por Infracción, Retención de Fondos y Reventa del Espacio
            </h3>
            <p className="text-neutral-300 text-[11px]">
              En caso de que se detecte o reporte que un logotipo o enlace incumple la política PG-13 o cualquier ley aplicable:
            </p>
            <div className="space-y-1.5 pt-1 text-[11px]">
              <div className="flex items-start gap-2">
                <span className="text-red-400 font-bold">•</span>
                <span><strong className="text-white">Baja Inmediata:</strong> El logotipo y enlace serán eliminados de forma irrevocable tanto del showroom digital como del vinil del auto sin derecho a reclamo.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 font-bold">•</span>
                <span><strong className="text-white">Cero Reembolsos y Retención:</strong> No se realizará reembolso de ningún tipo; el dinero pagado se retendrá íntegramente en concepto de penalización por infracción a los términos.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 font-bold">•</span>
                <span><strong className="text-white">Reventa del Espacio:</strong> El espacio liberado se pondrá nuevamente a la venta a nuevos patrocinadores. Si el espacio no llega a venderse, los fondos originales permanecen igualmente retenidos.</span>
              </div>
            </div>
          </div>

          {/* Clause 4 */}
          <div className="space-y-1.5">
            <h3 className="font-heading font-bold text-neutral-950 text-xs sm:text-sm flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              4. Responsabilidad del Patrocinador
            </h3>
            <p>
              El patrocinador declara contar con los derechos legítimos sobre el logotipo, marca o diseño proporcionado, y asume plena responsabilidad legal sobre el contenido alojado en los enlaces web hacia los que redirige su patrocinio.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-mono text-neutral-500">
            Al confirmar tu patrocinio aceptas estos términos.
          </span>
          <button
            onClick={onClose}
            className="bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs px-5 py-2.5 rounded-full transition cursor-pointer uppercase tracking-wider"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
