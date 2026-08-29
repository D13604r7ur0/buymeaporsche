// High-Resolution Crisp Vector SVG Brand Logos (0ms latency, 100% reliable, zero CORS issues)

export const createSvgDataUrl = (svgContent: string): string => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
};

/**
 * Generates a clean, unique SVG logo data-URL for a given brand name.
 * Each logo uses a deterministic color palette derived from the name hash.
 */
export function generateBrandSvgLogo(
  brandName: string,
  primaryColor: string,
  accentColor: string,
  iconShape: 'bolt' | 'diamond' | 'circle' | 'hexagon' | 'shield' | 'star' | 'gear' | 'wave' | 'arrow' | 'flame' = 'diamond',
): string {
  // Get initials (max 3 chars)
  const words = brandName.trim().split(/\s+/);
  const initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : brandName.substring(0, 2).toUpperCase();

  // Short display name for bottom text (max 14 chars)
  const displayName = brandName.length > 14 ? brandName.substring(0, 14).toUpperCase() : brandName.toUpperCase();

  const iconPaths: Record<string, string> = {
    bolt: `<path d="M220 70 L130 210 L190 210 L160 330 L270 170 L210 170 Z" fill="${primaryColor}" opacity="0.35"/>`,
    diamond: `<polygon points="200,80 290,180 200,300 110,180" fill="none" stroke="${primaryColor}" stroke-width="10" opacity="0.40"/>`,
    circle: `<circle cx="200" cy="180" r="70" fill="none" stroke="${primaryColor}" stroke-width="10" opacity="0.35"/><circle cx="200" cy="180" r="40" fill="none" stroke="${primaryColor}" stroke-width="6" opacity="0.20"/>`,
    hexagon: `<polygon points="200,80 270,130 270,230 200,280 130,230 130,130" fill="none" stroke="${primaryColor}" stroke-width="10" opacity="0.35"/>`,
    shield: `<path d="M200 70 L280 110 L280 200 Q280 260 200 310 Q120 260 120 200 L120 110 Z" fill="none" stroke="${primaryColor}" stroke-width="10" opacity="0.35"/>`,
    star: `<polygon points="200,70 220,150 305,150 238,200 260,285 200,235 140,285 162,200 95,150 180,150" fill="none" stroke="${primaryColor}" stroke-width="8" opacity="0.30"/>`,
    gear: `<circle cx="200" cy="180" r="55" fill="none" stroke="${primaryColor}" stroke-width="10" opacity="0.35"/><circle cx="200" cy="180" r="25" fill="${primaryColor}" opacity="0.25"/><line x1="200" y1="110" x2="200" y2="140" stroke="${primaryColor}" stroke-width="10" stroke-linecap="round" opacity="0.30"/><line x1="200" y1="220" x2="200" y2="250" stroke="${primaryColor}" stroke-width="10" stroke-linecap="round" opacity="0.30"/><line x1="130" y1="180" x2="160" y2="180" stroke="${primaryColor}" stroke-width="10" stroke-linecap="round" opacity="0.30"/><line x1="240" y1="180" x2="270" y2="180" stroke="${primaryColor}" stroke-width="10" stroke-linecap="round" opacity="0.30"/>`,
    wave: `<path d="M100 180 Q150 120 200 180 Q250 240 300 180" fill="none" stroke="${primaryColor}" stroke-width="10" stroke-linecap="round" opacity="0.35"/><path d="M100 220 Q150 160 200 220 Q250 280 300 220" fill="none" stroke="${primaryColor}" stroke-width="8" stroke-linecap="round" opacity="0.20"/>`,
    arrow: `<path d="M200 80 L280 180 L240 180 L240 300 L160 300 L160 180 L120 180 Z" fill="none" stroke="${primaryColor}" stroke-width="10" opacity="0.35"/>`,
    flame: `<path d="M200 70 Q260 140 240 210 Q280 170 260 260 Q240 310 200 320 Q160 310 140 260 Q120 170 160 210 Q140 140 200 70Z" fill="none" stroke="${primaryColor}" stroke-width="8" opacity="0.35"/>`,
  };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="bg_${initials}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${accentColor}" />
      <stop offset="100%" stop-color="#0a0c10" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" rx="60" fill="url(#bg_${initials})"/>
  ${iconPaths[iconShape] || iconPaths.diamond}
  <text x="200" y="210" font-family="'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif" font-size="90" font-weight="900" fill="${primaryColor}" text-anchor="middle" dominant-baseline="middle" letter-spacing="2">${initials}</text>
  <text x="200" y="355" font-family="'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif" font-size="${displayName.length > 12 ? 22 : 28}" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="3" opacity="0.90">${displayName}</text>
</svg>`;

  return createSvgDataUrl(svg);
}

// ──────────────────────────────────────────────────
// Pre-generated Logo Data-URLs for all 38 Demo Sponsors
// ──────────────────────────────────────────────────

export const SPONSOR_LOGOS: Record<string, string> = {
  // --- HOOD (7) ---
  'sp-hood-1': generateBrandSvgLogo('Red Bull Racing', '#d5001c', '#1a0508', 'bolt'),
  'sp-hood-2': generateBrandSvgLogo('Shopify', '#96bf48', '#0c1a05', 'diamond'),
  'sp-hood-3': generateBrandSvgLogo('Mercado Libre', '#ffe600', '#1a1800', 'star'),
  'sp-hood-4': generateBrandSvgLogo('Kavak', '#00c8ff', '#001a22', 'hexagon'),
  'sp-hood-5': generateBrandSvgLogo('Bitso Crypto', '#1da1f2', '#021528', 'shield'),
  'sp-hood-6': generateBrandSvgLogo('Nu México', '#820ad1', '#10013a', 'circle'),
  'sp-hood-7': generateBrandSvgLogo('Clip Pagos', '#ff6b35', '#1a0a02', 'flame'),

  // --- ROOF (7) ---
  'sp-roof-1': generateBrandSvgLogo('Spotify', '#1db954', '#021a0c', 'wave'),
  'sp-roof-2': generateBrandSvgLogo('Monster Energy', '#b5d334', '#141a02', 'flame'),
  'sp-roof-3': generateBrandSvgLogo('Discord', '#5865f2', '#0a0c28', 'circle'),
  'sp-roof-4': generateBrandSvgLogo('GitHub', '#f0f6fc', '#0d1117', 'gear'),
  'sp-roof-5': generateBrandSvgLogo('Figma', '#a259ff', '#14082a', 'diamond'),
  'sp-roof-6': generateBrandSvgLogo('Stripe', '#635bff', '#0c0a28', 'bolt'),
  'sp-roof-7': generateBrandSvgLogo('Notion', '#ffffff', '#191919', 'hexagon'),

  // --- LEFT DOOR (7) ---
  'sp-door-l1': generateBrandSvgLogo('TAG Heuer', '#d4af37', '#1a1508', 'shield'),
  'sp-door-l2': generateBrandSvgLogo('Michelin', '#ffd100', '#1a1700', 'circle'),
  'sp-door-l3': generateBrandSvgLogo('Mobil 1', '#ff0000', '#1a0202', 'arrow'),
  'sp-door-l4': generateBrandSvgLogo('Bose Audio', '#ffffff', '#111111', 'wave'),
  'sp-door-l5': generateBrandSvgLogo('Brembo', '#d5001c', '#1a0205', 'gear'),
  'sp-door-l6': generateBrandSvgLogo('BBS Motorsport', '#c8b048', '#1a1608', 'star'),
  'sp-door-l7': generateBrandSvgLogo('Recaro', '#e30613', '#1a0103', 'shield'),

  // --- RIGHT DOOR (7) ---
  'sp-door-r1': generateBrandSvgLogo('Rolex', '#006039', '#001a0f', 'diamond'),
  'sp-door-r2': generateBrandSvgLogo('Pirelli', '#ffd100', '#1a1700', 'hexagon'),
  'sp-door-r3': generateBrandSvgLogo('Castrol Edge', '#009639', '#001a0a', 'bolt'),
  'sp-door-r4': generateBrandSvgLogo('Oakley', '#e10600', '#1a0100', 'shield'),
  'sp-door-r5': generateBrandSvgLogo('Akrapovič', '#00b4d8', '#011a22', 'flame'),
  'sp-door-r6': generateBrandSvgLogo('HRE Wheels', '#c0c0c0', '#141414', 'gear'),
  'sp-door-r7': generateBrandSvgLogo('Sparco', '#0055a4', '#010d1a', 'star'),

  // --- REAR (7) ---
  'sp-rear-1': generateBrandSvgLogo('Porsche Club MX', '#d5001c', '#1a0205', 'shield'),
  'sp-rear-2': generateBrandSvgLogo('Nürburgring', '#00a651', '#001a0b', 'circle'),
  'sp-rear-3': generateBrandSvgLogo('GoPro', '#00aeef', '#001a28', 'diamond'),
  'sp-rear-4': generateBrandSvgLogo('Bilstein', '#fdd835', '#1a1700', 'arrow'),
  'sp-rear-5': generateBrandSvgLogo('KW Automotive', '#ff5722', '#1a0802', 'hexagon'),
  'sp-rear-6': generateBrandSvgLogo('Borla', '#b71c1c', '#1a0303', 'wave'),
  'sp-rear-7': generateBrandSvgLogo('Remus', '#e0e0e0', '#1a1a1a', 'bolt'),

  // --- FRONT BUMPER (3) ---
  'sp-front-1': generateBrandSvgLogo('Bell Helmets', '#d50000', '#1a0000', 'shield'),
  'sp-front-2': generateBrandSvgLogo('Alpinestars', '#ffffff', '#0f0f0f', 'star'),
  'sp-front-3': generateBrandSvgLogo('OMP Racing', '#0066cc', '#010f1a', 'flame'),
};

/**
 * Generates a dynamic fallback logo SVG data-URL for users who don't upload a logo.
 * Used instead of external Unsplash URLs to avoid CORS issues.
 */
export function generateFallbackLogo(name: string): string {
  return generateBrandSvgLogo(
    name || 'TU LOGO',
    '#00e5ff',
    '#0a0d14',
    'diamond'
  );
}
