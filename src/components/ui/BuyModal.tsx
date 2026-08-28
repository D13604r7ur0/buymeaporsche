import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useSponsors } from '../../context/SponsorContext';
import type { SponsorTier } from '../../types/sponsor';
import { CONTRACT_DAYS, CONTRACT_YEARS } from '../../utils/sampleData';
import { sounds } from '../../utils/soundEffects';
import { Studio3DCanvas } from '../3d/Studio3DCanvas';
import { Studio2DView } from '../2d/Studio2DView';
import { 
  X, 
  Upload, 
  CheckCircle2, 
  Eye, 
  Lock, 
  Unlock,
  Move,
  RotateCw,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  FlipHorizontal,
  FlipVertical,
  Crosshair,
  Sliders,
  Maximize2,
  Box,
  Layers
} from 'lucide-react';

const CM2_PRESETS = [
  { label: 'Mini Sticker', area: 50, desc: 'Tarjeta' },
  { label: 'Badge', area: 150, desc: 'Smartphone' },
  { label: 'Medio', area: 400, desc: 'Tablet' },
  { label: 'Grande', area: 800, desc: 'Laptop' },
  { label: 'Mega Logo', area: 1500, desc: 'Puerta' },
  { label: 'VIP Sponsor', area: 3000, desc: 'Cofre / Trasera' },
];

