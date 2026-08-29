import React from 'react';

export const PorscheCrest: React.FC<{ className?: string }> = ({ className = 'w-7 h-9' }) => {
  return (
    <svg
      viewBox="0 0 120 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="40%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
        <linearGradient id="redGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#B91C1C" />
        </linearGradient>
        <filter id="crestShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.35" />
        </filter>
      </defs>
      
      {/* Outer Golden Shield */}
      <path
        d="M60 4 C95 4 116 16 116 38 C116 95 86 135 60 148 C34 135 4 95 4 38 C4 16 25 4 60 4 Z"
        fill="url(#goldGrad)"
        stroke="#0F172A"
        strokeWidth="3.5"
        filter="url(#crestShadow)"
      />
      
      {/* Inner Shield Bevel */}
      <path
        d="M60 9 C90 9 110 19 110 39 C110 90 82 128 60 140 C38 128 10 90 10 39 C10 19 30 9 60 9 Z"
        stroke="#FFFFFF"
        strokeOpacity="0.45"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Top Header Banner for PORSCHE text */}
      <path d="M10 27 L110 27" stroke="#0F172A" strokeWidth="2.5" />
      <text
        x="60"
        y="21"
        textAnchor="middle"
        fill="#0F172A"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="11"
        fontWeight="900"
        letterSpacing="2.8"
      >
        PORSCHE
      </text>

      {/* 4 Quadrants Divider */}
      <line x1="60" y1="27" x2="60" y2="140" stroke="#0F172A" strokeWidth="3" />
      <line x1="10" y1="74" x2="110" y2="74" stroke="#0F172A" strokeWidth="3" />

      {/* Top-Right & Bottom-Left: Red & Black Stripes (Württemberg) */}
      {/* Top Right */}
      <path d="M60 27 H109 C109 43 106 59 99 74 H60 V27 Z" fill="#0F172A" />
      <rect x="60" y="36" width="48" height="8" fill="url(#redGrad)" />
      <rect x="60" y="54" width="42" height="8" fill="url(#redGrad)" />

      {/* Bottom Left */}
      <path d="M11 74 H60 V126 C44 116 27 97 11 74 Z" fill="#0F172A" />
      <rect x="16" y="84" width="44" height="8" fill="url(#redGrad)" />
      <rect x="26" y="102" width="34" height="8" fill="url(#redGrad)" />

      {/* Top-Left & Bottom-Right: Gold with Black Antlers */}
      {/* Top Left Antlers */}
      <path d="M20 39 C32 37 44 43 54 41" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
      <path d="M28 35 L28 45" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M40 36 L40 46" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 55 C32 53 44 59 54 57" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 51 L30 61" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M42 52 L42 62" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />

      {/* Bottom Right Antlers */}
      <path d="M66 88 C78 86 90 92 100 90" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
      <path d="M74 84 L74 94" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M86 85 L86 95" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M66 104 C74 102 84 108 92 106" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
      <path d="M74 100 L74 110" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />

      {/* Center Stuttgart Inescutcheon (Inner Golden Shield with Rearing Horse) */}
      <path
        d="M44 57 C55 57 65 61 65 69 C65 91 54 104 44 108 C34 104 23 91 23 69 C23 61 33 57 44 57 Z"
        transform="translate(16, -2)"
        fill="url(#goldGrad)"
        stroke="#0F172A"
        strokeWidth="2.5"
      />
      
      {/* Stuttgart Text */}
      <text
        x="60"
        y="65"
        textAnchor="middle"
        fill="#0F172A"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="5.5"
        fontWeight="900"
        letterSpacing="0.8"
      >
        STUTTGART
      </text>

      {/* Stuttgart Rearing Stallion Horse Silhouette */}
      <path
        d="M59 71 C59 69 61 68 62 69 C63 70 62 72 63 73 C65 73 67 71 68 73 C66 75 64 76 64 78 C66 80 67 84 66 87 C65 88 64 88 64 91 C63 93 65 96 66 97 C64 97 62 95 61 93 C60 92 59 92 58 95 C57 97 55 97 54 95 C56 93 57 90 56 87 C55 85 53 86 52 84 C54 83 56 82 57 79 C57 76 56 74 58 72 Z"
        fill="#0F172A"
      />
    </svg>
  );
};
