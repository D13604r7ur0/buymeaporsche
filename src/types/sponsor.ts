export type SponsorTier = 'rear_decklid' | 'vip_wing' | 'premium_door' | 'hood_central' | 'body_standard' | 'showroom_floor';

export type SponsorCategory = 
  | 'Tecnología & AI'
  | 'Finanzas & Cripto'
  | 'Moda & Lujo'
  | 'Motorsport & Tuning'
  | 'Gastronomía & Bebidas'
  | 'Fitness & Deporte'
  | 'Startups & Software'
  | 'Agencias & Medios'
  | 'Otro';

export interface Sponsor {
  id: string;
  brandName: string;
  sponsorName?: string; // Nombre del patrocinador o persona
  slogan: string;
  logoUrl: string;
  targetUrl: string;
  email: string;
  category?: SponsorCategory;
  tier: SponsorTier;
  
  // Dimensions & Pricing
  widthCm: number;
  heightCm: number;
  areaCm2: number;
  pricePerCm2: number;
  totalPriceMxn: number;
  
  // 3D Positioning on the Porsche 911 (992)
  position3D: [number, number, number];
  rotation3D: [number, number, number];
  rotationAngle?: number; // 0 to 360 degrees
  scale3D: [number, number, number];
  zoneName: string;
  
  // Custom Live Sticker Studio properties
  stickerBgColor?: string;
  stickerTextColor?: string;
  stickerBorderColor?: string;
  stickerFont?: 'sans' | 'racing' | 'luxury' | 'mono';
  logoScale?: number;
  flipX?: boolean;
  flipY?: boolean;
  filterStyle?: 'original' | 'white' | 'black';
  opacity?: number;
  
  // Sponsorship contract details (2 years = 730 days)
  createdAt: string;
  contractYears: number; // 2
  expiryDate: string;
  
  // Physical exhibition perks
  includesPhysicalVinylWrap: boolean;
  includesTrackDaysExhibition: boolean;
  includesSocialMediaTags: boolean;
  vipTrackPassesCount: number;
  
  // Stats
  viewsCount: number;
  clicksCount: number;
  certificateId: string;
}

export interface ZoneConfig {
  id: SponsorTier;
  name: string;
  shortName: string;
  description: string;
  pricePerCm2: number; // in MXN
  defaultPosition: [number, number, number];
  defaultRotation: [number, number, number];
  defaultScale: [number, number, number];
  cameraPreset: {
    position: [number, number, number];
    target: [number, number, number];
  };
  highlightColor: string;
  badgeText: string;
}

export interface TrackEvent {
  id: string;
  title: string;
  location: string;
  trackName: string;
  date: string;
  yearSpan: string;
  estimatedReach: string;
  type: 'Track Day' | 'Car Meet' | 'Exhibición VIP' | 'Carrera Time Attack' | 'Gira Nacional' | 'Activación en tu Negocio' | 'Car Meet & Expo' | string;
  description: string;
}

export interface SizeComparison {
  name: string;
  dimensions: string;
  cm2: number;
  objectComparison: string;
  dailyCostMxn: number;
  totalMxn: number;
  iconName: string;
}
