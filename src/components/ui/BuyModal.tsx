import React, { useState, useEffect } from 'react';
import { useSponsors } from '../../context/SponsorContext';
import type { SponsorTier, SponsorCategory } from '../../types/sponsor';
import { ZONES, SIZE_COMPARISONS, CONTRACT_DAYS, CONTRACT_YEARS } from '../../utils/sampleData';
import { 
  X, 
  Upload, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  MousePointerClick, 
  CreditCard,
  QrCode,
  Building2,
  Coins,
  CheckCircle2,
  Award,
  Sparkles,
  Eye,
  Sliders
} from 'lucide-react';

const CATEGORIES: SponsorCategory[] = [
  'Tecnología & AI',
  'Finanzas & Cripto',
  'Moda & Lujo',
  'Motorsport & Tuning',
  'Gastronomía & Bebidas',
  'Fitness & Deporte',
  'Startups & Software',
  'Agencias & Medios',
  'Otro',
];

const STICKER_BG_COLORS = [
  { name: 'Negro Jet', hex: '#0a0c10', text: '#ffffff' },
  { name: 'Blanco Carrara', hex: '#ffffff', text: '#0a0c10' },
  { name: 'Rojo Guards', hex: '#d5001c', text: '#ffffff' },
  { name: 'Amarillo Racing', hex: '#fed100', text: '#0a0c10' },
  { name: 'Carbono Mate', hex: '#16171a', text: '#ffffff' },
  { name: 'Vinil Transparente', hex: 'transparent', text: '#ffffff' },
];

const STICKER_BORDERS = [
  { name: 'Blanco', hex: '#ffffff' },
  { name: 'Oro Porsche', hex: '#d4af37' },
  { name: 'Rojo', hex: '#d5001c' },
  { name: 'Sin Borde', hex: 'transparent' },
];

