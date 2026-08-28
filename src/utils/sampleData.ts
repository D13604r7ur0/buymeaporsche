import type { Sponsor, ZoneConfig, TrackEvent, SizeComparison } from '../types/sponsor';


export const CAMPAIGN_GOAL_MXN = 3000000; // $3,000,000 MXN
export const CONTRACT_YEARS = 2;
export const CONTRACT_DAYS = 730; // 365 * 2
export const TOTAL_AVAILABLE_CM2 = 120000; // 120,000 cm² disponibles en la carrocería (12 m²)

export const ZONES: ZoneConfig[] = [
  {
    id: 'rear_decklid',
    name: 'Tapa de Motor & Fascia Trasera (VIP)',
    shortName: 'Tapa Trasera',
    description: 'La zona trasera de máxima exposición en tomas de persecución, eventos y exhibiciones.',
    pricePerCm2: 40,
    defaultPosition: [0, 0.82, -1.82],
    defaultRotation: [-1.67, 0, 0],
    defaultScale: [0.85, 0.25, 1],
    cameraPreset: {
      position: [0, 1.6, -3.2],
      target: [0, 0.7, -1.4],
    },
    highlightColor: '#fdd835',
    badgeText: 'MÁXIMO IMPACTO',
  },
  {
    id: 'hood_central',
    name: 'Cofre Aerodinámico Central',
    shortName: 'Cofre Central',
    description: 'Impacto frontal directo. Visible en todas las tomas frontales, videos y exhibiciones.',
    pricePerCm2: 35,
    defaultPosition: [0, 0.72, 1.25],
    defaultRotation: [-1.22, 0, 0],
    defaultScale: [0.70, 0.38, 1],
    cameraPreset: {
      position: [0, 1.6, 3.0],
      target: [0, 0.6, 1.0],
    },
    highlightColor: '#e00000',
    badgeText: 'FRONTAL ESTRELLA',
  },
  {
    id: 'premium_door',
    name: 'Puertas Laterales',
    shortName: 'Puertas Laterales',
    description: 'Gran formato lateral. El espacio clásico de los autos GT de competición para patrocinios principales.',
    pricePerCm2: 25,
    defaultPosition: [0.92, 0.62, 0.05],
    defaultRotation: [0, 1.57, 0],
    defaultScale: [0.75, 0.38, 1],
    cameraPreset: {
      position: [3.4, 1.0, 0.0],
      target: [0, 0.6, 0.0],
    },
    highlightColor: '#0070bb',
    badgeText: 'GRAN FORMATO',
  },
  {
    id: 'body_standard',
    name: 'Salpicaderas & Facias',
    shortName: 'Salpicaderas',
    description: 'Salpicaderas delanteras y traseras con visibilidad dinámica 360° en curvas.',
    pricePerCm2: 20,
    defaultPosition: [-0.88, 0.60, 1.15],
    defaultRotation: [-0.15, -1.45, 0],
    defaultScale: [0.50, 0.25, 1],
    cameraPreset: {
      position: [-2.6, 1.1, 1.8],
      target: [-0.4, 0.6, 0.6],
    },
    highlightColor: '#10b981',
    badgeText: 'ALTA VISIBILIDAD',
  },
  {
    id: 'showroom_floor',
    name: 'Podio Showroom Digital',
    shortName: 'Showroom Digital',
    description: 'Espacio publicitario en el entorno digital del showroom interactivo 3D.',
    pricePerCm2: 1,
    defaultPosition: [0, 0.02, 0],
    defaultRotation: [-1.57, 0, 0],
    defaultScale: [2.0, 3.5, 1],
    cameraPreset: {
      position: [3.6, 2.8, 3.6],
      target: [0, 0.5, 0],
    },
    highlightColor: '#8b5cf6',
    badgeText: 'ACCESIBLE 24/7',
  },
];


