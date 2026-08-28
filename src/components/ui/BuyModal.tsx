import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useSponsors } from '../../context/SponsorContext';
import type { SponsorTier, SponsorCategory } from '../../types/sponsor';
import { ZONES, CONTRACT_DAYS, CONTRACT_YEARS } from '../../utils/sampleData';
import { sounds } from '../../utils/soundEffects';
import { 
  X, 
  Upload, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  CreditCard, 
  QrCode, 
  Building2, 
  Coins, 
  CheckCircle2, 
  Sparkles, 
  Eye, 
  Award, 
  Wand2, 
  Maximize2, 
  Lock, 
  Unlock,
  Move
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
    addSponsor,
    setCameraPreset,
    focusSponsor,
    setCertificateSponsor,
  } = useSponsors();

  // Wizard state: 1 = Subir & Redimensionar Logo, 2 = Pasarela de Pago, 3 = Confirmación Exitosa
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Logo & Sticker customization state
  const [selectedTier, setSelectedTier] = useState<SponsorTier>(draftSponsor?.tier || 'hood_central');
  const [widthCm, setWidthCm] = useState<number>(draftSponsor?.widthCm || 35);
  const [heightCm, setHeightCm] = useState<number>(draftSponsor?.heightCm || 20);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(35 / 20);
  
  const [brandName, setBrandName] = useState<string>(draftSponsor?.brandName || '');
  const [sponsorName, setSponsorName] = useState<string>(draftSponsor?.sponsorName || '');
  const [slogan, setSlogan] = useState<string>(draftSponsor?.slogan || '');
  const [targetUrl, setTargetUrl] = useState<string>(draftSponsor?.targetUrl || 'https://');
  const [email, setEmail] = useState<string>(draftSponsor?.email || '');
  const [category, setCategory] = useState<SponsorCategory>('Tecnología & AI');
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>(draftSponsor?.logoUrl || '');
  const [stickerBgColor, setStickerBgColor] = useState<string>('#0a0c10');
  const [stickerBorderColor, setStickerBorderColor] = useState<string>('#ffffff');
  const [logoScale, setLogoScale] = useState<number>(1);

  // Drag Resizing State on Visual Canvas
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const resizeStartPosRef = useRef<{ x: number; y: number; startW: number; startH: number }>({ x: 0, y: 0, startW: 35, startH: 20 });

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'spei' | 'mercadopago' | 'crypto'>('card');
  const [cardNumber, setCardNumber] = useState<string>('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvc, setCardCvc] = useState<string>('123');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [newlyCreatedSponsor, setNewlyCreatedSponsor] = useState<any>(null);

  const currentZone = ZONES.find((z) => z.id === selectedTier) || ZONES[0];
  const areaCm2 = widthCm * heightCm;
  const totalPriceMxn = areaCm2 * currentZone.pricePerCm2;
  const dailyCostMxn = totalPriceMxn / CONTRACT_DAYS;

  // Sync Draft with 3D in Real-Time continuously
  useEffect(() => {
    if (!isBuyModalOpen) return;

    setDraftSponsor({
      brandName: brandName || 'TU MARCA',
      sponsorName: sponsorName || '',
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
      scale3D: [widthCm / 25, heightCm / 25, 1],
      stickerBgColor,
      stickerBorderColor,
      logoScale,
      email,
      category,
    });
  }, [
    widthCm,
    heightCm,
    selectedTier,
    brandName,
    sponsorName,
    slogan,
    targetUrl,
    logoPreviewUrl,
    stickerBgColor,
    stickerBorderColor,
    logoScale,
    email,
    category,
    isBuyModalOpen,
  ]);

  if (!isBuyModalOpen) return null;

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreviewUrl(result);
        
        // Auto calculate aspect ratio of image
        const img = new Image();
        img.onload = () => {
          const ratio = (img.naturalWidth || 1) / (img.naturalHeight || 1);
          setAspectRatio(ratio);
          if (ratio > 1.2) {
            setWidthCm(36);
            setHeightCm(Math.max(8, Math.round(36 / ratio)));
          } else {
            setHeightCm(24);
            setWidthCm(Math.max(8, Math.round(24 * ratio)));
          }
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag handles resize interaction
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      startW: widthCm,
      startH: heightCm,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - resizeStartPosRef.current.x;
      const deltaY = moveEvent.clientY - resizeStartPosRef.current.y;

      const scaleFactor = 0.22;
      let newW = Math.max(8, Math.min(120, Math.round(resizeStartPosRef.current.startW + deltaX * scaleFactor)));
      let newH = Math.max(5, Math.min(60, Math.round(resizeStartPosRef.current.startH + deltaY * scaleFactor)));

      if (lockAspectRatio && aspectRatio > 0) {
        newH = Math.max(5, Math.min(60, Math.round(newW / aspectRatio)));
      }

      setWidthCm(newW);
      setHeightCm(newH);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleAutoFillDemo = () => {
    sounds.playClickSound();
    setBrandName('Apex Motors AI');
    setSponsorName('Diego Arturo');
    setSlogan('Tecnología de Inteligencia Artificial para Pista');
    setTargetUrl('https://apex-motors.ai');
    setEmail('sponsor@apex-motors.ai');
    setCategory('Tecnología & AI');
    setWidthCm(40);
    setHeightCm(20);
    setAspectRatio(2);
    setStickerBgColor('#0a0c10');
    setStickerBorderColor('#ffffff');
    setLogoPreviewUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80');
    setCardHolder('DIEGO ARTURO');
  };

  const handleExecutePayment = () => {
    sounds.playClickSound();
    setIsProcessing(true);

    setTimeout(() => {
      const created = addSponsor({
        brandName: brandName.trim() || 'Marca Patrocinadora',
        sponsorName: sponsorName.trim() || brandName.trim(),
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
        scale3D: [widthCm / 25, heightCm / 25, 1],
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

      setNewlyCreatedSponsor(created);
      setIsProcessing(false);
      setPaymentSuccess(true);
      setStep(3);

      // Sound & Confetti celebration
      sounds.playSuccessChime();
      setTimeout(() => sounds.playEngineRev(), 300);

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#d5001c', '#fed100', '#ffffff', '#0a0c10', '#38bdf8'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
        });
      }, 350);

    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-black/10 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col text-neutral-900">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-black/[0.06] flex items-center justify-between bg-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-semibold">
                {paymentSuccess ? '¡Confirmación Exitosa!' : `Paso ${step} de 2`}
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                2 Años de Vigencia Garantizada
              </span>
            </div>
            <h2 className="text-xl font-heading font-bold text-neutral-900">
              {step === 1 && '1. Sube tu Logo, Redimensiónalo y Calcula el Costo'}
              {step === 2 && '2. Pasarela de Pago & Emisión de Certificado'}
              {step === 3 && '¡Tu Logo ya está en el Porsche 911!'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {step === 1 && (
              <button
                type="button"
                onClick={handleAutoFillDemo}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-mono transition cursor-pointer"
                title="Llenar datos de prueba automáticamente"
              >
                <Wand2 className="w-3 h-3 text-neutral-600" />
                <span className="hidden sm:inline">Demo 1-Clic</span>
              </button>
            )}

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
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          
          {/* STEP 1: UPLOAD, INTERACTIVE RESIZE & LIVE PRICING */}
          {step === 1 && (
            <div className="space-y-6">
              
              {/* Top: Upload Box & Quick Actions */}
              <div className="p-4 rounded-2xl bg-[#fafafa] border border-dashed border-black/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-12 h-12 rounded-xl bg-white border border-black/10 flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1">
                    {logoPreviewUrl ? (
                      <img src={logoPreviewUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Upload className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-neutral-900 block">
                      {logoPreviewUrl ? 'Logotipo Cargado' : 'Sube tu Logotipo o Imagen'}
                    </span>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {logoPreviewUrl ? 'Listo para redimensionar en el lienzo' : 'PNG transparente, JPG o SVG'}
                    </span>
                  </div>
                </div>

                <label className="w-full sm:w-auto text-center px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-sm shrink-0">
                  <span>{logoPreviewUrl ? 'Cambiar Imagen' : 'Seleccionar Archivo'}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {logoPreviewUrl && (
                <div className="flex items-center justify-between gap-3 text-xs font-mono p-3 bg-[#fafafa] rounded-xl border border-black/[0.06]">
                  <span className="text-neutral-500">Escala de Imagen en Sticker:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0.5}
                      max={1.5}
                      step={0.05}
                      value={logoScale}
                      onChange={(e) => setLogoScale(Number(e.target.value))}
                      className="accent-neutral-900 bg-neutral-200 cursor-pointer h-2 rounded-lg"
                    />
                    <span className="text-neutral-900 font-bold w-10 text-right">{logoScale}x</span>
                  </div>
                </div>
              )}

              {/* INTERACTIVE VISUAL RESIZER CANVAS */}
              <div className="p-6 rounded-3xl bg-[#f4f5f7] border border-black/[0.08] relative overflow-hidden flex flex-col items-center justify-center select-none min-h-[260px]">
                
                {/* Rulers Background Grid */}
                <div 
                  className="absolute inset-0 opacity-[0.08] pointer-events-none"
                  style={{
                    backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />

                <div className="absolute top-3 left-4 flex items-center gap-2 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                  <Move className="w-3 h-3 text-neutral-400" />
                  <span>Arrastra la esquina para redimensionar en vivo</span>
                </div>

                {/* Aspect Ratio Lock Toggle */}
                <button
                  type="button"
                  onClick={() => setLockAspectRatio(!lockAspectRatio)}
                  className="absolute top-3 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 border border-black/10 text-[11px] font-mono text-neutral-700 shadow-sm hover:bg-white cursor-pointer"
                >
                  {lockAspectRatio ? <Lock className="w-3 h-3 text-emerald-600" /> : <Unlock className="w-3 h-3 text-neutral-400" />}
                  <span>{lockAspectRatio ? 'Proporción Bloqueada' : 'Libre'}</span>
                </button>

                {/* THE RESIZABLE STICKER BOX */}
                <div
                  className={`relative transition-shadow duration-150 rounded-2xl p-4 flex flex-col justify-between shadow-lg border-2 ${
                    isResizing ? 'ring-4 ring-black/15 shadow-2xl scale-[1.01]' : ''
                  }`}
                  style={{
                    width: `${Math.max(160, Math.min(380, widthCm * 3.4))}px`,
                    height: `${Math.max(100, Math.min(240, heightCm * 3.4))}px`,
                    backgroundColor: stickerBgColor === 'transparent' ? 'rgba(10,12,16,0.88)' : stickerBgColor,
                    borderColor: stickerBorderColor === 'transparent' ? 'rgba(255,255,255,0.2)' : stickerBorderColor,
                  }}
                >
                  {/* Top Label */}
                  <div className="flex justify-between items-center text-[10px] font-mono text-neutral-300">
                    <span className="bg-black/40 px-1.5 py-0.5 rounded font-bold">
                      {widthCm} × {heightCm} cm
                    </span>
                    <span className="text-emerald-400 font-bold bg-black/40 px-1.5 py-0.5 rounded">
                      {areaCm2} cm²
                    </span>
                  </div>

                  {/* Logo Center Display */}
                  <div className="flex items-center gap-3 my-auto overflow-hidden">
                    {logoPreviewUrl ? (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden border border-white/20">
                        <img
                          src={logoPreviewUrl}
                          alt="Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : null}

                    <div className={logoPreviewUrl ? 'text-left overflow-hidden' : 'text-center w-full'}>
                      <div className="font-heading font-bold text-base sm:text-lg text-white tracking-wide uppercase truncate">
                        {brandName || 'TU MARCA AQUÍ'}
                      </div>
                      <div className="text-[11px] text-neutral-300 font-sans truncate">
                        {slogan || 'Patrocinador Oficial Porsche 911'}
                      </div>
                    </div>
                  </div>

                  {/* Bottom URL */}
                  <div className="text-[9px] font-mono text-cyan-400 text-left truncate">
                    ↗ {(targetUrl || 'tumarca.com').replace(/^https?:\/\//, '')}
                  </div>

                  {/* DRAG CORNER RESIZE HANDLE */}
                  <div
                    onPointerDown={handleResizePointerDown}
                    className="absolute -bottom-2.5 -right-2.5 w-6 h-6 rounded-full bg-neutral-900 text-white border-2 border-white shadow-xl flex items-center justify-center cursor-nwse-resize hover:scale-125 transition-transform"
                    title="Arrastra para redimensionar el logo"
                  >
                    <Maximize2 className="w-3 h-3 rotate-90" />
                  </div>
                </div>

                <div className="mt-4 text-[11px] text-neutral-500 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-neutral-800" />
                  <span>El tamaño en el Porsche 3D cambia en tiempo real mientras redimensionas.</span>
                </div>
              </div>

              {/* Real-Time Size Sliders (Alternative to Dragging) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-neutral-500">Ancho ({widthCm} cm):</span>
                    <strong className="text-neutral-900">{widthCm} cm</strong>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={120}
                    value={widthCm}
                    onChange={(e) => {
                      const w = Number(e.target.value);
                      setWidthCm(w);
                      if (lockAspectRatio && aspectRatio > 0) {
                        setHeightCm(Math.max(5, Math.min(60, Math.round(w / aspectRatio))));
                      }
                    }}
                    className="w-full accent-neutral-900 bg-neutral-200 cursor-pointer h-2 rounded-lg"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-neutral-500">Alto ({heightCm} cm):</span>
                    <strong className="text-neutral-900">{heightCm} cm</strong>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={60}
                    value={heightCm}
                    onChange={(e) => {
                      const h = Number(e.target.value);
                      setHeightCm(h);
                      if (lockAspectRatio && aspectRatio > 0) {
                        setWidthCm(Math.max(8, Math.min(120, Math.round(h * aspectRatio))));
                      }
                    }}
                    className="w-full accent-neutral-900 bg-neutral-200 cursor-pointer h-2 rounded-lg"
                  />
                </div>
              </div>

              {/* Brand and Personal Names */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-mono text-neutral-500 block mb-1">Nombre de la Marca / Empresa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Apex Dynamics"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full bg-[#fafafa] border border-black/10 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-neutral-500 block mb-1">Tu Nombre / Patrocinador (Opcional):</label>
                  <input
                    type="text"
                    placeholder="Ej. Diego Arturo"
                    value={sponsorName}
                    onChange={(e) => setSponsorName(e.target.value)}
                    className="w-full bg-[#fafafa] border border-black/10 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-neutral-500 block mb-1">Slogan o Mensaje *</label>
                  <input
                    type="text"
                    placeholder="Ej. Tecnología de Pistas"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    className="w-full bg-[#fafafa] border border-black/10 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              {/* Zone Placement on Car */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-neutral-500 block">Zona de la carrocería en el 911:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ZONES.filter((z) => z.id !== 'showroom_floor').map((zone) => (
                    <div
                      key={zone.id}
                      onClick={() => {
                        sounds.playClickSound();
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

              {/* Links and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-mono text-neutral-500 block mb-1">Sitio Web Oficial:</label>
                  <input
                    type="url"
                    placeholder="https://tumarca.com"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="w-full bg-[#fafafa] border border-black/10 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-neutral-500 block mb-1">Email de Contacto:</label>
                  <input
                    type="email"
                    placeholder="contacto@tumarca.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#fafafa] border border-black/10 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-neutral-500 block mb-1">Categoría:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SponsorCategory)}
                    className="w-full bg-[#fafafa] border border-black/10 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Color Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="text-xs font-mono text-neutral-500 block mb-1.5">Fondo del Sticker:</label>
                  <div className="flex flex-wrap gap-2">
                    {STICKER_BG_COLORS.map((bg) => (
                      <button
                        key={bg.name}
                        type="button"
                        onClick={() => {
                          sounds.playClickSound();
                          setStickerBgColor(bg.hex);
                        }}
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
                        onClick={() => {
                          sounds.playClickSound();
                          setStickerBorderColor(border.hex);
                        }}
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

              {/* LIVE DYNAMIC PRICE COUNTER */}
              <div className="p-5 rounded-2xl bg-neutral-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg border border-white/10">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-neutral-400 block uppercase">
                    Cálculo Automático de Superficie:
                  </span>
                  <div className="text-xs font-mono text-neutral-300">
                    {widthCm} × {heightCm} cm = <strong className="text-white">{areaCm2} cm²</strong> (${currentZone.pricePerCm2} MXN/cm²)
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400">
                    ${dailyCostMxn.toFixed(2)} MXN / día (por 2 años de gira)
                  </div>
                </div>

                <div className="sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
                  <span className="text-[10px] font-mono text-neutral-400 block uppercase">Total a Cobrar:</span>
                  <div className="text-2xl font-mono font-bold text-white">
                    ${totalPriceMxn.toLocaleString()} <span className="text-xs font-normal text-neutral-400">MXN</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: FUNCTIONAL PAYMENT GATEWAY */}
          {step === 2 && (
            <div className="space-y-6">
              
              {/* Order Summary Pill */}
              <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.06] flex justify-between items-center text-xs font-mono">
                <div>
                  <span className="text-neutral-500 block text-[10px]">DISEÑO A COBRAR:</span>
                  <strong className="text-neutral-900">{brandName || 'Tu Marca'} · {currentZone.name}</strong>
                  <div className="text-neutral-500 text-[11px]">{widthCm}×{heightCm} cm ({areaCm2} cm²)</div>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 block text-[10px]">TOTAL:</span>
                  <span className="text-xl font-bold text-neutral-900">${totalPriceMxn.toLocaleString()} MXN</span>
                </div>
              </div>

              {/* Payment Methods Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClickSound();
                    setPaymentMethod('card');
                  }}
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
                  onClick={() => {
                    sounds.playClickSound();
                    setPaymentMethod('spei');
                  }}
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
                  onClick={() => {
                    sounds.playClickSound();
                    setPaymentMethod('mercadopago');
                  }}
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
                  onClick={() => {
                    sounds.playClickSound();
                    setPaymentMethod('crypto');
                  }}
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

              {/* METHOD 2: SPEI */}
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

              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pago protegido y garantizado por 2 años con folio oficial digital.</span>
              </div>

            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION & 3D IMMEDIATE ACTION */}
          {step === 3 && (
            <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] text-center space-y-5 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 font-bold block">
                  ¡Transacción Confirmada con Éxito!
                </span>
                <h3 className="text-2xl font-heading font-bold text-neutral-900">
                  {brandName || 'Tu Marca'} ya está en el Porsche 911 (992)
                </h3>
                <p className="text-xs text-neutral-500 max-w-md mx-auto font-sans">
                  Tu sticker con tus dimensiones exactas ha sido grabado permanentemente en el modelo 3D y vinculado a la carrocería física para los 2 años de gira.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] max-w-sm mx-auto text-xs font-mono space-y-2 text-left shadow-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Zona:</span>
                  <span className="text-neutral-900 font-bold">{currentZone.name}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-500">Medidas:</span>
                  <span className="text-neutral-900">{widthCm}×{heightCm} cm ({areaCm2} cm²)</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-500">Inversión Cobrada:</span>
                  <span className="text-emerald-600 font-bold">${totalPriceMxn.toLocaleString()} MXN</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-500">Vigencia:</span>
                  <span className="text-neutral-900 font-semibold">2 Años ({CONTRACT_DAYS} Días)</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClickSound();
                    setIsBuyModalOpen(false);
                    if (newlyCreatedSponsor) {
                      focusSponsor(newlyCreatedSponsor.id);
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition cursor-pointer shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver mi Sticker en el Porsche 3D</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClickSound();
                    if (newlyCreatedSponsor) {
                      setCertificateSponsor(newlyCreatedSponsor);
                    }
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-900 border border-black/10 text-xs font-semibold transition cursor-pointer shadow-sm"
                >
                  <Award className="w-3.5 h-3.5 text-neutral-800" />
                  <span>Ver Certificado Oficial</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 sm:p-6 border-t border-black/[0.06] flex items-center justify-between bg-white">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => {
                sounds.playClickSound();
                setStep(1);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Modificar Tamaño</span>
            </button>
          ) : (
            <div />
          )}

          {step === 1 ? (
            <button
              type="button"
              onClick={() => {
                sounds.playClickSound();
                setStep(2);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition cursor-pointer shadow-sm"
            >
              <span>Pagar por mi Diseño (${totalPriceMxn.toLocaleString()} MXN)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : step === 2 ? (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleExecutePayment}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition cursor-pointer shadow-md disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Procesando Pago Seguro...</span>
              ) : (
                <span>Confirmar Pago (${totalPriceMxn.toLocaleString()} MXN)</span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                sounds.playClickSound();
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
