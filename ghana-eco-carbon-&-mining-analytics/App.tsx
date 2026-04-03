import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Minus, 
  Search, 
  Settings, 
  Info, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  ShieldCheck,
  History,
  Map as MapIcon,
  BarChart3,
  Filter,
  Book,
  Check
} from 'lucide-react';
import MainMap from './components/MainMap';
import { GlassPanel } from './components/GlassPanel';
import { KPI } from './components/KPI';
import { SunburstChart } from './components/SunburstChart';
import { LegendPanel } from './components/LegendPanel';
import { LayerSelector } from './components/LayerSelector';

const BASEMAPS = [
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
  },
  {
    id: 'dark',
    name: 'Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OSM &copy; CARTO'
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  }
];

const LAYER_OPTIONS = [
  { id: 'mining', label: 'Mining Anomalies' },
  { id: 'forest', label: 'Forest Canopy' },
  { id: 'water', label: 'River Basins' },
  { id: 'admin', label: 'Administrative' }
];

const REGIONS = ['Ashanti', 'Western', 'Eastern'];
const DISTRICTS = ['Kumasi Metro', 'Obuasi Municipal', 'Atwima'];

const App: React.FC = () => {
  const [selectedLayers, setSelectedLayers] = useState<string[]>(['mining', 'forest']);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  
  const [currentYear, setCurrentYear] = useState(2024);
  const [showHistory, setShowHistory] = useState(false);
  const [activeBasemap, setActiveBasemap] = useState(BASEMAPS[0]);
  const [showBasemapSelector, setShowBasemapSelector] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);
  const [selectedDistrict, setSelectedDistrict] = useState(DISTRICTS[0]);

  const showMining = selectedLayers.includes('mining');
  const showForest = selectedLayers.includes('forest');

  const kpiData = useMemo(() => {
    const seed = selectedRegion.length + selectedDistrict.length;
    return {
      treeLoss: (12.42 + (seed % 5)).toFixed(2),
      carbon: (4.18 - (seed % 2) * 0.1).toFixed(2)
    };
  }, [selectedRegion, selectedDistrict]);

  const toggleLayer = (id: string) => {
    setSelectedLayers(prev => 
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  return (
    <div className="relative h-screen w-screen bg-[#052e16] overflow-hidden text-white selection:bg-amber-500/30">
      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
        <MainMap 
          showMining={showMining} 
          showForest={showForest} 
          currentYear={currentYear} 
          basemapUrl={activeBasemap.url} 
          attribution={activeBasemap.attribution}
        />
      </div>

      {/* Floating Header */}
      <header className="absolute top-0 left-0 right-0 z-40 h-16 bg-[#052e16]/95 backdrop-blur-md border-b border-amber-500/30 flex items-center justify-between px-6 pointer-events-auto shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="bg-amber-500 p-2 rounded shadow-lg shadow-amber-500/30 ring-1 ring-amber-400/50">
            <ShieldCheck className="text-[#052e16] w-6 h-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-white text-lg font-extrabold tracking-tighter uppercase leading-none">
                EcoPulse <span className="text-amber-400">Ghana</span>
              </h1>
              <span className="text-[9px] px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-400 font-bold uppercase tracking-tighter">Official Portal</span>
            </div>
            <p className="text-amber-100/70 text-[10px] font-bold tracking-[0.2em] uppercase mt-1">
              National Environmental Agency • Monitoring System
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="hidden md:flex items-center bg-green-900/40 border border-amber-500/20 rounded px-3 py-1.5 gap-3 shadow-inner">
            <Search className="w-4 h-4 text-amber-400" />
            <input 
              type="text" 
              placeholder="Coordinates / District..." 
              className="bg-transparent border-none outline-none text-xs text-white placeholder:text-amber-100/30 w-40 font-medium"
            />
          </div>
          <div className="flex gap-1">
            <button className="p-2 text-amber-100 hover:text-amber-400 transition-colors border border-transparent hover:border-amber-500/20 rounded">
              <Settings className="w-4 h-4" />
            </button>
            <button className="p-2 text-amber-100 hover:text-amber-400 transition-colors border border-transparent hover:border-amber-500/20 rounded">
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* LEFT PANEL: Inputs (Filters + Layers) */}
      <div 
        className={`absolute top-16 left-0 bottom-0 z-30 w-80 bg-[#052e16]/90 backdrop-blur-lg border-r border-yellow-500/20 transition-all duration-500 ease-[cubic-bezier(0.4, 0, 0.2, 1)] flex flex-col ${
          isLeftCollapsed ? '-translate-x-full shadow-none' : 'translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.6)]'
        }`}
      >
        <div className="flex-1 p-5 overflow-y-auto space-y-7 custom-scrollbar">
          <div className="flex justify-between items-center">
            <h2 className="text-amber-400 text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2">
              <Filter size={14} className="fill-amber-400" /> Analysis Inputs
            </h2>
            <button onClick={() => setIsLeftCollapsed(true)} className="p-1.5 hover:bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
              <ChevronLeft size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-amber-100/40 uppercase tracking-widest pl-1">Target Region</label>
              <select 
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full bg-green-900/40 border border-amber-500/20 rounded px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-500/60 appearance-none cursor-pointer"
              >
                {REGIONS.map(r => <option key={r} value={r} className="bg-[#052e16]">{r}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-amber-100/40 uppercase tracking-widest pl-1">District Focus</label>
              <select 
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-green-900/40 border border-amber-500/20 rounded px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-500/60 appearance-none cursor-pointer"
              >
                {DISTRICTS.map(d => <option key={d} value={d} className="bg-[#052e16]">{d}</option>)}
              </select>
            </div>
          </div>

          <div className="h-px bg-amber-500/10" />

          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-amber-100/40 uppercase tracking-widest pl-1">Data Layers</h3>
            <LayerSelector 
              options={LAYER_OPTIONS} 
              selectedIds={selectedLayers} 
              onChange={toggleLayer} 
            />
          </div>

          <div className="pt-4">
            <button 
              onClick={() => setIsLegendOpen(!isLegendOpen)}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-md border text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg ${
                isLegendOpen ? 'bg-amber-500 text-[#052e16] border-amber-500' : 'bg-transparent border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <Book size={16} /> {isLegendOpen ? 'Hide Legend' : 'Show Legend'}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Outputs (KPIs + Analytics) */}
      <div 
        className={`absolute top-16 right-0 bottom-0 z-30 w-80 bg-[#052e16]/90 backdrop-blur-lg border-l border-yellow-500/20 transition-all duration-500 ease-[cubic-bezier(0.4, 0, 0.2, 1)] flex flex-col ${
          isRightCollapsed ? 'translate-x-full shadow-none' : 'translate-x-0 shadow-[-20px_0_50px_rgba(0,0,0,0.6)]'
        }`}
      >
        <div className="flex-1 p-5 overflow-y-auto space-y-8 custom-scrollbar">
          <div className="flex justify-between items-center">
            <button onClick={() => setIsRightCollapsed(true)} className="p-1.5 hover:bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
              <ChevronRight size={18} />
            </button>
            <h2 className="text-amber-400 text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2">
              Regional Output <BarChart3 size={14} />
            </h2>
          </div>

          <div className="space-y-3 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 gap-3">
              <KPI label="Tree Loss (YTD)" value={kpiData.treeLoss} unit="k Ha" colorClass="text-white" />
              <KPI label="Carbon Stock" value={kpiData.carbon} unit="M tCO2e" colorClass="text-amber-400" />
            </div>
          </div>

          <div className="h-px bg-amber-500/10" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-amber-100/40 uppercase tracking-widest flex items-center gap-2">
                Land Composition
              </span>
              <span className="text-[9px] font-bold text-amber-400/80 uppercase tracking-tighter">Live Sensor Feed</span>
            </div>
            <SunburstChart />
          </div>
        </div>

        <div className="p-4 bg-amber-500/5 border-t border-amber-500/10 flex justify-between items-center">
          <span className="text-[8px] font-black text-amber-400/30 uppercase tracking-widest">System Stable</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest">Network Active</span>
          </div>
        </div>
      </div>

      {/* Dynamic Legend Panel Positioning */}
      <LegendPanel 
        isOpen={isLegendOpen} 
        onClose={() => setIsLegendOpen(false)} 
        className={`absolute bottom-12 transition-all duration-500 ease-[cubic-bezier(0.4, 0, 0.2, 1)] ${
          isLeftCollapsed ? 'left-6' : 'left-[336px]'
        }`}
      />

      {/* Menu Reveal Buttons */}
      <button
        onClick={() => setIsLeftCollapsed(false)}
        className={`absolute top-20 left-4 z-30 p-3 bg-[#052e16]/95 border border-amber-500/40 text-amber-400 rounded shadow-2xl transition-all duration-300 ${
          isLeftCollapsed ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-20 opacity-0 pointer-events-none scale-90'
        }`}
      >
        <Menu size={20} />
      </button>

      <button
        onClick={() => setIsRightCollapsed(false)}
        className={`absolute top-20 right-4 z-30 p-3 bg-[#052e16]/95 border border-amber-500/40 text-amber-400 rounded shadow-2xl transition-all duration-300 ${
          isRightCollapsed ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-20 opacity-0 pointer-events-none scale-90'
        }`}
      >
        <BarChart3 size={20} />
      </button>

      {/* Basemap Selector Menu - Sliding UI */}
      {showBasemapSelector && (
        <div 
          className={`absolute bottom-12 z-40 transition-all duration-500 ease-[cubic-bezier(0.4, 0, 0.2, 1)] ${
            isRightCollapsed ? 'right-[70px]' : 'right-[400px]'
          }`}
        >
          <GlassPanel className="p-1 rounded-lg shadow-2xl border-amber-500/40 min-w-[120px] animate-in slide-in-from-right-4 duration-200">
            <div className="flex flex-col gap-1">
              {BASEMAPS.map((map) => (
                <button
                  key={map.id}
                  onClick={() => {
                    setActiveBasemap(map);
                    setShowBasemapSelector(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeBasemap.id === map.id 
                      ? 'bg-amber-500 text-[#052e16]' 
                      : 'text-amber-100/60 hover:text-amber-400 hover:bg-amber-500/10'
                  }`}
                >
                  {map.name}
                  {activeBasemap.id === map.id && <Check size={10} />}
                </button>
              ))}
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Dynamic Map Controls - Sliding Logic */}
      <div 
        className={`absolute bottom-12 z-30 flex flex-col gap-3 items-end transition-all duration-500 ease-[cubic-bezier(0.4, 0, 0.2, 1)] ${
          isRightCollapsed ? 'right-6' : 'right-[336px]'
        }`}
      >
        <GlassPanel className="flex flex-col gap-1 p-1 border-amber-500/30 rounded-lg shadow-2xl">
          <button className="p-2.5 text-amber-100 hover:text-white hover:bg-amber-500/20 transition-all rounded" title="Zoom In">
            <Plus size={18} />
          </button>
          <div className="h-px bg-amber-500/10 mx-2" />
          <button className="p-2.5 text-amber-100 hover:text-white hover:bg-amber-500/20 transition-all rounded" title="Zoom Out">
            <Minus size={18} />
          </button>
          <div className="h-px bg-amber-500/10 mx-2" />
          <button 
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) setShowBasemapSelector(false);
            }}
            className={`p-2.5 transition-all rounded ${showHistory ? 'text-amber-400 bg-amber-500/20' : 'text-amber-100 hover:text-white hover:bg-amber-500/20'}`} 
            title="History"
          >
            <History size={18} />
          </button>
          <div className="h-px bg-amber-500/10 mx-2" />
          <button 
            onClick={() => {
              setShowBasemapSelector(!showBasemapSelector);
              if (!showBasemapSelector) setShowHistory(false);
            }}
            className={`p-2.5 transition-all rounded ${showBasemapSelector ? 'text-amber-400 bg-amber-500/20' : 'text-amber-100 hover:text-white hover:bg-amber-500/20'}`} 
            title="Basemaps"
          >
            <MapIcon size={18} />
          </button>
        </GlassPanel>
      </div>

      {/* Time Slider logic */}
      {showHistory && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 w-[420px] animate-in slide-in-from-bottom-4 duration-300">
          <GlassPanel className="p-4 border-amber-500/40 rounded-lg shadow-2xl flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Historical Telemetry</span>
              <span className="text-xl font-black text-amber-400 tabular-nums tracking-tighter">{currentYear}</span>
            </div>
            <input 
              type="range" min="2015" max="2024" step="1"
              value={currentYear} onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              className="w-full h-1.5 bg-green-900/50 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </GlassPanel>
        </div>
      )}
    </div>
  );
};

export default App;