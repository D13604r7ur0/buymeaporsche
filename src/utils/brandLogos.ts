// High-Resolution Crisp Vector SVG Brand Logos (0ms latency, 100% reliable, zero CORS issues)

export const createSvgDataUrl = (svgContent: string): string => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
};

export const BRAND_LOGOS = {
  apexRacing: createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <linearGradient id="apexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#d5001c" />
          <stop offset="100%" stop-color="#900010" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="60" fill="#0a0c10"/>
      <path d="M120 280 L200 100 L280 280 L230 280 L200 210 L170 280 Z" fill="url(#apexGrad)"/>
      <circle cx="200" cy="180" r="18" fill="#ffffff"/>
      <text x="200" y="340" font-family="'Plus Jakarta Sans', sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">APEX RACING</text>
    </svg>
  `),

  quantumAi: createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <linearGradient id="quantumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f0ff" />
          <stop offset="100%" stop-color="#0070bb" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="60" fill="#05070d"/>
      <circle cx="200" cy="180" r="70" fill="none" stroke="url(#quantumGrad)" stroke-width="14" stroke-dasharray="20 10"/>
      <circle cx="200" cy="180" r="40" fill="none" stroke="#00f0ff" stroke-width="8"/>
      <circle cx="200" cy="180" r="16" fill="#ffffff"/>
      <text x="200" y="335" font-family="'JetBrains Mono', monospace" font-size="32" font-weight="800" fill="#00f0ff" text-anchor="middle" letter-spacing="3">QUANTUM AI</text>
    </svg>
  `),

  veloceCapital: createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffd700" />
          <stop offset="50%" stop-color="#d4af37" />
          <stop offset="100%" stop-color="#aa820a" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="60" fill="#0f1115"/>
      <polygon points="200,80 290,140 260,260 200,300 140,260 110,140" fill="none" stroke="url(#goldGrad)" stroke-width="12"/>
      <text x="200" y="215" font-family="serif" font-size="90" font-weight="bold" fill="url(#goldGrad)" text-anchor="middle">V</text>
      <text x="200" y="345" font-family="'Plus Jakarta Sans', sans-serif" font-size="28" font-weight="800" fill="#d4af37" text-anchor="middle" letter-spacing="5">VELOCE</text>
    </svg>
  `),

  nitroEnergy: createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <linearGradient id="nitroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fed100" />
          <stop offset="100%" stop-color="#ff7700" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="60" fill="#141414"/>
      <path d="M220 70 L130 210 L190 210 L160 330 L270 170 L210 170 Z" fill="url(#nitroGrad)"/>
      <text x="200" y="365" font-family="'Plus Jakarta Sans', sans-serif" font-size="34" font-weight="900" fill="#fed100" text-anchor="middle" letter-spacing="4">NITRO</text>
    </svg>
  `),

  carbonForge: createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <rect width="400" height="400" rx="60" fill="#181a1f"/>
      <circle cx="200" cy="170" r="65" fill="#22262d" stroke="#ffffff" stroke-width="10"/>
      <path d="M160 170 L240 170 M200 130 L200 210" stroke="#00e5ff" stroke-width="12" stroke-linecap="round"/>
      <text x="200" y="340" font-family="'JetBrains Mono', monospace" font-size="28" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="3">CARBON FORGE</text>
    </svg>
  `),
};
