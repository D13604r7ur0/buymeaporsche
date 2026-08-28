import React, { useState, useRef, useEffect } from 'react';
import type { Sponsor, SponsorTier } from '../../types/sponsor';
import { Compass, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

interface Studio2DViewProps {
  draftSponsor: Partial<Sponsor>;
  onUpdateDraftPosition: (update: {
    position3D: [number, number, number];
    rotation3D: [number, number, number];
    tier: SponsorTier;
    zoneName: string;
    pricePerCm2: number;
  }) => void;
  widthCm: number;
  heightCm: number;
  rotationAngle: number;
  flipX: boolean;
  flipY: boolean;
  filterStyle: 'original' | 'white' | 'black';
  opacity: number;
}

type BlueprintSection = 'top' | 'left' | 'right' | 'rear';

export const Studio2DView: React.FC<Studio2DViewProps> = ({
  draftSponsor,
  onUpdateDraftPosition,
  widthCm,
  heightCm,
  rotationAngle,
  flipX,
  flipY,
  filterStyle,
  opacity,
}) => {
  const [activeSection, setActiveSection] = useState<BlueprintSection>('top');
  const [zoom, setZoom] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Normalized 2D coordinates within the active section [0, 100]%
  const [logo2DPos, setLogo2DPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  // Sync 2D position based on incoming 3D position
  useEffect(() => {
    const pos = draftSponsor.position3D || [0, 0.96, 1.2];
    if (draftSponsor.tier === 'rear_decklid' || (draftSponsor.tier as any) === 'vip_wing') {
      setActiveSection('top');
      setLogo2DPos({ x: 50 + pos[0] * 35, y: 18 });
    } else if (draftSponsor.tier === 'hood_central') {
      setActiveSection('top');
      setLogo2DPos({ x: 50 + pos[0] * 35, y: 76 });
    } else if (draftSponsor.tier === 'premium_door') {
      if (pos[0] < 0) {
        setActiveSection('left');
        setLogo2DPos({ x: 50 - pos[2] * 25, y: 52 });
      } else {
        setActiveSection('right');
        setLogo2DPos({ x: 50 + pos[2] * 25, y: 52 });
      }
    } else if (draftSponsor.zoneName?.includes('Techo')) {
      setActiveSection('top');
      setLogo2DPos({ x: 50 + pos[0] * 35, y: 46 });
    } else if (draftSponsor.zoneName?.includes('Defensa')) {
      setActiveSection('rear');
      setLogo2DPos({ x: 50 + pos[0] * 35, y: 65 });
    }
  }, []);

  // Map 2D position to 3D coordinates & update parent
  const handleMap2DTo3D = (section: BlueprintSection, normX: number, normY: number) => {
    let pos3D: [number, number, number] = [0, 0.96, 1.2];
    let rot3D: [number, number, number] = [-1.25, 0, 0];
    let detectedTier: SponsorTier = 'hood_central';
    let detectedZoneName = 'Cofre Central Frontal';
    let detectedPrice = 20;

    const relX = (normX - 50) / 35; // centered relative offset

    if (section === 'top') {
      // Top view (Y: 0% is rear decklid, 100% is front hood)
      if (normY < 28) {
        // Tapa de Motor & Fascia Trasera (VIP)
        pos3D = [relX * 0.7, 0.98, -1.35];
        rot3D = [0.15, 0, 0];
        detectedTier = 'rear_decklid';
        detectedZoneName = 'Tapa de Motor & Fascia Trasera';
        detectedPrice = 25;
      } else if (normY < 60) {
        // Techo Panorámico
        pos3D = [relX * 0.5, 1.34, -0.1 + ((normY - 45) / 15) * 0.3];
        rot3D = [-Math.PI / 2, 0, 0];
        detectedTier = 'body_standard';
        detectedZoneName = 'Techo Panorámico';
        detectedPrice = 15;
      } else {
        // Cofre Central Frontal
        pos3D = [relX * 0.65, 0.96, 0.75 + ((normY - 60) / 40) * 0.5];
        rot3D = [-1.25, 0, 0];
        detectedTier = 'hood_central';
        detectedZoneName = 'Cofre Central Frontal';
        detectedPrice = 20;
      }
    } else if (section === 'left') {
      // Left Door & Fender (X: 0% front, 100% rear)
      const relZ = ((normX - 50) / 50) * 1.5;
      pos3D = [-1.02, 0.58 + ((50 - normY) / 50) * 0.3, -relZ];
      rot3D = [0, -Math.PI / 2, 0];
      detectedTier = 'premium_door';
      detectedZoneName = 'Puerta / Costado Izquierdo';
      detectedPrice = 15;
    } else if (section === 'right') {
      // Right Door & Fender (X: 0% rear, 100% front)
      const relZ = ((normX - 50) / 50) * 1.5;
      pos3D = [1.02, 0.58 + ((50 - normY) / 50) * 0.3, relZ];
      rot3D = [0, Math.PI / 2, 0];
      detectedTier = 'premium_door';
      detectedZoneName = 'Puerta / Costado Derecho';
      detectedPrice = 15;
    } else if (section === 'rear') {
      // Rear bumper
      pos3D = [relX * 0.7, 0.45 + ((50 - normY) / 50) * 0.3, -1.9];
      rot3D = [0, Math.PI, 0];
      detectedTier = 'body_standard';
      detectedZoneName = 'Defensa Trasera';
      detectedPrice = 10;
    }

    onUpdateDraftPosition({
      position3D: pos3D,
      rotation3D: rot3D,
      tier: detectedTier,
      zoneName: detectedZoneName,
      pricePerCm2: detectedPrice,
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    updatePositionFromPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    updatePositionFromPointer(e);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const updatePositionFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clampedX = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
    const clampedY = Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100));
    
    setLogo2DPos({ x: clampedX, y: clampedY });
    handleMap2DTo3D(activeSection, clampedX, clampedY);
  };

  const logoStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${logo2DPos.x}%`,
    top: `${logo2DPos.y}%`,
    transform: `translate(-50%, -50%) rotate(${rotationAngle}deg) scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})`,
    width: `${Math.max(30, widthCm * 2.2)}px`,
    height: `${Math.max(20, heightCm * 2.2)}px`,
    opacity,
    filter: filterStyle === 'white' ? 'brightness(0) invert(1)' : filterStyle === 'black' ? 'brightness(0)' : 'none',
  };

  return (
    <div className="relative w-full h-full min-h-[380px] lg:min-h-full bg-[#0d1117] flex flex-col overflow-hidden select-none">
      
      {/* Top Section View Tabs */}
      <div className="h-12 border-b border-white/10 px-4 flex items-center justify-between bg-neutral-900/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => {
              setActiveSection('top');
              handleMap2DTo3D('top', 50, 76);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'top'
                ? 'bg-sky-500 text-white font-bold shadow-sm'
                : 'text-neutral-300 hover:text-white bg-white/5'
            }`}
          >
            <span>🔰 Vista Superior (Cofre / Techo / Tapa Trasera)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('left');
              handleMap2DTo3D('left', 50, 52);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'left'
                ? 'bg-sky-500 text-white font-bold shadow-sm'
                : 'text-neutral-300 hover:text-white bg-white/5'
            }`}
          >
            <span>🚪 Costado Izquierdo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('right');
              handleMap2DTo3D('right', 50, 52);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'right'
                ? 'bg-sky-500 text-white font-bold shadow-sm'
                : 'text-neutral-300 hover:text-white bg-white/5'
            }`}
          >
            <span>🚪 Costado Derecho</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('rear');
              handleMap2DTo3D('rear', 50, 65);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'rear'
                ? 'bg-sky-500 text-white font-bold shadow-sm'
                : 'text-neutral-300 hover:text-white bg-white/5'
            }`}
          >
            <span>🏎️ Vista Trasera</span>
          </button>
        </div>

        {/* Live Detected Zone */}
        <div className="hidden sm:flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-xl text-xs font-mono text-sky-400 border border-white/10">
          <Compass className="w-3.5 h-3.5" />
          <span>{draftSponsor.zoneName || 'Cofre Central Frontal'}</span>
        </div>
      </div>

      {/* 2D Interactive Blueprint Canvas */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 relative flex items-center justify-center p-6 overflow-hidden cursor-crosshair"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
      >
        {/* Blueprint Grid Background */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #38bdf8 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* 2D VECTOR BLUEPRINT: TOP VIEW (Cofre, Techo, Tapa Trasera) */}
        {activeSection === 'top' && (
          <div className="relative w-[320px] sm:w-[380px] h-[520px] border-2 border-sky-500/30 rounded-[70px] bg-slate-900/60 p-6 flex flex-col items-center justify-between shadow-2xl backdrop-blur-sm pointer-events-none">
            
            {/* Rear Decklid Section */}
            <div className="w-full h-16 rounded-2xl border-2 border-dashed border-amber-400/50 bg-amber-400/10 flex flex-col items-center justify-center relative">
              <span className="text-[10px] font-mono font-bold text-amber-300">🏁 TAPA DE MOTOR TRASERA ($25 MXN/cm²)</span>
              <span className="text-[9px] font-mono text-neutral-400">Rejilla y perfil trasero 992</span>
            </div>

            {/* Rear Windshield Glass (Excluded) */}
            <div className="w-48 h-14 rounded-xl border border-sky-400/20 bg-sky-950/40 flex items-center justify-center opacity-60">
              <span className="text-[9px] font-mono text-sky-300/60">Cristal Trasero (Sin Vinil)</span>
            </div>

            {/* Panoramic Roof Section */}
            <div className="w-56 h-24 rounded-2xl border-2 border-dashed border-sky-400/40 bg-sky-400/10 flex flex-col items-center justify-center">
              <span className="text-[10px] font-mono font-bold text-sky-300">🔲 TECHO PANORÁMICO ($15 MXN/cm²)</span>
              <span className="text-[9px] font-mono text-neutral-400">Superficie central superior</span>
            </div>

            {/* Front Windshield Glass (Excluded) */}
            <div className="w-52 h-16 rounded-xl border border-sky-400/20 bg-sky-950/40 flex items-center justify-center opacity-60">
              <span className="text-[9px] font-mono text-sky-300/60">Parabrisas Frontal (Sin Vinil)</span>
            </div>

            {/* Central Hood Section */}
            <div className="w-full h-28 rounded-3xl border-2 border-dashed border-emerald-400/50 bg-emerald-400/10 flex flex-col items-center justify-center">
              <span className="text-[10px] font-mono font-bold text-emerald-300">🔰 COFRE CENTRAL ($20 MXN/cm²)</span>
              <span className="text-[9px] font-mono text-neutral-400">Impacto frontal directo</span>
            </div>

          </div>
        )}

        {/* 2D VECTOR BLUEPRINT: SIDE PROFILE (Left or Right Door) */}
        {(activeSection === 'left' || activeSection === 'right') && (
          <div className="relative w-[540px] sm:w-[620px] h-[260px] border-2 border-sky-500/30 rounded-[50px] bg-slate-900/60 p-6 flex items-center justify-between shadow-2xl backdrop-blur-sm pointer-events-none">
            
            {/* Front Fender */}
            <div className="w-28 h-36 rounded-2xl border border-sky-400/30 bg-sky-400/5 flex items-center justify-center text-center p-1">
              <span className="text-[9px] font-mono text-neutral-400">Salpicadera Frontal</span>
            </div>

            {/* Door & Side Body VIP Area */}
            <div className="flex-1 h-44 mx-3 rounded-2xl border-2 border-dashed border-sky-400/60 bg-sky-400/10 flex flex-col items-center justify-center text-center p-3">
              <span className="text-xs font-mono font-bold text-sky-300">
                🚪 {activeSection === 'left' ? 'PUERTA IZQUIERDA' : 'PUERTA DERECHA'} ($15 MXN/cm²)
              </span>
              <span className="text-[10px] font-mono text-neutral-400 mt-1">
                Gran visibilidad en laterales y eventos en vivo
              </span>
            </div>

            {/* Rear Quarter Panel */}
            <div className="w-32 h-36 rounded-2xl border border-sky-400/30 bg-sky-400/5 flex items-center justify-center text-center p-1">
              <span className="text-[9px] font-mono text-neutral-400">Costado Trasero</span>
            </div>

          </div>
        )}

        {/* 2D VECTOR BLUEPRINT: REAR VIEW */}
        {activeSection === 'rear' && (
          <div className="relative w-[380px] h-[300px] border-2 border-sky-500/30 rounded-[40px] bg-slate-900/60 p-6 flex flex-col items-center justify-between shadow-2xl backdrop-blur-sm pointer-events-none">
            
            {/* Spoiler Top */}
            <div className="w-full h-16 rounded-xl border-2 border-dashed border-amber-400/50 bg-amber-400/10 flex items-center justify-center">
              <span className="text-[10px] font-mono font-bold text-amber-300">🏁 ALERÓN TRASERO VIP ($25 MXN/cm²)</span>
            </div>

            {/* LED Light Strip (Protected / Excluded) */}
            <div className="w-full h-6 rounded-full bg-red-950/80 border border-red-500/40 flex items-center justify-center">
              <span className="text-[8px] font-mono text-red-300">Barra LED Porsche (Excluida)</span>
            </div>

            {/* Rear Bumper Section */}
            <div className="w-full h-24 rounded-2xl border-2 border-dashed border-sky-400/40 bg-sky-400/10 flex flex-col items-center justify-center">
              <span className="text-[10px] font-mono font-bold text-sky-300">🏎️ DEFENSA TRASERA ($10 MXN/cm²)</span>
              <span className="text-[9px] font-mono text-neutral-400">Difusor y fascia</span>
            </div>

          </div>
        )}

        {/* THE DRAGGABLE 2D LOGO / STICKER */}
        <div
          style={logoStyle}
          className="cursor-grab active:cursor-grabbing pointer-events-auto border-2 border-sky-400 bg-sky-950/40 rounded-xl p-1.5 shadow-2xl flex items-center justify-center"
        >
          {draftSponsor.logoUrl ? (
            <img
              src={draftSponsor.logoUrl}
              alt="Logo"
              className="w-full h-full object-contain pointer-events-none"
            />
          ) : (
            <div className="text-white text-center font-bold text-xs pointer-events-none">
              {draftSponsor.brandName || 'TU LOGO'}
            </div>
          )}

          {/* Dimension Tag */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[9px] font-mono px-2 py-0.5 rounded-full border border-white/20 whitespace-nowrap shadow-md pointer-events-none">
            {widthCm}x{heightCm}cm ({widthCm * heightCm}cm²)
          </div>
        </div>

      </div>

      {/* Bottom Zoom & Reset Controls */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}
          className="p-2 rounded-xl bg-neutral-900/90 text-white border border-white/10 hover:bg-neutral-800 transition cursor-pointer shadow-lg"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
          className="p-2 rounded-xl bg-neutral-900/90 text-white border border-white/10 hover:bg-neutral-800 transition cursor-pointer shadow-lg"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          className="p-2 rounded-xl bg-neutral-900/90 text-white border border-white/10 hover:bg-neutral-800 transition cursor-pointer shadow-lg"
          title="Reiniciar Zoom"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