export const BuyModal: React.FC = () => {
  const {
    isBuyModalOpen,
    setIsBuyModalOpen,
    draftSponsor,
    setDraftSponsor,
    setIsPlacementMode,
    addSponsor,
    setCameraPreset,
    focusSponsor,
    setCertificateSponsor,
  } = useSponsors();

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Sticker customization state
  const [selectedTier, setSelectedTier] = useState<SponsorTier>(draftSponsor?.tier || 'premium_door');
  const [widthCm, setWidthCm] = useState<number>(draftSponsor?.widthCm || 25);
  const [heightCm, setHeightCm] = useState<number>(draftSponsor?.heightCm || 15);
  const [brandName, setBrandName] = useState<string>(draftSponsor?.brandName || '');
  const [slogan, setSlogan] = useState<string>(draftSponsor?.slogan || '');
  const [targetUrl, setTargetUrl] = useState<string>(draftSponsor?.targetUrl || 'https://');
  const [email, setEmail] = useState<string>(draftSponsor?.email || '');
  const [category, setCategory] = useState<SponsorCategory>('Tecnología & AI');
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>(draftSponsor?.logoUrl || '');
  const [stickerBgColor, setStickerBgColor] = useState<string>('#0a0c10');
  const [stickerBorderColor, setStickerBorderColor] = useState<string>('#ffffff');
  const [logoScale, setLogoScale] = useState<number>(1);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'spei' | 'mercadopago' | 'crypto'>('card');
  const [cardNumber, setCardNumber] = useState<string>('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvc, setCardCvc] = useState<string>('123');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [createdSponsorId, setCreatedSponsorId] = useState<string | null>(null);

  const currentZone = ZONES.find((z) => z.id === selectedTier) || ZONES[0];
  const areaCm2 = widthCm * heightCm;
  const totalPriceMxn = areaCm2 * currentZone.pricePerCm2;
  const dailyCostMxn = totalPriceMxn / CONTRACT_DAYS;

  // Sync Draft with 3D in Real-Time
  useEffect(() => {
    if (!isBuyModalOpen) return;

    setDraftSponsor({
      brandName: brandName || 'TU MARCA',
      slogan: slogan || 'Patrocinador Oficial Porsche 911',
      targetUrl: targetUrl || 'buymeaporsche.com',
      logoUrl: logoPreviewUrl,
      tier: selectedTier,
      widthCm,
      heightCm,
      areaCm2,
      pricePerCm2: currentZone.pricePerCm2,
      totalPriceMxn,
      zoneName: currentZone.name,
      position3D: draftSponsor?.position3D || currentZone.defaultPosition,
      rotation3D: draftSponsor?.rotation3D || currentZone.defaultRotation,
      scale3D: [widthCm / 20, heightCm / 20, 1],
      stickerBgColor,
      stickerBorderColor,
      logoScale,
    });
  }, [
    widthCm,
    heightCm,
    selectedTier,
    brandName,
    slogan,
    targetUrl,
    logoPreviewUrl,
    stickerBgColor,
    stickerBorderColor,
    logoScale,
    isBuyModalOpen,
  ]);

  if (!isBuyModalOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyPreset = (preset: typeof SIZE_COMPARISONS[0]) => {
    const sideA = Math.round(Math.sqrt(preset.cm2 * 1.3));
    const sideB = Math.round(preset.cm2 / sideA);
    setWidthCm(sideA);
    setHeightCm(sideB);
  };

  const handleExecutePayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const created = addSponsor({
        brandName: brandName.trim() || 'Marca Patrocinadora',
        slogan: slogan.trim() || 'Patrocinador oficial Porsche 911 (992)',
        logoUrl: logoPreviewUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
        targetUrl: targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`,
        email: email || 'contacto@sponsor.com',
        category,
        tier: selectedTier,
        widthCm,
        heightCm,
        areaCm2,
        pricePerCm2: currentZone.pricePerCm2,
        totalPriceMxn,
        position3D: draftSponsor?.position3D || currentZone.defaultPosition,
        rotation3D: draftSponsor?.rotation3D || currentZone.defaultRotation,
        scale3D: [widthCm / 20, heightCm / 20, 1],
        zoneName: currentZone.name,
        stickerBgColor,
        stickerBorderColor,
        logoScale,
        contractYears: CONTRACT_YEARS,
        includesPhysicalVinylWrap: true,
        includesTrackDaysExhibition: true,
        includesSocialMediaTags: true,
        vipTrackPassesCount: selectedTier === 'vip_wing' ? 4 : selectedTier === 'hood_central' ? 3 : 2,
      });

      setCreatedSponsorId(created.id);
      setIsProcessing(false);
      setPaymentSuccess(true);
      setStep(4);
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-black/10 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col text-neutral-900">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-black/[0.06] flex items-center justify-between bg-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-semibold">
                {paymentSuccess ? '¡Confirmación Exitosa!' : `Paso ${step} de 3`}
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                5 Años de Vigencia Garantizada
              </span>
            </div>
            <h2 className="text-xl font-heading font-bold text-neutral-900">
              {step === 1 && '1. Diseñador de Sticker en Vivo'}
              {step === 2 && '2. Ubicación & Medidas en el 911'}
              {step === 3 && '3. Pasarela de Pago & Emisión'}
              {step === 4 && '¡Tu Logo ya está en el Porsche 911!'}
            </h2>
          </div>

          <button
            onClick={() => {
              setIsBuyModalOpen(false);
              setDraftSponsor(null);
            }}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          
          {/* STEP 1: LIVE STICKER DESIGN STUDIO */}
          {step === 1 && (
            <div className="space-y-6">
              
              {/* Interactive Sticker Preview Canvas */}
              <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] flex flex-col items-center justify-center text-center relative overflow-hidden">
                <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 absolute top-3 left-4">
                  Vista Previa del Sticker
                </span>

                <div
                  className="w-full max-w-sm h-36 sm:h-44 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 relative shadow-md border"
                  style={{
                    backgroundColor: stickerBgColor === 'transparent' ? 'rgba(0,0,0,0.85)' : stickerBgColor,
                    borderColor: stickerBorderColor === 'transparent' ? 'rgba(255,255,255,0.1)' : stickerBorderColor,
                    borderWidth: stickerBorderColor === 'transparent' ? '1px' : '3px',
                  }}
                >
                  <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
                    <span>{widthCm}x{heightCm} cm ({areaCm2} cm²)</span>
                    <span className="text-emerald-400">5 AÑOS</span>
                  </div>

                  <div className="flex items-center gap-3 my-auto">
                    {logoPreviewUrl ? (
                      <div className="w-14 h-14 rounded-xl bg-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden border border-white/20">
                        <img
                          src={logoPreviewUrl}
                          alt="Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : null}

                    <div className={logoPreviewUrl ? 'text-left' : 'text-center w-full'}>
                      <div className="font-heading font-bold text-lg sm:text-xl text-white tracking-wide uppercase line-clamp-1">
                        {brandName || 'TU MARCA AQUÍ'}
                      </div>
                      <div className="text-xs text-neutral-300 font-sans line-clamp-1">
                        {slogan || 'Slogan de tu empresa o proyecto'}
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-cyan-400 text-left line-clamp-1">
                    ↗ {(targetUrl || 'tumarca.com').replace(/^https?:\/\//, '')}
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-neutral-500 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-neutral-800" />
                  <span>Este diseño se proyecta en tiempo real sobre el Porsche 3D.</span>
                </div>
              </div>

              {/* Text Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-neutral-500 block mb-1">Nombre de Marca o Empresa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Apex Dynamics"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full bg-[#fafafa] border border-black/10 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-neutral-500 block mb-1">Slogan o Mensaje Corto *</label>
                  <input
                    type="text"
                    placeholder="Ej. Tecnología Automotriz del Futuro"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    className="w-full bg-[#fafafa] border border-black/10 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              {/* Upload Logo + Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-neutral-500 block mb-1">Subir Imagen o Logotipo (PNG/JPG):</label>
                  <div className="p-3 rounded-xl bg-[#fafafa] border border-black/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-neutral-200 flex items-center justify-center shrink-0">
                        {logoPreviewUrl ? (
                          <img src={logoPreviewUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <Upload className="w-4 h-4 text-neutral-500" />
                        )}
                      </div>
                      <span className="text-xs text-neutral-600 truncate">
                        {logoPreviewUrl ? 'Logo cargado' : 'Sin archivo'}
                      </span>
                    </div>

                    <label className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-900 border border-black/10 text-xs font-medium rounded-lg transition cursor-pointer shrink-0">
                      Examinar
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-neutral-500 block mb-1">Sitio Web Oficial:</label>
                  <input
                    type="url"
                    placeholder="https://tumarca.com"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="w-full bg-[#fafafa] border border-black/10 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              {/* Color Styling */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-mono text-neutral-500 block mb-1.5">Color de Fondo del Sticker:</label>
                  <div className="flex flex-wrap gap-2">
                    {STICKER_BG_COLORS.map((bg) => (
                      <button
                        key={bg.name}
                        type="button"
                        onClick={() => setStickerBgColor(bg.hex)}
                        className={`px-2.5 py-1 rounded-full text-xs font-mono border transition cursor-pointer ${
                          stickerBgColor === bg.hex
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                            : 'bg-white text-neutral-700 border-black/10 hover:border-black/30'
                        }`}
                      >
                        {bg.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-neutral-500 block mb-1.5">Borde del Sticker:</label>
                  <div className="flex flex-wrap gap-2">
                    {STICKER_BORDERS.map((border) => (
                      <button
                        key={border.name}
                        type="button"
                        onClick={() => setStickerBorderColor(border.hex)}
                        className={`px-2.5 py-1 rounded-full text-xs font-mono border transition cursor-pointer ${
                          stickerBorderColor === border.hex
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                            : 'bg-white text-neutral-700 border-black/10 hover:border-black/30'
                        }`}
                      >
                        {border.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: LOCATION & DIMENSIONS */}
          {step === 2 && (
            <div className="space-y-6">
              
              {/* Quick Size Presets */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-neutral-500 block">Plantillas sugeridas de tamaño:</label>
                <div className="flex flex-wrap gap-2">
                  {SIZE_COMPARISONS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-3 py-1 rounded-full bg-[#fafafa] hover:bg-neutral-100 border border-black/[0.08] text-xs text-neutral-700 transition cursor-pointer"
                    >
                      {preset.name} ({preset.cm2} cm²)
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-neutral-500">Ancho del Sticker:</span>
                    <span className="text-neutral-900 font-bold">{widthCm} cm</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={120}
                    value={widthCm}
                    onChange={(e) => setWidthCm(Number(e.target.value))}
                    className="w-full accent-neutral-900 bg-neutral-200 cursor-pointer h-2 rounded-lg"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-neutral-500">Alto del Sticker:</span>
                    <span className="text-neutral-900 font-bold">{heightCm} cm</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={60}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full accent-neutral-900 bg-neutral-200 cursor-pointer h-2 rounded-lg"
                  />
                </div>
              </div>

              {/* Zone Selector */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-neutral-500 block">Zona de la carrocería en el 911:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ZONES.filter((z) => z.id !== 'showroom_floor').map((zone) => (
                    <div
                      key={zone.id}
                      onClick={() => {
                        setSelectedTier(zone.id);
                        if (zone.id === 'vip_wing') setCameraPreset('wing');
                        else if (zone.id === 'hood_central') setCameraPreset('hood');
                        else if (zone.id === 'premium_door') setCameraPreset('door_right');
                        else setCameraPreset('overview');
                      }}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                        selectedTier === zone.id
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                          : 'bg-[#fafafa] border-black/[0.06] text-neutral-800 hover:border-black/20'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span>{zone.shortName}</span>
                        <span className={`font-mono text-[11px] ${selectedTier === zone.id ? 'text-neutral-300' : 'text-neutral-600'}`}>
                          ${zone.pricePerCm2} MXN/cm²
                        </span>
                      </div>
                      <p className={`text-[11px] mt-0.5 ${selectedTier === zone.id ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        {zone.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Calculation Pill */}
              <div className="p-4 rounded-2xl bg-neutral-900 text-white flex justify-between items-center shadow-md">
                <div>
                  <span className="text-[10px] font-mono text-neutral-400 block">Costo Diario Prorrateado:</span>
                  <div className="text-2xl font-mono font-bold text-emerald-400">
                    ${dailyCostMxn.toFixed(2)} <span className="text-xs text-neutral-400 font-normal">MXN / día</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-neutral-400 block">Total Inversión Única (5 Años):</span>
                  <div className="text-2xl font-mono font-bold text-white">
                    ${totalPriceMxn.toLocaleString()} MXN
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: FUNCTIONAL PAYMENT GATEWAY */}
          {step === 3 && (
            <div className="space-y-6">
              
              {/* Payment Methods Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border text-xs font-medium flex flex-col items-center gap-1.5 transition cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                      : 'bg-[#fafafa] border-black/[0.06] text-neutral-700 hover:border-black/20'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Tarjeta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('spei')}
                  className={`p-3 rounded-2xl border text-xs font-medium flex flex-col items-center gap-1.5 transition cursor-pointer ${
                    paymentMethod === 'spei'
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                      : 'bg-[#fafafa] border-black/[0.06] text-neutral-700 hover:border-black/20'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>SPEI / Banco</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('mercadopago')}
                  className={`p-3 rounded-2xl border text-xs font-medium flex flex-col items-center gap-1.5 transition cursor-pointer ${
                    paymentMethod === 'mercadopago'
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                      : 'bg-[#fafafa] border-black/[0.06] text-neutral-700 hover:border-black/20'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Mercado Pago</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('crypto')}
                  className={`p-3 rounded-2xl border text-xs font-medium flex flex-col items-center gap-1.5 transition cursor-pointer ${
                    paymentMethod === 'crypto'
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                      : 'bg-[#fafafa] border-black/[0.06] text-neutral-700 hover:border-black/20'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span>USDT / Cripto</span>
                </button>
              </div>

              {/* METHOD 1: CARD FORM */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  
                  {/* Visual Card Card */}
                  <div className="w-full max-w-sm mx-auto p-5 rounded-2xl bg-neutral-900 text-white shadow-lg space-y-4 font-mono text-xs border border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-heading font-bold tracking-widest text-neutral-300">PORSCHE PAY</span>
                      <span className="text-xs text-neutral-400">VISA / MASTERCARD</span>
                    </div>

                    <div className="text-base tracking-widest text-white py-1">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>

                    <div className="flex justify-between items-end text-[10px] text-neutral-400">
                      <div>
                        <div className="uppercase">Titular</div>
                        <div className="text-white text-xs">{cardHolder || brandName || 'NOMBRE TITULAR'}</div>
                      </div>

                      <div>
                        <div className="uppercase">Expira</div>
                        <div className="text-white text-xs">{cardExpiry}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-xs font-mono text-neutral-500 block mb-1">Número de Tarjeta</label>
                      <input
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-[#fafafa] border border-black/10 rounded-xl px-4 py-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-neutral-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-mono text-neutral-500 block mb-1">Nombre en Tarjeta</label>
                        <input
                          type="text"
                          placeholder="Juan Pérez"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          className="w-full bg-[#fafafa] border border-black/10 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-mono text-neutral-500 block mb-1">Vence</label>
                          <input
                            type="text"
                            placeholder="12/28"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full bg-[#fafafa] border border-black/10 rounded-xl px-3 py-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-neutral-900"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-mono text-neutral-500 block mb-1">CVC</label>
                          <input
                            type="password"
                            placeholder="123"
                            maxLength={4}
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            className="w-full bg-[#fafafa] border border-black/10 rounded-xl px-3 py-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-neutral-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* METHOD 2: SPEI / TRANSFERENCIA */}
              {paymentMethod === 'spei' && (
                <div className="p-5 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-3 text-xs font-mono">
                  <div className="text-sm font-heading font-bold text-neutral-900">
                    Transferencia Interbancaria SPEI
                  </div>

                  <div className="space-y-2 pt-2 border-t border-black/[0.06]">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Banco Receptor:</span>
                      <strong className="text-neutral-900">STP / BBVA México</strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-neutral-500">CLABE Interbancaria:</span>
                      <strong className="text-neutral-900 font-bold">6461 8015 7044 9119 92</strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-neutral-500">Beneficiario:</span>
                      <strong className="text-neutral-900">Buy Me A Porsche 911</strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-neutral-500">Concepto de Pago:</span>
                      <strong className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">P992-{(brandName || 'SPONSOR').substring(0, 8).toUpperCase()}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* METHOD 3: MERCADO PAGO QR */}
              {paymentMethod === 'mercadopago' && (
                <div className="p-6 rounded-2xl bg-[#fafafa] border border-black/[0.06] text-center space-y-3">
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl border border-black/10 flex items-center justify-center">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://buymeaporsche.com/pay"
                      alt="QR Mercado Pago"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-xs text-neutral-600 font-sans block">
                    Escanea con la app de Mercado Pago o banca móvil CoDi.
                  </span>
                </div>
              )}

              {/* METHOD 4: CRIPTO USDT */}
              {paymentMethod === 'crypto' && (
                <div className="p-5 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-2 text-xs font-mono">
                  <div className="text-neutral-500">Dirección USDT (TRC-20):</div>
                  <div className="p-2.5 bg-white rounded-xl border border-black/10 break-all font-bold text-neutral-900">
                    TPor992CarreraShowroomMXN88x9911
                  </div>
                  <span className="text-[11px] text-neutral-500 block">
                    Monto aproximado: ${(totalPriceMxn / 19.5).toFixed(2)} USDT
                  </span>
                </div>
              )}

              {/* Inscription Details */}
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pago protegido y garantizado por 5 años con folio oficial digital.</span>
              </div>

            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION & 3D IMMEDIATE ACTION */}
          {step === 4 && (
            <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] text-center space-y-5 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 font-bold block">
                  ¡Transacción Confirmada con Éxito!
                </span>
                <h3 className="text-2xl font-heading font-bold text-neutral-900">
                  {brandName || 'Tu Marca'} ya forma parte del Porsche 911 (992)
                </h3>
                <p className="text-xs text-neutral-500 max-w-md mx-auto font-sans">
                  Tu sticker ha sido agregado permanentemente al modelo 3D y se incluirá en el vinilado del auto físico para los próximos 5 años de gira.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] max-w-sm mx-auto text-xs font-mono space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Zona:</span>
                  <span className="text-neutral-900 font-bold">{currentZone.name}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-500">Medidas:</span>
                  <span className="text-neutral-900">{widthCm}x{heightCm} cm ({areaCm2} cm²)</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-500">Inversión:</span>
                  <span className="text-emerald-600 font-bold">${totalPriceMxn.toLocaleString()} MXN</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-500">Vigencia:</span>
                  <span className="text-neutral-900 font-semibold">5 Años ({CONTRACT_DAYS} Días)</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsBuyModalOpen(false);
                    if (createdSponsorId) focusSponsor(createdSponsorId);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver mi Sticker en el Porsche 3D</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 sm:p-6 border-t border-black/[0.06] flex items-center justify-between bg-white">
          {step > 1 && step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev - 1) as any)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Atrás</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev + 1) as any)}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition cursor-pointer shadow-sm"
            >
              <span>{step === 1 ? 'Elegir Ubicación' : 'Continuar al Pago'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : step === 3 ? (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleExecutePayment}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition cursor-pointer shadow-md disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Procesando Pago Seguro...</span>
              ) : (
                <span>Confirmar y Comprar (${totalPriceMxn.toLocaleString()} MXN)</span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsBuyModalOpen(false);
                setDraftSponsor(null);
              }}
              className="px-6 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition cursor-pointer"
            >
              Cerrar
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
