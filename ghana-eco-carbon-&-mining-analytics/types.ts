
// Index signatures added to satisfy Recharts data input requirements
export interface LossTrendData {
  [key: string]: number;
  year: number;
  loss: number;
  carbon: number;
}

export interface CarbonData {
  [key: string]: string | number;
  month: string;
  emissions: number;
}

export interface LandCoverData {
  [key: string]: string | number;
  name: string;
  value: number;
  color: string;
}

export interface MiningAlert {
  id: string;
  lat: number;
  lng: number;
  intensity: 'low' | 'medium' | 'high';
  date: string;
}

export interface RegionStats {
  treeLossHa: number;
  carbonEmissions: number;
  activeMiningSites: number;
  forestCoverage: number;
}