import React, { useState, useRef, useEffect } from 'react';
import type { Sponsor, SponsorTier } from '../../types/sponsor';
import { Compass, RotateCw, ZoomIn, ZoomOut, LayoutGrid } from 'lucide-react';

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

type BlueprintSection = 'all' | 'top' | 'left' | 'right' | 'rear';

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
  const [logo2DPos, setLogo2DPos] = useState<{ x: number; y: number }>({ x: 50, y: 72 });

  // Sync 2D position based on incoming 3D position
  useEffect(() => {
    const pos = draftSponsor.position3D || [0, 0.96, 1.2];
    if (draftSponsor.tier === 'rear_decklid' || (draftSponsor.tier as any) === 'vip_wing') {
      setActiveSection('top');
      setLogo2DPos({ x: 50 + pos[0] * 35, y: 22 });
    } else if (draftSponsor.tier === 'hood_central') {
      setActiveSection('top');
      setLogo2DPos({ x: 50 + pos[0] * 35, y: 72 });
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
    let detectedPrice = 35;

    const relX = (normX - 50) / 35; // centered relative offset

    if (section === 'top' || section === 'all') {
      // Top view (Y: 0% is rear decklid, 100% is front hood)
      if (normY < 32) {
        // Tapa de Motor & Fascia Trasera (VIP)
        pos3D = [relX * 0.7, 0.98, -1.35];
        rot3D = [0.15, 0, 0];
        detectedTier = 'rear_decklid';
        detectedZoneName = 'Tapa de Motor & Fascia Trasera';
        detectedPrice = 40;
      } else if (normY < 58) {
        // Techo Panorámico
        pos3D = [relX * 0.5, 1.34, -0.1 + ((normY - 45) / 15) * 0.3];
        rot3D = [-Math.PI / 2, 0, 0];
        detectedTier = 'body_standard';
        detectedZoneName = 'Techo Panorámico';
        detectedPrice = 25;
      } else {
        // Cofre Central Frontal
        pos3D = [relX * 0.65, 0.96, 0.75 + ((normY - 60) / 40) * 0.5];
        rot3D = [-1.25, 0, 0];
        detectedTier = 'hood_central';
        detectedZoneName = 'Cofre Central Frontal';
        detectedPrice = 35;
      }
    } else if (section === 'left') {
      // Left Door & Fender (X: 0% front, 100% rear)
      const relZ = ((normX - 50) / 50) * 1.5;
      pos3D = [-1.02, 0.58 + ((50 - normY) / 50) * 0.3, -relZ];
      rot3D = [0, -Math.PI / 2, 0];
      detectedTier = 'premium_door';
      detectedZoneName = 'Puerta / Costado Izquierdo';
      detectedPrice = 25;
    } else if (section === 'right') {
      // Right Door & Fender (X: 0% rear, 100% front)
      const relZ = ((normX - 50) / 50) * 1.5;
      pos3D = [1.02, 0.58 + ((50 - normY) / 50) * 0.3, relZ];
      rot3D = [0, Math.PI / 2, 0];
      detectedTier = 'premium_door';
      detectedZoneName = 'Puerta / Costado Derecho';
      detectedPrice = 25;
    } else if (section === 'rear') {
      // Rear bumper
      pos3D = [relX * 0.7, 0.45 + ((50 - normY) / 50) * 0.3, -1.9];
      rot3D = [0, Math.PI, 0];
      detectedTier = 'body_standard';
      detectedZoneName = 'Defensa Trasera';
      detectedPrice = 15;
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
    const clampedX = Math.max(12, Math.min(88, ((e.clientX - rect.left) / rect.width) * 100));
    const clampedY = Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100));
    
    setLogo2DPos({ x: clampedX, y: clampedY });
    handleMap2DTo3D(activeSection, clampedX, clampedY);
  };

  // Sticker size derived directly from centimeters
  const displayW = Math.max(36, widthCm * 2.4);
  const displayH = Math.max(24, heightCm * 2.4);

  const logoStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${logo2DPos.x}%`,
    top: `${logo2DPos.y}%`,
    transform: `translate(-50%, -50%) rotate(${rotationAngle}deg) scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})`,
    width: `${displayW}px`,
    height: `${displayH}px`,
    opacity,
    filter: filterStyle === 'white' ? 'brightness(0) invert(1)' : filterStyle === 'black' ? 'brightness(0)' : 'none',
  };

  return (
    <div className="relative w-full h-full min-h-[380px] lg:min-h-full bg-[#0a0d14] flex flex-col overflow-hidden select-none">
      
      {/* Top Section View Tabs */}
      <div className="h-13 border-b border-white/10 px-3 sm:px-4 flex items-center justify-between bg-neutral-950/90 backdrop-blur-md z-20 overflow-x-auto">
        <div className="flex items-center gap-1.5 py-1">
          <button
            type="button"
            onClick={() => {
              setActiveSection('top');
              handleMap2DTo3D('top', 50, 72);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'top'
                ? 'bg-sky-500 text-white font-bold shadow-md'
                : 'text-neutral-300 hover:text-white bg-white/5'
            }`}
          >
            <span>🔰 Vista Superior (Cofre / Techo / Tapa)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('left');
              handleMap2DTo3D('left', 50, 52);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'left'
                ? 'bg-sky-500 text-white font-bold shadow-md'
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
                ? 'bg-sky-500 text-white font-bold shadow-md'
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
                ? 'bg-sky-500 text-white font-bold shadow-md'
                : 'text-neutral-300 hover:text-white bg-white/5'
            }`}
          >
            <span>🏎️ Vista Trasera 992</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('all');
              handleMap2DTo3D('all', 50, 72);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'all'
                ? 'bg-emerald-500 text-white font-bold shadow-md'
                : 'text-neutral-300 hover:text-white bg-white/5'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>🏁 Despiece Completo (Master Sheet)</span>
          </button>
        </div>

        {/* Live Detected Zone */}
        <div className="hidden md:flex items-center gap-1.5 bg-neutral-900 px-3 py-1.5 rounded-xl text-xs font-mono text-sky-400 border border-white/10 shrink-0 ml-2">
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
        className="flex-1 relative flex items-center justify-center p-4 sm:p-8 overflow-hidden cursor-crosshair"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
      >
        {/* Technical Millimeter Blueprint Grid Background */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #38bdf8 1px, transparent 1px),
              linear-gradient(to bottom, #38bdf8 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px'
          }}
        />

        {/* Technical Watermark */}
        <div className="absolute top-4 left-4 pointer-events-none opacity-40 font-mono text-[10px] text-sky-400 space-y-0.5">
          <div>PORSCHE 911 (992) CARRERA · LIVERY VINYL TEMPLATE</div>
          <div>ESCALA: 1:1 PLANO VECTORIAL · DIMENSIÓN REAL: {widthCm}cm x {heightCm}cm</div>
          <div>ARRASTRA EL LOGO DIRECTAMENTE SOBRE LA CHAPA</div>
        </div>

        {/* ========================================================================= */}
        {/* 1. VISTA SUPERIOR (TOP VIEW) - AUTHENTIC 911 SILHOUETTE */}
        {/* ========================================================================= */}
        {activeSection === 'top' && (
          <div className="relative w-[340px] sm:w-[400px] h-[560px] flex items-center justify-center pointer-events-none">
            
            {/* SVG REAL PORSCHE 911 992 TOP BLUEPRINT */}
            <svg viewBox="0 0 400 620" className="w-full h-full drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
              <defs>
                {/* Paint Body Metallic White Fill */}
                <linearGradient id="bodyPaintTop" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="50%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>

                {/* Glass Tint Gradient */}
                <linearGradient id="glassTint" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.3" />
                </linearGradient>

                {/* Carbon Roof Gradient */}
                <linearGradient id="roofPaint" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
              </defs>

              {/* 1. Car Outer Body Silhouette (Pure Carrera 992 Wide Body) */}
              <path
                d="M 140,590 
                   C 100,585 70,540 65,470 
                   C 60,400 68,310 70,220 
                   C 72,140 100,60 145,35 
                   C 175,20 225,20 255,35 
                   C 300,60 328,140 330,220 
                   C 332,310 340,400 335,470 
                   C 330,540 300,585 260,590 
                   Z"
                fill="url(#bodyPaintTop)"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />

              {/* 2. Front Headlights (Protected / Excluded Oval Lens) */}
              <ellipse cx="115" cy="85" rx="24" ry="42" transform="rotate(-18 115 85)" fill="#0f172a" stroke="#e0f2fe" strokeWidth="2" strokeDasharray="3 3" opacity="0.8" />
              <ellipse cx="285" cy="85" rx="24" ry="42" transform="rotate(18 285 85)" fill="#0f172a" stroke="#e0f2fe" strokeWidth="2" strokeDasharray="3 3" opacity="0.8" />
              <text x="115" y="88" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">Faro (Lente)</text>
              <text x="285" y="88" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">Faro (Lente)</text>

              {/* 3. Central Frunk / Hood Zone (Cofre Delantero - Estrella) */}
              <path
                d="M 135,160 C 130,105 155,50 200,45 C 245,50 270,105 265,160 Z"
                fill="#10b981"
                fillOpacity="0.12"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <text x="200" y="115" fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">🔰 COFRE CENTRAL</text>
              <text x="200" y="130" fill="#a7f3d0" fontSize="9" fontFamily="monospace" textAnchor="middle">$35 MXN/cm²</text>

              {/* 4. Front Windshield (Glass - Excluded) */}
              <path
                d="M 118,175 C 150,165 250,165 282,175 L 295,245 C 240,240 160,240 105,245 Z"
                fill="url(#glassTint)"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeOpacity="0.4"
              />
              <text x="200" y="215" fill="#7dd3fc" fontSize="9" fontFamily="monospace" textAnchor="middle" opacity="0.6">Parabrisas Delantero (Cristal)</text>

              {/* 5. Panoramic Roof Zone (Techo Panorámico) */}
              <path
                d="M 112,255 C 160,250 240,250 288,255 L 292,360 C 240,365 160,365 108,360 Z"
                fill="#38bdf8"
                fillOpacity="0.14"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <text x="200" y="300" fill="#7dd3fc" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">🔲 TECHO PANORÁMICO</text>
              <text x="200" y="318" fill="#bae6fd" fontSize="9" fontFamily="monospace" textAnchor="middle">$25 MXN/cm²</text>

              {/* 6. Rear Window (Glass - Excluded) */}
              <path
                d="M 115,372 C 160,378 240,378 285,372 L 275,445 C 235,450 165,450 125,445 Z"
                fill="url(#glassTint)"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeOpacity="0.4"
              />
              <text x="200" y="415" fill="#7dd3fc" fontSize="9" fontFamily="monospace" textAnchor="middle" opacity="0.6">Cristal Trasero (Térmico)</text>

              {/* 7. Rear Decklid & Engine Grille (Tapa Trasera 992 con Rejillas Verticales) */}
              <path
                d="M 130,455 C 165,460 235,460 270,455 L 265,540 C 235,550 165,550 135,540 Z"
                fill="#f59e0b"
                fillOpacity="0.14"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* 992 Signature Vertical Grille Slats */}
              <line x1="165" y1="465" x2="165" y2="525" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.6" />
              <line x1="175" y1="465" x2="175" y2="525" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.6" />
              <line x1="185" y1="465" x2="185" y2="525" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.6" />
              <line x1="195" y1="465" x2="195" y2="525" stroke="#ef4444" strokeWidth="2.5" /> {/* High Brake Light */}
              <line x1="205" y1="465" x2="205" y2="525" stroke="#ef4444" strokeWidth="2.5" />
              <line x1="215" y1="465" x2="215" y2="525" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.6" />
              <line x1="225" y1="465" x2="225" y2="525" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.6" />
              <line x1="235" y1="465" x2="235" y2="525" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.6" />

              <text x="200" y="500" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">🏁 TAPA DE MOTOR 992</text>
              <text x="200" y="515" fill="#fde68a" fontSize="8.5" fontFamily="monospace" textAnchor="middle">$40 MXN/cm²</text>

              {/* 8. Rear Full LED Lightbar (Signature 992 Continuous Strip) */}
              <path d="M 100,560 C 160,572 240,572 300,560" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
              <text x="200" y="580" fill="#f87171" fontSize="8" fontFamily="monospace" textAnchor="middle">Barra LED Trasera Porsche (No Vinilable)</text>
            </svg>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. COSTADO LATERAL (LEFT / RIGHT PROFILE) */}
        {/* ========================================================================= */}
        {(activeSection === 'left' || activeSection === 'right') && (
          <div className="relative w-[560px] sm:w-[680px] h-[300px] flex items-center justify-center pointer-events-none">
            
            {/* SVG REAL PORSCHE 911 992 SIDE PROFILE BLUEPRINT */}
            <svg 
              viewBox="0 0 700 280" 
              className="w-full h-full drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
              style={{ transform: activeSection === 'left' ? 'scaleX(1)' : 'scaleX(-1)' }}
            >
              <defs>
                <linearGradient id="sidePaintGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="70%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>

              {/* 1. Iconic 911 Flyline Silhouette */}
              <path
                d="M 40,210 
                   L 70,210
                   C 80,150 150,150 160,210
                   L 460,210
                   C 470,150 540,150 550,210
                   L 660,205
                   C 665,180 660,155 640,140
                   C 570,120 480,75 360,75
                   C 260,75 190,115 120,135
                   C 80,148 45,175 40,210
                   Z"
                fill="url(#sidePaintGrad)"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />

              {/* 2. Wheels / Alloy Rims (Excluded) */}
              <circle cx="115" cy="210" r="42" fill="#090d16" stroke="#64748b" strokeWidth="4" />
              <circle cx="115" cy="210" r="28" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 2" />
              <circle cx="505" cy="210" r="42" fill="#090d16" stroke="#64748b" strokeWidth="4" />
              <circle cx="505" cy="210" r="28" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="115" y="214" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">Rueda Del.</text>
              <text x="505" y="214" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">Rueda Tras.</text>

              {/* 3. Side Windows Greenhouse (Glass - Excluded) */}
              <path
                d="M 230,130 L 350,88 C 450,90 490,130 520,135 L 230,135 Z"
                fill="#0284c7"
                fillOpacity="0.25"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              <text x="360" y="118" fill="#7dd3fc" fontSize="9" fontFamily="monospace" textAnchor="middle" opacity="0.6">Ventanilla Lateral</text>

              {/* 4. Door Panel VIP Vinyl Area (Puerta Principal) */}
              <path
                d="M 220,140 L 410,140 L 395,205 L 210,205 Z"
                fill="#38bdf8"
                fillOpacity="0.15"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              {/* Door Handle */}
              <rect x="345" y="146" width="28" height="6" rx="3" fill="#64748b" stroke="#38bdf8" strokeWidth="1" />

              <text x="310" y="172" fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                🚪 {activeSection === 'left' ? 'PUERTA IZQUIERDA' : 'PUERTA DERECHA'}
              </text>
              <text x="310" y="188" fill="#bae6fd" fontSize="9" fontFamily="monospace" textAnchor="middle">$25 MXN/cm²</text>

              {/* 5. Front & Rear Fenders (Salpicaderas) */}
              <text x="165" y="160" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">Salpicadera ($20/cm²)</text>
              <text x="560" y="160" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">Costado ($20/cm²)</text>
            </svg>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. VISTA TRASERA (REAR PROFILE 992) */}
        {/* ========================================================================= */}
        {activeSection === 'rear' && (
          <div className="relative w-[380px] sm:w-[440px] h-[340px] flex items-center justify-center pointer-events-none">
            
            {/* SVG REAL PORSCHE 911 992 REAR BLUEPRINT */}
            <svg viewBox="0 0 460 360" className="w-full h-full drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
              {/* Rear Widebody Silhouette */}
              <path
                d="M 120,60 
                   C 180,50 280,50 340,60 
                   C 390,90 420,160 435,260 
                   C 440,300 420,320 380,320 
                   L 80,320 
                   C 40,320 20,300 25,260 
                   C 40,160 70,90 120,60 
                   Z"
                fill="#1e293b"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />

              {/* Rear Glass */}
              <path d="M 140,70 C 180,62 280,62 320,70 L 340,140 C 280,148 180,148 120,140 Z" fill="#0284c7" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="1.5" />

              {/* Rear Decklid VIP Area */}
              <path
                d="M 110,150 C 180,158 280,158 350,150 L 370,210 C 280,218 180,218 90,210 Z"
                fill="#f59e0b"
                fillOpacity="0.15"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <text x="230" y="180" fill="#fbbf24" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">🏁 TAPA DE MOTOR TRASERA 992</text>
              <text x="230" y="195" fill="#fde68a" fontSize="9" fontFamily="monospace" textAnchor="middle">$40 MXN/cm²</text>

              {/* 992 Continuous Slim LED Lightbar */}
              <path d="M 60,225 C 180,230 280,230 400,225" fill="none" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
              <text x="230" y="242" fill="#f87171" fontSize="8" fontFamily="monospace" textAnchor="middle">Barra LED Porsche 992</text>

              {/* Rear Bumper & Diffuser Section */}
              <path
                d="M 70,250 C 180,255 280,255 390,250 L 375,305 C 280,312 180,312 85,305 Z"
                fill="#38bdf8"
                fillOpacity="0.15"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <text x="230" y="278" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">🏎️ DEFENSA TRASERA</text>
              <text x="230" y="292" fill="#bae6fd" fontSize="9" fontFamily="monospace" textAnchor="middle">$15 MXN/cm²</text>

              {/* Dual Exhaust Tips */}
              <ellipse cx="140" cy="312" rx="16" ry="8" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
              <ellipse cx="320" cy="312" rx="16" ry="8" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
            </svg>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. MASTER LIVERY WRAP SHEET (4-IN-1 DESPIECE COMPLETO) */}
        {/* ========================================================================= */}
        {activeSection === 'all' && (
          <div className="relative w-full max-w-[760px] h-[580px] grid grid-cols-2 gap-4 p-4 border border-sky-500/20 rounded-3xl bg-slate-950/80 backdrop-blur-md pointer-events-none">
            
            {/* Top View Mini */}
            <div className="border border-white/10 rounded-2xl p-2 bg-slate-900/50 flex flex-col items-center justify-center relative">
              <span className="text-[10px] font-mono text-emerald-400 font-bold mb-1">1. VISTA SUPERIOR (COFRE & TECHO)</span>
              <div className="w-24 h-48 border border-dashed border-emerald-400/40 rounded-3xl bg-emerald-400/5 flex flex-col items-center justify-around p-1 text-[8px] font-mono text-neutral-300">
                <span>Cofre ($35)</span>
                <span>Techo ($25)</span>
                <span>Tapa ($40)</span>
              </div>
            </div>

            {/* Rear View Mini */}
            <div className="border border-white/10 rounded-2xl p-2 bg-slate-900/50 flex flex-col items-center justify-center relative">
              <span className="text-[10px] font-mono text-amber-400 font-bold mb-1">2. VISTA TRASERA (FASCIA & DEFENSA)</span>
              <div className="w-36 h-28 border border-dashed border-amber-400/40 rounded-2xl bg-amber-400/5 flex flex-col items-center justify-around p-1 text-[8px] font-mono text-neutral-300">
                <span>Tapa Motor ($40)</span>
                <span className="text-red-400">LED Bar</span>
                <span>Defensa ($15)</span>
              </div>
            </div>

            {/* Left Profile Mini */}
            <div className="border border-white/10 rounded-2xl p-2 bg-slate-900/50 flex flex-col items-center justify-center relative col-span-2">
              <span className="text-[10px] font-mono text-sky-400 font-bold mb-1">3. COSTADO LATERAL (PUERTA & SALPICADERAS)</span>
              <div className="w-full h-20 border border-dashed border-sky-400/40 rounded-2xl bg-sky-400/5 flex items-center justify-around p-1 text-[9px] font-mono text-neutral-300">
                <span>Salpicadera Del.</span>
                <span className="font-bold text-sky-300">PUERTA ($25 MXN/cm²)</span>
                <span>Costado Trasero</span>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* DRAGGABLE REAL VINYL DECAL STICKER */}
        {/* ========================================================================= */}
        <div
          style={logoStyle}
          className="z-30 pointer-events-auto cursor-move flex items-center justify-center group"
        >
          {/* Real Vinyl Cutout Border & Corner Grips */}
          <div className="absolute -inset-1 border-2 border-dashed border-sky-400/90 rounded-xl pointer-events-none group-hover:border-white shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
          
          {/* Centimeters Badge */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-neutral-950/90 border border-sky-400 text-sky-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg">
            {widthCm}x{heightCm}cm ({widthCm * heightCm}cm²)
          </div>

          {/* Logo / Image Content */}
          {draftSponsor.logoUrl ? (
            <img
              src={draftSponsor.logoUrl}
              alt="Vinyl Logo"
              className="w-full h-full object-contain pointer-events-none select-none drop-shadow-md"
            />
          ) : (
            <div className="w-full h-full rounded-lg bg-sky-500/20 border border-sky-400/50 flex flex-col items-center justify-center p-1 text-center backdrop-blur-xs">
              <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider truncate max-w-full">
                {draftSponsor.brandName || draftSponsor.sponsorName || 'TU LOGO'}
              </span>
              <span className="text-[9px] font-mono text-sky-200">
                {widthCm}x{heightCm} cm
              </span>
            </div>
          )}

          {/* Crosshair Center Indicator */}
          <div className="absolute w-2.5 h-2.5 rounded-full bg-sky-400/80 pointer-events-none" />
        </div>

      </div>

      {/* Floating Canvas Tools on Bottom-Right */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-neutral-900/90 backdrop-blur-md p-1 rounded-2xl border border-white/10 shadow-xl">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))))}
          className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Zoom Acercar Blueprint"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <span className="text-[10px] font-mono px-1.5 text-neutral-400 font-bold">
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))}
          className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Zoom Alejar Blueprint"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setLogo2DPos({ x: 50, y: activeSection === 'top' ? 72 : 52 });
          }}
          className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Restablecer Vista Plana"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
