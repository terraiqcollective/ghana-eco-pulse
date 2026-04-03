
import { LossTrendData, MiningAlert, CarbonData, LandCoverData } from '../types';

export const GHANA_CENTER: [number, number] = [6.6666, -1.6163]; // Focused on Kumasi/Ashanti Region

export const LOSS_TREND_DATA: LossTrendData[] = [
  { year: 2018, loss: 1200, carbon: 350 },
  { year: 2019, loss: 2400, carbon: 520 },
  { year: 2020, loss: 1800, carbon: 410 },
  { year: 2021, loss: 3100, carbon: 780 },
  { year: 2022, loss: 4200, carbon: 1100 },
  { year: 2023, loss: 3800, carbon: 980 },
  { year: 2024, loss: 5100, carbon: 1450 },
];

export const CARBON_EMISSIONS_DATA: CarbonData[] = [
  { month: 'Jan', emissions: 45 },
  { month: 'Feb', emissions: 52 },
  { month: 'Mar', emissions: 48 },
  { month: 'Apr', emissions: 61 },
  { month: 'May', emissions: 55 },
  { month: 'Jun', emissions: 67 },
];

// Added missing LAND_COVER_DATA to fix import error in components/AnalyticsCharts.tsx
export const LAND_COVER_DATA: LandCoverData[] = [
  { name: 'Primary Forest', value: 45, color: '#047857' },
  { name: 'Degraded Forest', value: 25, color: '#34d399' },
  { name: 'Mining Buffer', value: 15, color: '#f87171' },
  { name: 'Water Bodies', value: 10, color: '#60a5fa' },
  { name: 'Settlement', value: 5, color: '#fbbf24' },
];

// Data for the inner ring of the Sunburst (Parent categories)
export const SUNBURST_PARENT_DATA = [
  { name: 'Forest', value: 60, color: '#10b981' }, // emerald-500
  { name: 'Mining', value: 30, color: '#f87171' }, // red-400
  { name: 'Water', value: 10, color: '#60a5fa' }, // blue-400
];

// Data for the outer ring of the Sunburst (Child categories)
export const SUNBURST_CHILD_DATA = [
  { name: 'Primary Forest', value: 40, color: '#047857' }, // emerald-700
  { name: 'Degraded Forest', value: 20, color: '#34d399' }, // emerald-400
  { name: 'Industrial Mining', value: 10, color: '#b91c1c' }, // red-700
  { name: 'Artisanal Mining', value: 20, color: '#fbbf24' }, // amber-400
  { name: 'River', value: 6, color: '#1d4ed8' }, // blue-700
  { name: 'Lake', value: 4, color: '#93c5fd' }, // blue-300
];

export const MINING_ALERTS: MiningAlert[] = [
  { id: '1', lat: 6.5, lng: -2.1, intensity: 'high', date: '2024-05-12' },
  { id: '2', lat: 6.3, lng: -1.8, intensity: 'medium', date: '2024-05-14' },
  { id: '3', lat: 6.8, lng: -1.5, intensity: 'high', date: '2024-05-15' },
  { id: '4', lat: 6.2, lng: -2.0, intensity: 'low', date: '2024-05-16' },
  { id: '5', lat: 6.7, lng: -1.9, intensity: 'medium', date: '2024-05-17' },
];

export const FOREST_POLYGONS = [
  {
    id: 'f1',
    name: 'Bia Tano Forest Reserve',
    coords: [
      [6.9, -2.5], [7.1, -2.5], [7.1, -2.2], [6.9, -2.2]
    ] as [number, number][]
  },
  {
    id: 'f2',
    name: 'Atewa Range',
    coords: [
      [6.2, -0.6], [6.4, -0.6], [6.4, -0.4], [6.2, -0.4]
    ] as [number, number][]
  }
];