export const SIZE_COMPARISONS: SizeComparison[] = [
  {
    name: 'Micro Sticker (Tarjeta)',
    dimensions: '8.5 x 5.5 cm',
    cm2: 50,
    objectComparison: 'Tamaño Tarjeta de Crédito',
    dailyCostMxn: (50 * 10) / CONTRACT_DAYS, // ~$0.27 MXN/día
    totalMxn: 500,
    iconName: 'CreditCard',
  },
  {
    name: 'Badge Pro (Smartphone)',
    dimensions: '10 x 15 cm',
    cm2: 150,
    objectComparison: 'Tamaño iPhone Pro Max',
    dailyCostMxn: (150 * 15) / CONTRACT_DAYS, // ~$1.23 MXN/día
    totalMxn: 2250,
    iconName: 'Smartphone',
  },
  {
    name: 'Medium Banner (Tablet)',
    dimensions: '20 x 25 cm',
    cm2: 500,
    objectComparison: 'Tamaño iPad / Revista',
    dailyCostMxn: (500 * 15) / CONTRACT_DAYS, // ~$4.10 MXN/día
    totalMxn: 7500,
    iconName: 'Tablet',
  },
  {
    name: 'Mega Logo (Laptop)',
    dimensions: '35 x 30 cm',
    cm2: 1050,
    objectComparison: 'Tamaño Laptop 15" / Puerta',
    dailyCostMxn: (1050 * 20) / CONTRACT_DAYS, // ~$11.50 MXN/día
    totalMxn: 21000,
    iconName: 'Monitor',
  },
  {
    name: 'Title Sponsor (Trasera Completa)',
    dimensions: '140 x 25 cm',
    cm2: 3500,
    objectComparison: 'Envergadura total trasera del Porsche 911',
    dailyCostMxn: (3500 * 25) / CONTRACT_DAYS, // ~$47.94 MXN/día
    totalMxn: 87500,
    iconName: 'Trophy',
  },
];

export const TRACK_EVENTS_ROADMAP: TrackEvent[] = [
  {
    id: 'track-1',
    title: 'Gran Lanzamiento & Vinilado Oficial en Vivo',
    location: 'Porsche Center CDMX / Santa Fe',
    trackName: 'Exhibición Inaugural',
    date: 'Día 1 de Entrega',
    yearSpan: 'Año 1 - 2026',
    estimatedReach: '500,000+ Vistas digitales & invitados VIP',
    type: 'Exhibición VIP',
    description: 'Sesión de rotulación en vivo con vinil automotriz de alta resistencia de todos los patrocinadores, unboxing oficial del 911 (992) y cobertura mediática.',
  },
  {
    id: 'track-2',
    title: 'Car Meets & Expos de Superautos Exclusivos',
    location: 'Valle de Bravo, Cancún, Zapopan, San Pedro Garza García, CDMX',
    trackName: 'Country Clubs, Plazas de Lujo & Caravanas',
    date: 'Mensual durante 2 años',
    yearSpan: '24 Car Meets en 2 años',
    estimatedReach: 'Comunidad de alto poder adquisitivo, directores y entusiastas',
    type: 'Car Meet & Expo',
    description: 'Presencia continua en las reuniones de superdeportivos más exclusivas de México con material fotográfico y video profesional para los patrocinadores.',
  },
  {
    id: 'track-3',
    title: 'Track Days & Gira en Autódromos (F1)',
    location: 'CDMX (Hermanos Rodríguez), Monterrey, San Luis Potosí',
    trackName: 'Autódromo Hermanos Rodríguez, Tangamanga & Monterrey',
    date: 'Temporadas de Pista',
    yearSpan: '2 Años de Gira Oficial',
    estimatedReach: '60,000+ Aficionados presenciales en pits y gradas + Cobertura nacional',
    type: 'Track Day Time Attack',
    description: 'Vueltas rápidas en circuitos profesionales. Los logos en cofre, puertas, techo y parte trasera serán capturados en cámaras de alta velocidad y tomas on-board.',
  },
];

export const INITIAL_SPONSORS: Sponsor[] = [];

