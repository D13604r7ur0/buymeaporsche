import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { Sponsor, ZoneConfig } from '../types/sponsor';
import { INITIAL_SPONSORS, SOLD_OUT_SPONSORS, CAMPAIGN_GOAL_MXN, CONTRACT_YEARS, CONTRACT_DAYS, TOTAL_AVAILABLE_CM2, ZONES } from '../utils/sampleData';
import confetti from 'canvas-confetti';


export type CameraPresetName = 'overview' | 'hood' | 'wing' | 'door_right' | 'door_left' | 'front' | 'top';

export interface CarCustomization {
  bodyColor: string;
  bodyColorName: string;
  wheelColor: string;
  wheelColorName: string;
  liveryStyle: 'weissach' | 'clean' | 'gt3rs_side_stripes';
  daytimeLights: boolean;
}

export const PORSCHE_COLORS = [
  { name: 'Carrara White Metallic', hex: '#f7f8fa', textColor: 'text-neutral-900' },
  { name: 'GT Silver Metallic', hex: '#b5b8bd', textColor: 'text-slate-300' },
  { name: 'Arctic Grey', hex: '#5b6571', textColor: 'text-slate-400' },
  { name: 'Guards Red', hex: '#df1111', textColor: 'text-red-500' },
  { name: 'Shark Blue', hex: '#0070bb', textColor: 'text-blue-400' },
  { name: 'Racing Yellow', hex: '#fdd835', textColor: 'text-yellow-400' },
  { name: 'Jet Black Metallic', hex: '#121316', textColor: 'text-neutral-400' },
];


export const WHEEL_COLORS = [
  { name: 'Satin Pyro Red (RS)', hex: '#c51d24' },
  { name: 'Satin Neodyme (Oro)', hex: '#cbb67c' },
  { name: 'Satin Darksilver', hex: '#63666a' },
  { name: 'Satin Black', hex: '#1c1c1e' },
];

interface SponsorContextType {
  sponsors: Sponsor[];
  selectedSponsor: Sponsor | null;
  setSelectedSponsor: (sponsor: Sponsor | null) => void;
  hoveredSponsor: Sponsor | null;
  setHoveredSponsor: (sponsor: Sponsor | null) => void;
  
  // Customization & 3D state
  carConfig: CarCustomization;
  setCarConfig: React.Dispatch<React.SetStateAction<CarCustomization>>;
  cameraPreset: CameraPresetName;
  setCameraPreset: (preset: CameraPresetName) => void;
  focusedSponsorId: string | null;
  focusSponsor: (sponsorId: string) => void;
  
  // Placement & Purchase mode
  isBuyModalOpen: boolean;
  setIsBuyModalOpen: (open: boolean) => void;
  isPlacementMode: boolean;
  setIsPlacementMode: (active: boolean) => void;
  draftSponsor: Partial<Sponsor> | null;
  setDraftSponsor: React.Dispatch<React.SetStateAction<Partial<Sponsor> | null>>;
  
  // Filters & Directory
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedTierFilter: string;
  setSelectedTierFilter: (tier: string) => void;
  filteredSponsors: Sponsor[];
  
  // Actions & Demo Test
  addSponsor: (newSponsorData: Omit<Sponsor, 'id' | 'createdAt' | 'expiryDate' | 'viewsCount' | 'clicksCount' | 'certificateId'>) => Sponsor;
  recordClick: (sponsorId: string) => void;
  recordView: (sponsorId: string) => void;
  loadSoldOutDemo: () => void;
  resetToEmpty: () => void;
  
  // Stats
  totalRaisedMxn: number;
  goalProgressPercentage: number;
  totalAreaSoldCm2: number;
  totalAvailableCm2: number;
  remainingAreaCm2: number;
  areaSoldPercentage: number;
  sponsorsCount: number;
  goalMxn: number;
  contractDays: number;
  contractYears: number;
  zones: ZoneConfig[];
  
  // Certificate view
  certificateSponsor: Sponsor | null;
  setCertificateSponsor: (sponsor: Sponsor | null) => void;
}

const STORAGE_KEY = 'buymeaporsche_production_sponsors_v5';

const SponsorContext = createContext<SponsorContextType | undefined>(undefined);