export const BuyModal: React.FC = () => {
  const {
    isBuyModalOpen,
    setIsBuyModalOpen,
    draftSponsor,
    setDraftSponsor,
    addSponsor,
    focusSponsor,
    sponsors,
  } = useSponsors();

  // Mode View: 3D Interactive Car vs 2D Blueprint Despiece
  const [viewDimension, setViewDimension] = useState<'3d' | '2d'>('3d');

  // Logo & dimensions state (Selling by cm and cm²)
  const [selectedTier, setSelectedTier] = useState<SponsorTier>(draftSponsor?.tier || 'hood_central');
  const [widthCm, setWidthCm] = useState<number>(draftSponsor?.widthCm || 35);
  const [heightCm, setHeightCm] = useState<number>(draftSponsor?.heightCm || 20);
  const [targetAreaCm2, setTargetAreaCm2] = useState<number>(35 * 20);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(35 / 20);
  const [rotationAngle, setRotationAngle] = useState<number>(0);

  // Advanced Livery Tools state
  const [flipX, setFlipX] = useState<boolean>(false);
  const [flipY, setFlipY] = useState<boolean>(false);
  const filterStyle = 'original';
  const [opacity, setOpacity] = useState<number>(1.0);
  
  const [accountName, setAccountName] = useState<string>(draftSponsor?.sponsorName || draftSponsor?.brandName || '');
  const [slogan, setSlogan] = useState<string>(draftSponsor?.slogan || '');
  const targetUrl = draftSponsor?.targetUrl || 'https://buymeaporsche.com';
  const email = draftSponsor?.email || 'contacto@sponsor.com';
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>(draftSponsor?.logoUrl || '');
  const [cameraViewTrigger, setCameraViewTrigger] = useState<string>('hood');
  const [interactMode, setInteractMode] = useState<'moveLogo' | 'orbitCamera'>('moveLogo');

  // 3D positioning state
  const [currentPosition3D, setCurrentPosition3D] = useState<[number, number, number]>(
    draftSponsor?.position3D || [0, 0.96, 1.2]
  );
  const [currentRotation3D, setCurrentRotation3D] = useState<[number, number, number]>(
    draftSponsor?.rotation3D || [-1.25, 0, 0]
  );
  const [currentZoneName, setCurrentZoneName] = useState<string>(draftSponsor?.zoneName || 'Cofre Central Frontal');  const [pricePerCm2, setPricePerCm2] = useState<number>(35);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const areaCm2 = widthCm * heightCm;
  const totalPriceMxn = areaCm2 * pricePerCm2;
  const dailyCostMxn = totalPriceMxn / CONTRACT_DAYS;

  // Sync targetAreaCm2 with widthCm and heightCm
  useEffect(() => {
    setTargetAreaCm2(widthCm * heightCm);
  }, [widthCm, heightCm]);

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
      rotationAngle,
      flipX,
      flipY,
      filterStyle,
      opacity,
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
    rotationAngle,
    flipX,
    flipY,
    filterStyle,
    opacity,
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

  // Change dimensions by setting explicit area in cm²
  const handleSetAreaCm2 = (newArea: number) => {
    const safeArea = Math.max(25, Math.min(6000, newArea));
    setTargetAreaCm2(safeArea);
    const ratio = aspectRatio > 0 ? aspectRatio : 1.5;
    const newW = Math.max(8, Math.min(120, Math.round(Math.sqrt(safeArea * ratio))));
    const newH = Math.max(5, Math.min(60, Math.round(newW / ratio)));
    setWidthCm(newW);
    setHeightCm(newH);
  };

  // Micro Nudge Position (D-Pad Arrows)
  const handleNudge = (dir: 'up' | 'down' | 'left' | 'right') => {
    sounds.playClickSound();
    const stepSize = 0.04;
    setCurrentPosition3D((prev) => {
      const next: [number, number, number] = [...prev];
      if (dir === 'up') next[1] += stepSize;
      if (dir === 'down') next[1] -= stepSize;
      if (dir === 'left') {
        if (Math.abs(prev[0]) > 0.5) next[2] += stepSize;
        else next[0] -= stepSize;
      }
      if (dir === 'right') {
        if (Math.abs(prev[0]) > 0.5) next[2] += stepSize;
        else next[0] += stepSize;
      }
      return next;
    });
  };

  // Mirror to Opposite Door
  const handleMirrorOppositeDoor = () => {
    sounds.playClickSound();
    setCurrentPosition3D((prev) => [-prev[0], prev[1], prev[2]]);
    setCurrentRotation3D((prev) => [prev[0], -prev[1], prev[2]]);
    setCameraViewTrigger(currentPosition3D[0] > 0 ? 'leftDoor' : 'rightDoor');
    setCurrentZoneName(currentPosition3D[0] > 0 ? 'Puerta Izquierda' : 'Puerta Derecha');
  };

  // Center in Current Zone
  const handleCenterInZone = () => {
    sounds.playClickSound();
    if (selectedTier === 'rear_decklid' || selectedTier === 'vip_wing') {
      setCurrentPosition3D([0, 0.98, -1.35]);
      setCurrentRotation3D([0.15, 0, 0]);
    } else if (selectedTier === 'hood_central') {
      setCurrentPosition3D([0, 0.96, 1.2]);
      setCurrentRotation3D([-1.25, 0, 0]);
    } else if (selectedTier === 'premium_door') {
      const isRight = currentPosition3D[0] >= 0;
      setCurrentPosition3D([isRight ? 1.02 : -1.02, 0.58, 0.15]);
      setCurrentRotation3D([0, isRight ? Math.PI / 2 : -Math.PI / 2, 0]);
    } else if (currentZoneName.includes('Techo')) {
      setCurrentPosition3D([0, 1.34, -0.1]);
      setCurrentRotation3D([-Math.PI / 2, 0, 0]);
    } else {
      setCurrentPosition3D([0, 0.45, -1.9]);
      setCurrentRotation3D([0, Math.PI, 0]);
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

  // Direct Save & Test
  const handleDirectSave = () => {
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
        rotationAngle,
        flipX,
        flipY,
        filterStyle,
        opacity,
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
        vipTrackPassesCount: selectedTier === 'rear_decklid' || selectedTier === 'vip_wing' ? 4 : selectedTier === 'hood_central' ? 3 : 2,
      });

      setIsProcessing(false);
      setIsBuyModalOpen(false);
      setDraftSponsor(null);

      sounds.playSuccessChime();
      setTimeout(() => sounds.playEngineRev(), 300);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#d5001c', '#ffffff', '#d4af37', '#00e5ff'],
        });
      } catch (err) {
        console.error(err);
      }

      setTimeout(() => {
        focusSponsor(created.id);
      }, 200);
    }, 400);
  };

  const handleClose = () => {
    sounds.playClickSound();
    setIsBuyModalOpen(false);
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
              Estudio 3D & 2D Blueprint · Venta por cm²
            </h1>
            <span className="text-[10px] text-neutral-400 font-mono hidden sm:inline">
              Diseña en 3D interactivo o en el Blueprint 2D desplegado con 100% de precisión
            </span>
          </div>
        </div>

        {/* View Mode Switcher: 3D Studio vs 2D Blueprint */}
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-white/15 p-1 rounded-xl flex items-center gap-1 shadow-md">
            <button
              type="button"
              onClick={() => setViewDimension('3d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
                viewDimension === '3d'
                  ? 'bg-white text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Vista 3D</span>
            </button>

            <button
              type="button"
              onClick={() => setViewDimension('2d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
                viewDimension === '2d'
                  ? 'bg-sky-500 text-white font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Vista 2D (Blueprint)</span>
            </button>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer ml-2"
            title="Cerrar Estudio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* LEFT PANEL: 3D Canvas OR 2D Blueprint View (58% Desktop) */}
        <div className="w-full lg:w-[58%] h-[44vh] lg:h-full border-b lg:border-b-0 lg:border-r border-white/10 relative bg-neutral-950">
          {viewDimension === '3d' ? (
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
                rotationAngle,
                flipX,
                flipY,
                filterStyle,
                opacity,
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
              rotationAngle={rotationAngle}
              onUpdateRotationAngle={setRotationAngle}
              existingSponsors={sponsors}
              cameraViewTrigger={cameraViewTrigger}
              interactMode={interactMode}
              onToggleInteractMode={setInteractMode}
            />
          ) : (
            <Studio2DView
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
                zoneName: currentZoneName,
                tier: selectedTier,
                pricePerCm2,
              }}
              onUpdateDraftPosition={handleUpdateFrom3D}
              widthCm={widthCm}
              heightCm={heightCm}
              rotationAngle={rotationAngle}
              flipX={flipX}
              flipY={flipY}
              filterStyle={filterStyle}
              opacity={opacity}
            />
          )}
        </div>

        {/* RIGHT PANEL: Live Controls & Real-Time Pricing (42% Desktop) */}
        <div className="w-full lg:w-[42%] h-[56vh] lg:h-full bg-white text-neutral-900 flex flex-col overflow-y-auto">
          
          <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Header Instructions & 3D/2D View Mode Selector */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-sky-600 font-semibold block mb-1">
                  Herramientas de Vinilado & Venta por cm²
                </span>
                <h2 className="text-xl sm:text-2xl font-heading font-bold text-neutral-900">
                  Personalización Completa del Logo
                </h2>
                <p className="text-xs text-neutral-500 font-sans mt-0.5 mb-3">
                  Cambia entre la vista 3D del auto y el Blueprint 2D plano para colocar tu diseño con precisión.
                </p>

                {/* View Dimension & 3D Mode Selector in Sidebar */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-2xl border border-black/10">
                    <button
                      type="button"
                      onClick={() => setViewDimension('3d')}
                      className={`py-2 px-3 rounded-xl text-xs font-mono transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        viewDimension === '3d'
                          ? 'bg-neutral-900 text-white font-bold shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span>Estudio 3D</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewDimension('2d')}
                      className={`py-2 px-3 rounded-xl text-xs font-mono transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        viewDimension === '2d'
                          ? 'bg-sky-600 text-white font-bold shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Blueprint 2D</span>
                    </button>
                  </div>

                  {viewDimension === '3d' && (
                    <button
                      type="button"
                      onClick={() => setInteractMode(interactMode === 'moveLogo' ? 'orbitCamera' : 'moveLogo')}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-mono transition cursor-pointer flex items-center justify-center gap-2 border shadow-xs ${
                        interactMode === 'moveLogo'
                          ? 'bg-sky-50 text-sky-700 border-sky-300 font-bold hover:bg-sky-100'
                          : 'bg-amber-50 text-amber-800 border-amber-300 font-bold hover:bg-amber-100'
                      }`}
                    >
                      {interactMode === 'moveLogo' ? (
                        <>
                          <Move className="w-3.5 h-3.5 text-sky-600" />
                          <span>✋ Modo: Mover Logo · (Clic para Girar Auto)</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-amber-600" />
                          <span>👁️ Modo: Girar Auto · (Clic para Mover Logo)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
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

              {/* VENTA POR CENTÍMETRO CUADRADO (CM²) */}
              <div className="bg-[#fafafa] p-4 rounded-2xl border border-black/[0.06] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-900 font-bold">
                    <Maximize2 className="w-4 h-4 text-sky-600" />
                    <span>Venta por Centímetro Cuadrado (cm²):</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    {areaCm2} cm²
                  </span>
                </div>

                {/* Direct Area Presets in cm² */}
                <div className="grid grid-cols-3 gap-1.5">
                  {CM2_PRESETS.map((preset) => (
                    <button
                      key={preset.area}
                      type="button"
                      onClick={() => handleSetAreaCm2(preset.area)}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                        Math.abs(areaCm2 - preset.area) < 40
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                          : 'bg-white text-neutral-700 border-black/10 hover:border-black/25'
                      }`}
                    >
                      <div className="font-mono font-bold text-[11px]">{preset.area} cm²</div>
                      <div className={`text-[9px] truncate ${Math.abs(areaCm2 - preset.area) < 40 ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {preset.label}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Direct cm² Slider & Number Field */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-neutral-500">Superficie Total Personalizada:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={25}
                        max={6000}
                        value={targetAreaCm2}
                        onChange={(e) => handleSetAreaCm2(Number(e.target.value))}
                        className="w-20 bg-white border border-black/15 rounded-lg px-2 py-0.5 text-right font-mono font-bold text-neutral-900 text-xs"
                      />
                      <span className="text-neutral-500">cm²</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={25}
                    max={3500}
                    step={25}
                    value={areaCm2}
                    onChange={(e) => handleSetAreaCm2(Number(e.target.value))}
                    className="w-full accent-emerald-600 bg-neutral-200 cursor-pointer h-2 rounded-lg"
                  />
                </div>

                {/* Width & Height Sliders */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-black/[0.06]">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
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
                      className="w-full accent-neutral-900 bg-neutral-200 cursor-pointer h-1.5 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
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
                      className="w-full accent-neutral-900 bg-neutral-200 cursor-pointer h-1.5 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
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
              </div>

              {/* CAJA DE HERRAMIENTAS AVANZADAS (ALIGN, ROTATE, MIRROR, NUDGE) */}
              <div className="bg-[#fafafa] p-4 rounded-2xl border border-black/[0.06] space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-900 font-bold">
                  <Sliders className="w-4 h-4 text-sky-600" />
                  <span>Herramientas de Alineación & Ajuste:</span>
                </div>

                {/* Rotation Angle Slider (0° - 360°) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-neutral-600 flex items-center gap-1.5">
                      <RotateCw className="w-3.5 h-3.5 text-sky-600" />
                      <span>Rotación Libre:</span>
                    </span>
                    <strong className="text-neutral-900">{rotationAngle}°</strong>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={rotationAngle}
                    onChange={(e) => setRotationAngle(Number(e.target.value))}
                    className="w-full accent-sky-600 bg-neutral-200 cursor-pointer h-2 rounded-lg"
                  />

                  {/* Preset Angles */}
                  <div className="flex gap-1 pt-0.5">
                    {[0, 45, 90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => setRotationAngle(deg)}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-mono border transition cursor-pointer ${
                          rotationAngle === deg
                            ? 'bg-sky-600 text-white border-sky-600 font-bold'
                            : 'bg-white text-neutral-600 border-black/10 hover:border-black/20'
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>

                {/* Flip & Mirror & Center Tools */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/[0.06]">
                  <button
                    type="button"
                    onClick={() => setFlipX(!flipX)}
                    className={`p-2 rounded-xl border text-[11px] font-mono flex items-center justify-center gap-1 transition cursor-pointer ${
                      flipX ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-700 border-black/10'
                    }`}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>Espejo X</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFlipY(!flipY)}
                    className={`p-2 rounded-xl border text-[11px] font-mono flex items-center justify-center gap-1 transition cursor-pointer ${
                      flipY ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-700 border-black/10'
                    }`}
                  >
                    <FlipVertical className="w-3.5 h-3.5" />
                    <span>Espejo Y</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCenterInZone}
                    className="p-2 rounded-xl border bg-white hover:bg-neutral-100 text-neutral-700 border-black/10 text-[11px] font-mono flex items-center justify-center gap-1 transition cursor-pointer"
                    title="Centrar en Panel"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-sky-600" />
                    <span>Centrar</span>
                  </button>
                </div>

                {/* Mirror to Opposite Door Button */}
                <button
                  type="button"
                  onClick={handleMirrorOppositeDoor}
                  className="w-full py-2 px-3 rounded-xl border bg-white hover:bg-neutral-100 text-neutral-700 border-black/10 text-xs font-mono flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Move className="w-3.5 h-3.5 text-sky-600" />
                  <span>Espejar a la Otra Puerta (Izq ⇄ Der)</span>
                </button>

                {/* Micro Nudge D-Pad Controls */}
                <div className="space-y-1.5 pt-2 border-t border-black/[0.06]">
                  <span className="text-[11px] font-mono text-neutral-500 block">Micro-Ajuste de Posición:</span>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleNudge('left')}
                      className="p-2 rounded-xl bg-white border border-black/10 hover:bg-neutral-100 text-neutral-700 transition cursor-pointer"
                      title="Mover Izquierda"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => handleNudge('up')}
                        className="p-2 rounded-xl bg-white border border-black/10 hover:bg-neutral-100 text-neutral-700 transition cursor-pointer"
                        title="Mover Arriba"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNudge('down')}
                        className="p-2 rounded-xl bg-white border border-black/10 hover:bg-neutral-100 text-neutral-700 transition cursor-pointer"
                        title="Mover Abajo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNudge('right')}
                      className="p-2 rounded-xl bg-white border border-black/10 hover:bg-neutral-100 text-neutral-700 transition cursor-pointer"
                      title="Mover Derecha"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Opacity Slider */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-neutral-500">Opacidad del Vinil:</span>
                    <strong className="text-neutral-900">{Math.round(opacity * 100)}%</strong>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={1.0}
                    step={0.05}
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-full accent-neutral-900 bg-neutral-200 cursor-pointer h-1.5 rounded-lg"
                  />
                </div>

              </div>

              {/* Zone Quick Positioner Buttons */}
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
                      setPricePerCm2(35);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-mono text-left transition cursor-pointer ${
                      selectedTier === 'hood_central' ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' : 'bg-[#fafafa] text-neutral-700 border-black/[0.08] hover:border-black/20'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">🔰 Cofre</div>
                    <div className={`text-[10px] ${selectedTier === 'hood_central' ? 'text-neutral-400' : 'text-neutral-500'}`}>$35 MXN/cm²</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClickSound();
                      setCameraViewTrigger('wing');
                      setCurrentPosition3D([0, 0.98, -1.35]);
                      setCurrentRotation3D([0.15, 0, 0]);
                      setSelectedTier('rear_decklid');
                      setCurrentZoneName('Tapa de Motor & Fascia Trasera');
                      setPricePerCm2(40);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-mono text-left transition cursor-pointer ${
                      selectedTier === 'rear_decklid' || selectedTier === 'vip_wing' ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' : 'bg-[#fafafa] text-neutral-700 border-black/[0.08] hover:border-black/20'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">🏁 Tapa Trasera</div>
                    <div className={`text-[10px] ${selectedTier === 'rear_decklid' || selectedTier === 'vip_wing' ? 'text-neutral-400' : 'text-neutral-500'}`}>$40 MXN/cm²</div>
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
                      setPricePerCm2(25);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-mono text-left transition cursor-pointer ${
                      selectedTier === 'premium_door' && currentPosition3D[0] < 0 ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' : 'bg-[#fafafa] text-neutral-700 border-black/[0.08] hover:border-black/20'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">🚪 Puerta Izq</div>
                    <div className={`text-[10px] ${selectedTier === 'premium_door' && currentPosition3D[0] < 0 ? 'text-neutral-400' : 'text-neutral-500'}`}>$25 MXN/cm²</div>
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
                      setPricePerCm2(25);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-mono text-left transition cursor-pointer ${
                      selectedTier === 'premium_door' && currentPosition3D[0] > 0 ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' : 'bg-[#fafafa] text-neutral-700 border-black/[0.08] hover:border-black/20'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">🚪 Puerta Der</div>
                    <div className={`text-[10px] ${selectedTier === 'premium_door' && currentPosition3D[0] > 0 ? 'text-neutral-400' : 'text-neutral-500'}`}>$25 MXN/cm²</div>
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
                      setPricePerCm2(25);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-mono text-left transition cursor-pointer ${
                      currentZoneName.includes('Techo') ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' : 'bg-[#fafafa] text-neutral-700 border-black/[0.08] hover:border-black/20'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">🔲 Techo</div>
                    <div className={`text-[10px] ${currentZoneName.includes('Techo') ? 'text-neutral-400' : 'text-neutral-500'}`}>$25 MXN/cm²</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClickSound();
                      setCameraViewTrigger('rear');
                      setCurrentPosition3D([0, 0.45, -1.9]);
                      setCurrentRotation3D([0, Math.PI, 0]);
                      setSelectedTier('body_standard');
                      setCurrentZoneName('Defensa Trasera');
                      setPricePerCm2(15);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-mono text-left transition cursor-pointer ${
                      currentZoneName.includes('Defensa') ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' : 'bg-[#fafafa] text-neutral-700 border-black/[0.08] hover:border-black/20'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">🏎️ Trasera</div>
                    <div className={`text-[10px] ${currentZoneName.includes('Defensa') ? 'text-neutral-400' : 'text-neutral-500'}`}>$15 MXN/cm²</div>
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

            {/* Live Price Summary Box & Direct Confirm Button */}
            <div className="pt-6 border-t border-black/[0.08] space-y-4">
              <div className="bg-neutral-950 text-white p-4 rounded-2xl space-y-2 font-mono text-xs shadow-md">
                <div className="flex justify-between text-neutral-400">
                  <span>Zona Ubicada:</span>
                  <span className="text-sky-400 font-semibold">{currentZoneName}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Superficie Comprada:</span>
                  <span>{widthCm} x {heightCm} cm = <strong className="text-emerald-400 font-bold">{areaCm2} cm²</strong></span>
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
                disabled={isProcessing}
                onClick={handleDirectSave}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando y rotulando en el Porsche 911...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Confirmar & Guardar en el Porsche (${totalPriceMxn.toLocaleString()} MXN)</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
