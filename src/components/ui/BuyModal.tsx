import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useSponsors } from '../../context/SponsorContext';
import type { SponsorTier } from '../../types/sponsor';
import { CONTRACT_DAYS, CONTRACT_YEARS } from '../../utils/sampleData';
import { sounds } from '../../utils/soundEffects';
import { Studio3DCanvas } from '../3d/Studio3DCanvas';
import { 
  X, 
  Upload, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  CreditCard, 
  Building2, 
  Coins, 
  CheckCircle2, 
  Eye, 
  Award, 
  Lock, 
  Unlock,
  QrCode
} from 'lucide-react';

export const BuyModal: React.FC = () => {
  const {
    isBuyModalOpen,
    setIsBuyModalOpen,
    draftSponsor,
    setDraftSponsor,
    addSponsor,
    focusSponsor,
    setCertificateSponsor,
    sponsors,
  } = useSponsors();

  // Wizard step: 1 = Live 3D Placement & Logo Design, 2 = Payment Gateway, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Logo & dimensions state
  const [selectedTier, setSelectedTier] = useState<SponsorTier>(draftSponsor?.tier || 'hood_central');
  const [widthCm, setWidthCm] = useState<number>(draftSponsor?.widthCm || 40);
  const [heightCm, setHeightCm] = useState<number>(draftSponsor?.heightCm || 25);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(40 / 25);
  
  const [accountName, setAccountName] = useState<string>(draftSponsor?.sponsorName || draftSponsor?.brandName || '');
  const [slogan, setSlogan] = useState<string>(draftSponsor?.slogan || '');
  const targetUrl = draftSponsor?.targetUrl || 'https://buymeaporsche.com';
  const email = draftSponsor?.email || 'contacto@sponsor.com';
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>(draftSponsor?.logoUrl || '');
  const [cameraViewTrigger, setCameraViewTrigger] = useState<string>('hood');

  // 3D positioning state
  const [currentPosition3D, setCurrentPosition3D] = useState<[number, number, number]>(
    draftSponsor?.position3D || [0, 0.96, 1.2]
  );
  const [currentRotation3D, setCurrentRotation3D] = useState<[number, number, number]>(
    draftSponsor?.rotation3D || [-1.25, 0, 0]
  );
  const [currentZoneName, setCurrentZoneName] = useState<string>(draftSponsor?.zoneName || 'Cofre Central Frontal');
  const [pricePerCm2, setPricePerCm2] = useState<number>(20);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'spei' | 'mercadopago' | 'crypto'>('card');
  const [cardNumber, setCardNumber] = useState<string>('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvc, setCardCvc] = useState<string>('123');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [newlyCreatedSponsor, setNewlyCreatedSponsor] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const areaCm2 = widthCm * heightCm;
  const totalPriceMxn = areaCm2 * pricePerCm2;
  const dailyCostMxn = totalPriceMxn / CONTRACT_DAYS;

  // Sync Draft with 3D in Real-Time continuously
  useEffect(() => {
    if (!isBuyModalOpen) return;

    setDraftSponsor({
      brandName: accountName || 'TU CUENTA',
      sponsorName: accountName || '',
      slogan: slogan || 'Patrocinador Oficial Porsche 911',
      targetUrl: targetUrl || 'buymeaporsche.com',
      logoUrl: logoPreviewUrl,
      tier: selectedTier,
      widthCm,
      heightCm,
      areaCm2,
      pricePerCm2,
      totalPriceMxn,
      zoneName: currentZoneName,
      position3D: currentPosition3D,
      rotation3D: currentRotation3D,
      scale3D: [widthCm / 28, heightCm / 28, 1],
      stickerBgColor: 'transparent',
      stickerBorderColor: 'transparent',
      logoScale: 1,
      email,
    });
  }, [
    isBuyModalOpen,
    widthCm,
    heightCm,
    selectedTier,
    accountName,
    slogan,
    targetUrl,
    logoPreviewUrl,
    email,
    currentPosition3D,
    currentRotation3D,
    currentZoneName,
    pricePerCm2,
    areaCm2,
    totalPriceMxn,
    setDraftSponsor,
  ]);

  if (!isBuyModalOpen) return null;

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sounds.playClickSound();
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setLogoPreviewUrl(url);

        const img = new Image();
        img.onload = () => {
          const ratio = (img.width || 400) / (img.height || 400);
          setAspectRatio(ratio);
          if (lockAspectRatio) {
            const newH = Math.max(5, Math.min(60, Math.round(widthCm / ratio)));
            setHeightCm(newH);
          }
        };
        img.src = url;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateFrom3D = (update: {
    position3D: [number, number, number];
    rotation3D: [number, number, number];
    tier: SponsorTier;
    zoneName: string;
    pricePerCm2: number;
  }) => {
    setCurrentPosition3D(update.position3D);
    setCurrentRotation3D(update.rotation3D);
    setSelectedTier(update.tier);
    setCurrentZoneName(update.zoneName);
    setPricePerCm2(update.pricePerCm2);
  };

  const handleExecutePayment = () => {
    sounds.playClickSound();
    setIsProcessing(true);

    setTimeout(() => {
      const name = accountName.trim() || 'Patrocinador Porsche 911';
      const created = addSponsor({
        brandName: name,
        sponsorName: name,
        slogan: slogan.trim() || 'Patrocinador Oficial Porsche 911 (992)',
        logoUrl: logoPreviewUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
        targetUrl: targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`,
        email: email || 'contacto@sponsor.com',
        category: 'Tecnología & AI',
        tier: selectedTier,
        widthCm,
        heightCm,
        areaCm2,
        pricePerCm2,
        totalPriceMxn,
        position3D: currentPosition3D,
        rotation3D: currentRotation3D,
        scale3D: [widthCm / 28, heightCm / 28, 1],
        zoneName: currentZoneName,
        stickerBgColor: 'transparent',
        stickerBorderColor: 'transparent',
        logoScale: 1,
        contractYears: CONTRACT_YEARS,
        includesPhysicalVinylWrap: true,
        includesTrackDaysExhibition: true,
        includesSocialMediaTags: true,
        vipTrackPassesCount: selectedTier === 'vip_wing' ? 4 : selectedTier === 'hood_central' ? 3 : 2,
      });

      setNewlyCreatedSponsor(created);
      setIsProcessing(false);
      setStep(3);

      sounds.playSuccessChime();
      setTimeout(() => sounds.playEngineRev(), 300);

      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#d5001c', '#ffffff', '#d4af37', '#00ff88'],
        });
      } catch (err) {
        console.error(err);
      }
    }, 1200);
  };

  const handleClose = () => {
    sounds.playClickSound();
    setIsBuyModalOpen(false);
    setStep(1);
    setDraftSponsor(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
      
      {/* Top Studio Bar */}
      <header className="h-14 border-b border-white/10 bg-neutral-950 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white text-xs">
            🏎️
          </div>
          <div>
            <h1 className="text-white text-xs sm:text-sm font-heading font-bold tracking-wide">
              Estudio 3D de Colocación en Vivo · Porsche 911
            </h1>
            <span className="text-[10px] text-neutral-400 font-mono hidden sm:inline">
              Arrastra tu logo sobre la carrocería en 3D para posicionarlo en tiempo real
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-neutral-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <span>Zona: <strong className="text-sky-400">{currentZoneName}</strong></span>
            <span>·</span>
            <span>Tarifa: <strong className="text-emerald-400">${pricePerCm2} MXN/cm²</strong></span>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Cerrar Estudio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* LEFT PANEL: Live Interactive 3D Porsche Viewport (58% Desktop) */}
        <div className="w-full lg:w-[58%] h-[44vh] lg:h-full border-b lg:border-b-0 lg:border-r border-white/10 relative bg-neutral-950">
          <Studio3DCanvas
            draftSponsor={{
              id: 'draft',
              brandName: accountName || 'TU CUENTA',
              sponsorName: accountName || '',
              slogan,
              logoUrl: logoPreviewUrl,
              position3D: currentPosition3D,
              rotation3D: currentRotation3D,
              widthCm,
              heightCm,
              scale3D: [widthCm / 28, heightCm / 28, 1],
              zoneName: currentZoneName,
              tier: selectedTier,
              pricePerCm2,
              stickerBgColor: 'transparent',
              stickerBorderColor: 'transparent',
              logoScale: 1,
            }}
            onUpdateDraftPosition={handleUpdateFrom3D}
            onUpdateDimensions={(w, h) => {
              setWidthCm(w);
              setHeightCm(h);
            }}
            existingSponsors={sponsors}
            cameraViewTrigger={cameraViewTrigger}
          />
        </div>

        {/* RIGHT PANEL: Live Controls & Real-Time Pricing (42% Desktop) */}
        <div className="w-full lg:w-[42%] h-[56vh] lg:h-full bg-white text-neutral-900 flex flex-col overflow-y-auto">
          
          {/* STEP 1: Logo, Dimensions & Auto-Pricing */}
          {step === 1 && (
            <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                
                {/* Header Instructions */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-1">
                    Paso 1 de 2 · Personalización & Medidas
                  </span>
                  <h2 className="text-xl sm:text-2xl font-heading font-bold text-neutral-900">
                    Sube tu Logo & Ajusta el Tamaño
                  </h2>
                  <p className="text-xs text-neutral-500 font-sans mt-0.5">
                    Mueve o haz clic sobre el Porsche 3D (a la izquierda) para posicionar tu logo exactamente donde quieras.
                  </p>
                </div>

                {/* Logo Uploader Dropzone */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-neutral-600 block font-medium">Logotipo o Imagen:</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-300 hover:border-neutral-900 rounded-2xl p-4 transition text-center cursor-pointer bg-[#fafafa] flex items-center justify-center gap-4"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml, image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />

                    {logoPreviewUrl ? (
                      <div className="flex items-center gap-4 text-left w-full">
                        <div className="w-14 h-14 rounded-xl bg-white border border-black/10 p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                          <img src={logoPreviewUrl} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-neutral-900 block truncate">Logo Cargado</span>
                          <span className="text-[11px] text-neutral-500 font-sans">Haz clic para cambiar imagen</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 flex flex-col items-center justify-center text-neutral-600">
                        <Upload className="w-6 h-6 text-neutral-400 mb-1.5" />
                        <span className="text-xs font-medium text-neutral-900">Subir logotipo o diseño (PNG, JPG, SVG)</span>
                        <span className="text-[10px] text-neutral-400 font-sans mt-0.5">Fondo transparente recomendado</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dimension Sliders (Width & Height) */}
                <div className="bg-[#fafafa] p-4 rounded-2xl border border-black/[0.06] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-neutral-700 font-medium">Dimensiones en Centímetros:</span>
                    <button
                      type="button"
                      onClick={() => setLockAspectRatio(!lockAspectRatio)}
                      className={`text-[10px] font-mono px-2 py-1 rounded-lg border flex items-center gap-1 transition cursor-pointer ${
                        lockAspectRatio ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-600 border-black/10'
                      }`}
                    >
                      {lockAspectRatio ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      <span>{lockAspectRatio ? 'Proporción Fija' : 'Libre'}</span>
                    </button>
                  </div>

                  {/* Width Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-neutral-500">Ancho:</span>
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

                  {/* Height Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-neutral-500">Alto:</span>
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

                {/* Zone Quick Positioner Buttons (Directly moves camera & snaps logo) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-neutral-600 block font-medium">
                      Zona en el Porsche (o haz clic en el 3D):
                    </label>
                    <span className="text-[10px] font-mono text-sky-600 font-semibold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                      ${pricePerCm2} MXN/cm²
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClickSound();
                        setCameraViewTrigger('hood');
                        setCurrentPosition3D([0, 0.96, 1.2]);
                        setCurrentRotation3D([-1.25, 0, 0]);
                        setSelectedTier('hood_central');
                        setCurrentZoneName('Cofre Central Frontal');
                        setPricePerCm2(20);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-mono text-left transition cursor-pointer ${
                        selectedTier === 'hood_central' ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' : 'bg-[#fafafa] text-neutral-700 border-black/[0.08] hover:border-black/20'
                      }`}
                    >
                      <div className="font-semibold text-[11px]">🔰 Cofre</div>
                      <div className={`text-[10px] ${selectedTier === 'hood_central' ? 'text-neutral-400' : 'text-neutral-500'}`}>$20 MXN/cm²</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClickSound();
                        setCameraViewTrigger('wing');
                        setCurrentPosition3D([0, 0.98, -1.35]);
                        setCurrentRotation3D([0.15, 0, 0]);
                        setSelectedTier('vip_wing');
                        setCurrentZoneName('Alerón Trasero VIP');
                        setPricePerCm2(25);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-mono text-left transition cursor-pointer ${
                        selectedTier === 'vip_wing' ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' : 'bg-[#fafafa] text-neutral-700 border-black/[0.08] hover:border-black/20'
                      }`}
                    >
                      <div className="font-semibold text-[11px]">🏁 Alerón VIP</div>
                      <div className={`text-[10px] ${selectedTier === 'vip_wing' ? 'text-neutral-400' : 'text-neutral-500'}`}>$25 MXN/cm²</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClickSound();
                        setCameraViewTrigger('leftDoor');
                        setCurrentPosition3D([-1.02, 0.58, 0.15]);
                        setCurrentRotation3D([0, -Math.PI / 2, 0]);
                        setSelectedTier('premium_door');
                        setCurrentZoneName('Puerta Izquierda');
                        setPricePerCm2(15);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-mono text-left transition cursor-pointer ${
                        selectedTier === 'premium_door' && currentPosition3D[0] < 0 ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' : 'bg-[#fafafa] text-neutral-700 border-black/[0.08] hover:border-black/20'
                      }`}
                    >
                      <div className="font-semibold text-[11px]">🚪 Puerta Izq</div>
                      <div className={`text-[10px] ${selectedTier === 'premium_door' && currentPosition3D[0] < 0 ? 'text-neutral-400' : 'text-neutral-500'}`}>$15 MXN/cm²</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClickSound();
                        setCameraViewTrigger('rightDoor');
                        setCurrentPosition3D([1.02, 0.58, 0.15]);
                        setCurrentRotation3D([0, Math.PI / 2, 0]);
                        setSelectedTier('premium_door');
                        setCurrentZoneName('Puerta Derecha');
                        setPricePerCm2(15);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-mono text-left transition cursor-pointer ${
                        selectedTier === 'premium_door' && currentPosition3D[0] > 0 ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' : 'bg-[#fafafa] text-neutral-700 border-black/[0.08] hover:border-black/20'
                      }`}
                    >
                      <div className="font-semibold text-[11px]">🚪 Puerta Der</div>
                      <div className={`text-[10px] ${selectedTier === 'premium_door' && currentPosition3D[0] > 0 ? 'text-neutral-400' : 'text-neutral-500'}`}>$15 MXN/cm²</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClickSound();
                        setCameraViewTrigger('roof');
                        setCurrentPosition3D([0, 1.34, -0.1]);
                        setCurrentRotation3D([-Math.PI / 2, 0, 0]);
                        setSelectedTier('body_standard');
                        setCurrentZoneName('Techo Panorámico');
                        setPricePerCm2(15);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-mono text-left transition cursor-pointer ${
                        currentZoneName.includes('Techo') ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' : 'bg-[#fafafa] text-neutral-700 border-black/[0.08] hover:border-black/20'
                      }`}
                    >
                      <div className="font-semibold text-[11px]">🔲 Techo</div>
                      <div className={`text-[10px] ${currentZoneName.includes('Techo') ? 'text-neutral-400' : 'text-neutral-500'}`}>$15 MXN/cm²</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClickSound();
                        setCameraViewTrigger('rear');
                        setCurrentPosition3D([0, 0.45, -1.9]);
                        setCurrentRotation3D([0, Math.PI, 0]);
                        setSelectedTier('body_standard');
                        setCurrentZoneName('Defensa / Trasera');
                        setPricePerCm2(10);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-mono text-left transition cursor-pointer ${
                        currentZoneName.includes('Trasera') ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' : 'bg-[#fafafa] text-neutral-700 border-black/[0.08] hover:border-black/20'
                      }`}
                    >
                      <div className="font-semibold text-[11px]">🏎️ Trasera</div>
                      <div className={`text-[10px] ${currentZoneName.includes('Trasera') ? 'text-neutral-400' : 'text-neutral-500'}`}>$10 MXN/cm²</div>
                    </button>
                  </div>
                </div>

                {/* Account Name and Slogan Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-neutral-500 block mb-1">Tu Nombre o Cuenta *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Diego Arturo"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full bg-[#fafafa] border border-black/10 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono text-neutral-500 block mb-1">Mensaje o Slogan (Opcional):</label>
                    <input
                      type="text"
                      placeholder="Ej. Patrocinador Oficial 911"
                      value={slogan}
                      onChange={(e) => setSlogan(e.target.value)}
                      className="w-full bg-[#fafafa] border border-black/10 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>

              </div>

              {/* Live Price Summary Box & Continue Button */}
              <div className="pt-6 border-t border-black/[0.08] space-y-4">
                <div className="bg-neutral-950 text-white p-4 rounded-2xl space-y-2 font-mono text-xs shadow-md">
                  <div className="flex justify-between text-neutral-400">
                    <span>Zona Ubicada:</span>
                    <span className="text-sky-400 font-semibold">{currentZoneName}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Superficie:</span>
                    <span>{widthCm} x {heightCm} cm = <strong className="text-white">{areaCm2} cm²</strong></span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Tarifa de Zona:</span>
                    <span className="text-white">${pricePerCm2} MXN / cm²</span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between items-end">
                    <div>
                      <span className="text-[10px] text-neutral-400 block">Total a Pagar (2 Años):</span>
                      <strong className="text-emerald-400 text-xl font-bold">
                        ${totalPriceMxn.toLocaleString()} MXN
                      </strong>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-normal">
                      ${dailyCostMxn.toFixed(2)}/día
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClickSound();
                    setStep(2);
                  }}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3.5 rounded-2xl font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Proceder al Pago (${totalPriceMxn.toLocaleString()} MXN)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Payment Gateway Checkout */}
          {step === 2 && (
            <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-1">
                      Paso 2 de 2 · Pasarela de Pago
                    </span>
                    <h2 className="text-xl sm:text-2xl font-heading font-bold text-neutral-900">
                      Finalizar Patrocinio
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-mono text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver a Editar</span>
                  </button>
                </div>

                {/* Order Summary Badge */}
                <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.06] text-xs font-mono space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Patrocinador:</span>
                    <strong className="text-neutral-900">{accountName || 'Diego Arturo'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Zona en Porsche 911:</span>
                    <span className="text-neutral-900 font-semibold">{currentZoneName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Medidas:</span>
                    <span className="text-neutral-900">{widthCm} x {heightCm} cm ({areaCm2} cm²)</span>
                  </div>
                  <div className="pt-2 border-t border-black/[0.06] flex justify-between items-center">
                    <span className="font-bold text-neutral-900">Monto Total:</span>
                    <strong className="text-emerald-600 text-base font-bold">${totalPriceMxn.toLocaleString()} MXN</strong>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-neutral-500 block">Elige tu método de pago seguro:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-2xl border text-xs font-mono flex flex-col items-center gap-1.5 transition cursor-pointer ${
                        paymentMethod === 'card' ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm' : 'bg-[#fafafa] text-neutral-700 border-black/10'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Tarjeta</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('spei')}
                      className={`p-3 rounded-2xl border text-xs font-mono flex flex-col items-center gap-1.5 transition cursor-pointer ${
                        paymentMethod === 'spei' ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm' : 'bg-[#fafafa] text-neutral-700 border-black/10'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>SPEI CLABE</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mercadopago')}
                      className={`p-3 rounded-2xl border text-xs font-mono flex flex-col items-center gap-1.5 transition cursor-pointer ${
                        paymentMethod === 'mercadopago' ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm' : 'bg-[#fafafa] text-neutral-700 border-black/10'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>MercadoPago</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('crypto')}
                      className={`p-3 rounded-2xl border text-xs font-mono flex flex-col items-center gap-1.5 transition cursor-pointer ${
                        paymentMethod === 'crypto' ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm' : 'bg-[#fafafa] text-neutral-700 border-black/10'
                      }`}
                    >
                      <Coins className="w-4 h-4" />
                      <span>Cripto USDT</span>
                    </button>
                  </div>
                </div>

                {/* Form Fields for Card Payment */}
                {paymentMethod === 'card' && (
                  <div className="space-y-3 p-4 bg-[#fafafa] rounded-2xl border border-black/[0.06]">
                    <div>
                      <label className="text-[11px] font-mono text-neutral-500 block mb-1">Número de Tarjeta</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-white border border-black/10 rounded-xl px-3.5 py-2 text-xs font-mono text-neutral-900 focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-mono text-neutral-500 block mb-1">Vencimiento</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-white border border-black/10 rounded-xl px-3.5 py-2 text-xs font-mono text-neutral-900 focus:outline-none focus:border-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono text-neutral-500 block mb-1">CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full bg-white border border-black/10 rounded-xl px-3.5 py-2 text-xs font-mono text-neutral-900 focus:outline-none focus:border-neutral-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SPEI Instructions */}
                {paymentMethod === 'spei' && (
                  <div className="p-4 bg-neutral-900 text-white rounded-2xl space-y-2 text-xs font-mono">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest block">Transferencia Interbancaria Inmediata:</span>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Banco:</span>
                      <strong className="text-white">STP / BBVA México</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">CLABE:</span>
                      <strong className="text-emerald-400 font-mono">646180123456789012</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Concepto:</span>
                      <strong className="text-white">PORSCHE 911-{accountName.substring(0, 8).toUpperCase() || 'SPONSOR'}</strong>
                    </div>
                  </div>
                )}

                {/* Crypto Instructions */}
                {paymentMethod === 'crypto' && (
                  <div className="p-4 bg-neutral-900 text-white rounded-2xl space-y-2 text-xs font-mono">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest block">Pago en Criptomonedas:</span>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">USDT / USDC (TRC20 / ERC20):</span>
                      <strong className="text-emerald-400 font-mono text-[10px] truncate max-w-[200px]">0x71C...4e99</strong>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-sans">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Transacción encriptada con certificado de patrocinio digital instantáneo.</span>
                </div>

              </div>

              {/* Submit Payment Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecutePayment}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-2xl font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Procesando pago y rotulando 3D...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pagar & Rotular Ahora (${totalPriceMxn.toLocaleString()} MXN)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === 3 && (
            <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between text-center my-auto">
              <div className="space-y-4 my-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-2xl font-heading font-bold text-neutral-900">
                    ¡Felicidades, {newlyCreatedSponsor?.brandName || 'Patrocinador'}!
                  </h2>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto font-sans leading-relaxed">
                    Tu diseño ya está rotulado en vivo en el <strong>Porsche 911 (992)</strong> y tu posición ha sido registrada en el Ranking Oficial por 2 años.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.06] max-w-sm mx-auto text-xs font-mono space-y-1 text-left">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Zona:</span>
                    <strong className="text-neutral-900">{newlyCreatedSponsor?.zoneName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Superficie:</span>
                    <span className="text-emerald-600 font-bold">{newlyCreatedSponsor?.areaCm2} cm²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Vigencia:</span>
                    <span>2 Años (730 Días)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (newlyCreatedSponsor) {
                      setCertificateSponsor(newlyCreatedSponsor);
                    }
                  }}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3 rounded-2xl font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Ver Certificado de Autenticidad</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (newlyCreatedSponsor) {
                      focusSponsor(newlyCreatedSponsor.id);
                    }
                    handleClose();
                  }}
                  className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 py-3 rounded-2xl font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Volver al Showroom 3D</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
