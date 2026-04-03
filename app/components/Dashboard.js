"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
    Plus, Minus, History, Map as MapIcon, Menu,
    ChevronLeft, ChevronRight, BarChart3,
    Search, Settings, Info, ShieldCheck, X, Layers, Check, ChevronDown,
    Leaf, Tractor
} from 'lucide-react';

// Component imports
import { TopHeader } from './TopHeader';
import { GlassPanel } from './GlassPanel';
import { LegendPanel } from './LegendPanel';
import { KPI } from './KPI';
import { SunburstChart } from './SunburstChart';
import { LayerSelector } from './LayerSelector';
import { LossChart } from './LossChart';

// Dynamic import for Map
const MapComponent = dynamic(() => import('./Map'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-brand-deep flex items-center justify-center text-brand-gold">
        <div className="animate-pulse">Loading Map...</div>
    </div>
});

export default function Dashboard() {
    // Layout State
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
    const [isRightCollapsed, setIsRightCollapsed] = useState(false);
    const [isLegendOpen, setIsLegendOpen] = useState(false);

    // Map Controls State
    const [zoomCommand, setZoomCommand] = useState(null);
    const [basemap, setBasemap] = useState('dark');
    const [showBasemaps, setShowBasemaps] = useState(false);

    // Metadata & Filters (Existing logic preserved)
    const [years, setYears] = useState([]);
    const [regions, setRegions] = useState([]);
    const [districts, setDistricts] = useState([]);

    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');

    const [metrics, setMetrics] = useState({ carbonStock: 0, carbonLoss: 0, trend: [] });
    const [loading, setLoading] = useState(true);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [selectedLayers, setSelectedLayers] = useState(['carbon', 'mining']);

    const toggleLayer = (id) => {
        setSelectedLayers(prev =>
            prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
        );
    };

    // Dynamic Formatter for Metrics
    const formatMetric = (val) => {
        const num = parseFloat(val) || 0;
        if (num >= 1000000) return { value: (num / 1000000).toFixed(1), unit: 'M tonnes C' };
        if (num >= 1000) return { value: (num / 1000).toFixed(1), unit: 'k tonnes C' };
        return { value: num.toFixed(0), unit: 'tonnes C' };
    };

    // 1. Fetch Metadata on mount
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const response = await fetch('/api/gee/metadata');
                if (!response.ok) throw new Error('Failed to fetch metadata');

                const data = await response.json();
                setYears(data.years || []);
                setRegions(data.regions || []);

                if (data.years && data.years.length > 0) {
                    setSelectedYear(parseInt(data.years[data.years.length - 1]));
                }
            } catch (err) {
                console.error("Metadata fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMetadata();
    }, []);

    // 2. Fetch districts when region changes
    useEffect(() => {
        const fetchDistricts = async () => {
            if (!selectedRegion) {
                setDistricts([]);
                setSelectedDistrict('');
                return;
            }

            setLoadingDistricts(true);
            try {
                const response = await fetch('/api/gee/districts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ region: selectedRegion })
                });

                if (!response.ok) throw new Error('Failed to fetch districts');

                const data = await response.json();
                setDistricts(data.districts || []);
                setSelectedDistrict('');
            } catch (err) {
                console.error("Districts fetch error:", err);
                setDistricts([]);
            } finally {
                setLoadingDistricts(false);
            }
        };

        fetchDistricts();
    }, [selectedRegion]);

    // 3. Fetch Metrics when filters change
    useEffect(() => {
        if (!selectedYear) return;

        const fetchMetrics = async () => {
            try {
                const response = await fetch('/api/gee/metrics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        year: selectedYear,
                        region: selectedRegion,
                        district: selectedDistrict,
                        years: years
                    })
                });

                if (!response.ok) throw new Error('Failed to fetch metrics');

                const data = await response.json();
                setMetrics(data);
            } catch (err) {
                console.error("Metrics fetch error:", err);
            }
        };

        fetchMetrics();
    }, [selectedYear, selectedRegion, selectedDistrict, years]);

    // Auto-enable region layer when a region is selected
    useEffect(() => {
        if (selectedRegion && !selectedLayers.includes('region')) {
            setSelectedLayers(prev => [...prev, 'region']);
        }
    }, [selectedRegion]);

    // Sync district layer with selection
    useEffect(() => {
        if (selectedDistrict) {
            if (!selectedLayers.includes('district')) {
                setSelectedLayers(prev => [...prev, 'district']);
            }
        } else {
            // Auto-disable district layer when "All Districts" is selected
            if (selectedLayers.includes('district')) {
                setSelectedLayers(prev => prev.filter(l => l !== 'district'));
            }
        }
    }, [selectedDistrict]);

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-brand-deep text-brand-gold">
                <div className="text-center">
                    <div className="text-xl font-black uppercase tracking-widest mb-2 animate-pulse">Initializing Earth Engine...</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">National Monitoring System</div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-screen w-screen bg-brand-deep overflow-hidden text-white selection:bg-brand-gold/30">
            {/* Layer 0: Full Screen Map */}
            <div className="absolute inset-0 z-0 bg-brand-deep" style={{ height: '100vh', width: '100vw' }}>
                <MapComponent
                    year={selectedYear}
                    region={selectedRegion}
                    district={selectedDistrict}
                    activeLayers={selectedLayers}
                    zoomCommand={zoomCommand}
                    basemap={basemap}
                />
            </div>

            {/* Layer 40: Top Header */}
            <div className="absolute top-0 left-0 right-0 z-40" style={{ height: '64px' }}>
                <TopHeader />
            </div>

            {/* Layer 30: LEFT PANEL (Inputs) */}
            <div
                className={`absolute left-0 bottom-0 z-30 bg-brand-deep/90 backdrop-blur-lg border-r border-brand-gold/20 transition-all duration-500 ease-expo flex flex-col ${isLeftCollapsed ? '-translate-x-full shadow-none' : 'translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.6)]'
                    }`}
                style={{ top: '64px', width: '320px' }}
            >
                <div className="flex-1 p-5 overflow-y-auto space-y-7 custom-scrollbar flex flex-col">
                    <div className="flex justify-between items-center w-full">
                        <h2 className="text-brand-gold text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2">
                            Analysis Inputs
                        </h2>
                        <button onClick={() => setIsLeftCollapsed(true)} className="p-1.5 hover:bg-brand-gold/10 text-brand-gold border border-brand-gold/20 rounded transition-colors cursor-pointer">
                            <ChevronLeft size={18} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-brand-faded/40 uppercase tracking-widest pl-1">Target Region</label>
                            <select
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                className="w-full bg-brand-deep/40 border border-brand-gold/20 rounded px-3 py-2 text-xs font-bold text-white outline-none focus:border-brand-gold/60 appearance-none cursor-pointer h-10"
                            >
                                <option value="" className="bg-brand-deep">All Regions</option>
                                {regions.map(r => <option key={r} value={r} className="bg-brand-deep">{r}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-brand-faded/40 uppercase tracking-widest pl-1">District Focus</label>
                            <select
                                value={selectedDistrict}
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                                disabled={loadingDistricts}
                                className="w-full bg-brand-deep/40 border border-brand-gold/20 rounded px-3 py-2 text-xs font-bold text-white outline-none focus:border-brand-gold/60 appearance-none cursor-pointer h-10 disabled:opacity-50"
                            >
                                <option value="" className="bg-brand-deep">All Districts</option>
                                {districts.map(d => <option key={d} value={d} className="bg-brand-deep">{d}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-brand-faded/40 uppercase tracking-widest">Temporal Range</label>
                                <span className="text-[11px] font-black text-brand-gold tabular-nums tracking-widest">{selectedYear}</span>
                            </div>
                            <div className="px-1">
                                <input
                                    type="range"
                                    min={years[0] || 2015}
                                    max={years[years.length - 1] || 2024}
                                    step="1"
                                    value={selectedYear || 2024}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="year-slider cursor-pointer"
                                />
                                <div className="flex justify-between mt-1 px-0.5">
                                    <span className="text-[8px] font-bold text-brand-faded/30">{years[0] || 2015}</span>
                                    <span className="text-[8px] font-bold text-brand-faded/30">{years[years.length - 1] || 2024}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-brand-gold/10 w-full" />

                    <div className="flex flex-col gap-3">
                        <h3 className="text-[10px] font-black text-brand-faded/40 uppercase tracking-widest pl-1">Data Layers</h3>
                        <LayerSelector
                            options={[
                                { id: 'district', label: 'District' },
                                { id: 'region', label: 'Region' },
                                { id: 'mining', label: 'Carbon Loss' },
                                { id: 'carbon', label: 'Carbon Stock' }
                            ]}
                            selectedIds={selectedLayers}
                            onChange={toggleLayer}
                        />
                    </div>

                    <div className="pt-4 mt-auto">
                        <button
                            onClick={() => setIsLegendOpen(!isLegendOpen)}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-md border text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg cursor-pointer ${isLegendOpen ? 'bg-brand-gold text-brand-deep border-brand-gold' : 'bg-transparent border-brand-gold/40 text-brand-gold hover:bg-brand-gold/10'
                                }`}
                        >
                            {isLegendOpen ? 'Hide Legend' : 'Show Legend'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Layer 30: RIGHT PANEL (Outputs) */}
            <div
                className={`absolute right-0 bottom-0 z-30 bg-brand-deep/90 backdrop-blur-lg border-l border-brand-gold/20 transition-all duration-500 ease-expo flex flex-col ${isRightCollapsed ? 'translate-x-full shadow-none' : 'translate-x-0 shadow-[-20px_0_50px_rgba(0,0,0,0.6)]'
                    }`}
                style={{ top: '64px', width: '320px' }}
            >
                <div className="flex-1 p-5 overflow-y-auto space-y-8 custom-scrollbar flex flex-col">
                    <div className="flex justify-between items-center w-full">
                        <button onClick={() => setIsRightCollapsed(true)} className="p-1.5 hover:bg-brand-gold/10 text-brand-gold border border-brand-gold/20 rounded transition-colors cursor-pointer">
                            <ChevronRight size={18} />
                        </button>
                        <h2 className="text-brand-gold text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2">
                            Regional Output <BarChart3 size={14} />
                        </h2>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-1 gap-3">
                            <KPI
                                label="TOTAL CARBON STOCK"
                                value={formatMetric(metrics.carbonStock).value}
                                unit={formatMetric(metrics.carbonStock).unit}
                                colorClass="text-white"
                                trendValue={metrics.prevCarbonStock ? (((metrics.carbonStock - metrics.prevCarbonStock) / metrics.prevCarbonStock) * 100) : 0}
                                trendLabel="tonnes C"
                                icon={Leaf}
                            />
                            <KPI
                                label="CARBON LOSS FROM MINING"
                                value={formatMetric(metrics.carbonLoss).value}
                                unit={formatMetric(metrics.carbonLoss).unit}
                                colorClass="text-brand-gold"
                                trendValue={metrics.prevCarbonLoss ? (((metrics.carbonLoss - metrics.prevCarbonLoss) / metrics.prevCarbonLoss) * 100) : 0}
                                trendLabel="tonnes C"
                                invertColor={true}
                                icon={Tractor}
                            />
                        </div>
                    </div>

                    <div className="h-px bg-brand-gold/10 w-full" />

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-brand-faded/40 uppercase tracking-widest flex items-center gap-2">
                                Yearly Loss Trend
                            </span>
                        </div>
                        <LossChart data={metrics.trend} />
                    </div>
                </div>

                <div className="p-4 bg-brand-gold/5 border-t border-brand-gold/10 flex justify-between items-center mt-auto">
                    <span className="text-[8px] font-black text-brand-gold/30 uppercase tracking-widest">System Stable</span>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest">Network Active</span>
                    </div>
                </div>
            </div>

            {/* Menu Reveal Buttons */}
            <button
                onClick={() => setIsLeftCollapsed(false)}
                className={`absolute top-20 left-4 z-30 p-3 bg-brand-deep/95 border border-brand-gold/40 text-brand-gold rounded shadow-2xl transition-all duration-300 cursor-pointer ${isLeftCollapsed ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-20 opacity-0 pointer-events-none scale-90'
                    }`}
            >
                <Menu size={20} />
            </button>

            <button
                onClick={() => setIsRightCollapsed(false)}
                className={`absolute top-20 right-4 z-30 p-3 bg-brand-deep/95 border border-brand-gold/40 text-brand-gold rounded shadow-2xl transition-all duration-300 cursor-pointer ${isRightCollapsed ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-20 opacity-0 pointer-events-none scale-90'
                    }`}
            >
                <BarChart3 size={20} />
            </button>

            {/* Layer 50: Legend Panel */}
            <LegendPanel
                isOpen={isLegendOpen}
                onClose={() => setIsLegendOpen(false)}
                className={`absolute bottom-12 transition-all duration-500 ease-expo ${isLeftCollapsed ? 'left-6' : 'left-[336px]'
                    }`}
            />

            {/* Layer 30: Map Controls */}
            <div
                className={`absolute bottom-12 z-30 flex flex-col gap-3 items-end transition-all duration-500 ease-expo ${isRightCollapsed ? 'right-6' : 'right-[336px]'
                    }`}
            >
                {/* Basemap Selector Menu */}
                {showBasemaps && (
                    <div className="mb-2 animate-in fade-in slide-in-from-right-4 duration-300">
                        <GlassPanel className="flex flex-col p-1 border-brand-gold/20 shadow-2xl min-w-[140px]">
                            {[
                                { id: 'dark', label: 'Dark Matter' },
                                { id: 'satellite', label: 'Satellite' },
                                { id: 'osm', label: 'Classic Map' }
                            ].map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        setBasemap(option.id);
                                        setShowBasemaps(false);
                                    }}
                                    className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest text-left rounded transition-colors ${basemap === option.id ? 'bg-brand-gold/20 text-brand-gold' : 'text-brand-faded hover:bg-white/5 hover:text-white'}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </GlassPanel>
                    </div>
                )}

                <GlassPanel className="flex flex-col gap-1 p-1 shadow-2xl">
                    <button
                        onClick={() => setZoomCommand({ type: 'in', t: Date.now() })}
                        className="p-2.5 text-brand-faded hover:text-white hover:bg-brand-gold/20 transition-all rounded cursor-pointer"
                        title="Zoom In"
                    >
                        <Plus size={18} />
                    </button>
                    <div className="h-px bg-brand-gold/10 mx-2" />
                    <button
                        onClick={() => setZoomCommand({ type: 'out', t: Date.now() })}
                        className="p-2.5 text-brand-faded hover:text-white hover:bg-brand-gold/20 transition-all rounded cursor-pointer"
                        title="Zoom Out"
                    >
                        <Minus size={18} />
                    </button>
                    <div className="h-px bg-brand-gold/10 mx-2" />
                    <button
                        onClick={() => setShowBasemaps(!showBasemaps)}
                        className={`p-2.5 transition-all rounded cursor-pointer ${showBasemaps ? 'text-brand-gold bg-brand-gold/20' : 'text-brand-faded hover:text-white hover:bg-brand-gold/20'}`}
                        title="Basemaps"
                    >
                        <MapIcon size={18} />
                    </button>
                </GlassPanel>
            </div>
        </div>
    );
}