export const SponsorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sponsors, setSponsors] = useState<Sponsor[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read sponsors from localStorage', e);
    }
    return INITIAL_SPONSORS;
  });

  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [hoveredSponsor, setHoveredSponsor] = useState<Sponsor | null>(null);
  const [focusedSponsorId, setFocusedSponsorId] = useState<string | null>(null);
  const [certificateSponsor, setCertificateSponsor] = useState<Sponsor | null>(null);

  const [cameraPreset, setCameraPreset] = useState<CameraPresetName>('overview');

  const [carConfig, setCarConfig] = useState<CarCustomization>({
    bodyColor: '#f7f8fa', // Carrara White Metallic by default
    bodyColorName: 'Carrara White Metallic',
    wheelColor: '#1c1c1e', // Satin Black
    wheelColorName: 'Satin Black',
    liveryStyle: 'weissach',
    daytimeLights: true,
  });

  // Purchase modal & draft state
  const [isBuyModalOpen, setIsBuyModalOpen] = useState<boolean>(false);
  const [isPlacementMode, setIsPlacementMode] = useState<boolean>(false);
  const [draftSponsor, setDraftSponsor] = useState<Partial<Sponsor> | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('all');

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sponsors));
    } catch (e) {
      console.error('Error saving sponsors to storage', e);
    }
  }, [sponsors]);

  // Statistics calculation
  const totalRaisedMxn = useMemo(() => {
    return sponsors.reduce((acc, s) => acc + s.totalPriceMxn, 0);
  }, [sponsors]);

  const totalAreaSoldCm2 = useMemo(() => {
    return sponsors.reduce((acc, s) => acc + s.areaCm2, 0);
  }, [sponsors]);

  const totalAvailableCm2 = TOTAL_AVAILABLE_CM2;
  const remainingAreaCm2 = Math.max(0, TOTAL_AVAILABLE_CM2 - totalAreaSoldCm2);
  const areaSoldPercentage = useMemo(() => {
    return Math.min(100, Number(((totalAreaSoldCm2 / TOTAL_AVAILABLE_CM2) * 100).toFixed(2)));
  }, [totalAreaSoldCm2]);

  const goalProgressPercentage = useMemo(() => {
    return Math.min(100, Number(((totalRaisedMxn / CAMPAIGN_GOAL_MXN) * 100).toFixed(2)));
  }, [totalRaisedMxn]);

  // Filtered sponsors
  const filteredSponsors = useMemo(() => {
    return sponsors.filter((s) => {
      const matchesSearch = 
        s.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.slogan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.zoneName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
      const matchesTier = selectedTierFilter === 'all' || s.tier === selectedTierFilter;

      return matchesSearch && matchesCategory && matchesTier;
    });
  }, [sponsors, searchQuery, selectedCategory, selectedTierFilter]);

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#df1111', '#fdd835', '#ffffff', '#0070bb'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 350);
    } catch (e) {
      console.warn('Confetti error', e);
    }
  };

  const addSponsor = (
    newSponsorData: Omit<Sponsor, 'id' | 'createdAt' | 'expiryDate' | 'viewsCount' | 'clicksCount' | 'certificateId'>
  ): Sponsor => {
    const id = `sp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const expiry = new Date();
    expiry.setFullYear(now.getFullYear() + CONTRACT_YEARS);

    const certificateId = `P992-${newSponsorData.tier.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newSponsor: Sponsor = {
      ...newSponsorData,
      id,
      createdAt: now.toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0],
      contractYears: CONTRACT_YEARS,
      viewsCount: 1,
      clicksCount: 0,
      certificateId,
    };

    setSponsors((prev) => [newSponsor, ...prev]);
    triggerCelebration();
    
    // Smoothly focus camera on new decal
    setFocusedSponsorId(newSponsor.id);
    if (newSponsor.tier === 'rear_decklid' || newSponsor.tier === 'vip_wing') {
      setCameraPreset('wing');
    } else if (newSponsor.tier === 'hood_central') {
      setCameraPreset('hood');
    } else if (newSponsor.position3D[0] > 0.3) {
      setCameraPreset('door_right');
    } else if (newSponsor.position3D[0] < -0.3) {
      setCameraPreset('door_left');
    } else {
      setCameraPreset('overview');
    }

    return newSponsor;
  };

  const focusSponsor = (sponsorId: string) => {
    const found = sponsors.find((s) => s.id === sponsorId);
    setFocusedSponsorId(sponsorId);
    if (found) {
      setSelectedSponsor(found);
      if (found.tier === 'rear_decklid' || found.tier === 'vip_wing') {
        setCameraPreset('wing');
      } else if (found.tier === 'hood_central') {
        setCameraPreset('hood');
      } else if (found.position3D[0] > 0.3) {
        setCameraPreset('door_right');
      } else if (found.position3D[0] < -0.3) {
        setCameraPreset('door_left');
      } else {
        setCameraPreset('overview');
      }
    }
  };

  const recordClick = (sponsorId: string) => {
    setSponsors((prev) =>
      prev.map((s) => (s.id === sponsorId ? { ...s, clicksCount: s.clicksCount + 1 } : s))
    );
  };

  const recordView = (sponsorId: string) => {
    setSponsors((prev) =>
      prev.map((s) => (s.id === sponsorId ? { ...s, viewsCount: s.viewsCount + 1 } : s))
    );
  };

  const loadSoldOutDemo = () => {
    setSponsors(SOLD_OUT_SPONSORS);
    triggerCelebration();
  };

  const resetToEmpty = () => {
    setSponsors([]);
    setSelectedSponsor(null);
    setFocusedSponsorId(null);
  };

  return (
    <SponsorContext.Provider
      value={{
        sponsors,
        selectedSponsor,
        setSelectedSponsor,
        hoveredSponsor,
        setHoveredSponsor,
        carConfig,
        setCarConfig,
        cameraPreset,
        setCameraPreset,
        focusedSponsorId,
        focusSponsor,
        isBuyModalOpen,
        setIsBuyModalOpen,
        isPlacementMode,
        setIsPlacementMode,
        draftSponsor,
        setDraftSponsor,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedTierFilter,
        setSelectedTierFilter,
        filteredSponsors,
        addSponsor,
        recordClick,
        recordView,
        loadSoldOutDemo,
        resetToEmpty,
        totalRaisedMxn,
        goalProgressPercentage,
        totalAreaSoldCm2,
        totalAvailableCm2,
        remainingAreaCm2,
        areaSoldPercentage,
        sponsorsCount: sponsors.length,
        goalMxn: CAMPAIGN_GOAL_MXN,
        contractDays: CONTRACT_DAYS,
        contractYears: CONTRACT_YEARS,
        zones: ZONES,
        certificateSponsor,
        setCertificateSponsor,
      }}
    >
      {children}
    </SponsorContext.Provider>
  );
};

export const useSponsors = () => {
  const context = useContext(SponsorContext);
  if (!context) {
    throw new Error('useSponsors must be used within a SponsorProvider');
  }
  return context;
};
