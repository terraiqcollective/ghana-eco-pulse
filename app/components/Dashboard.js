"use client";

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
    Plus, Minus, Map as MapIcon, Menu,
    ChevronLeft, ChevronRight, BarChart3,
    AlertTriangle, X, Leaf, Tractor, RotateCcw,
    Loader2
} from 'lucide-react';

import { TopHeader } from './TopHeader';
import { GlassPanel } from './GlassPanel';
import { LegendPanel } from './LegendPanel';
import { KPI } from './KPI';
import { CarbonBalanceChart } from './SunburstChart';
import { LayerSelector } from './LayerSelector';
import { LossChart } from './LossChart';

const MapComponent = dynamic(() => import('./Map'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-brand-deep flex items-center justify-center text-brand-gold">
            <div className="flex items-center gap-3 animate-pulse">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-[11px] font-black uppercase tracking-widest">Loading Map...</span>
            </div>
        </div>
    )
});

export default function Dashboard() {
    // Layout
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
    const [isRightCollapsed, setIsRightCollapsed] = useState(false);
    const [isLegendOpen, setIsLegendOpen] = useState(true);

    // Map Controls
    const [zoomCommand, setZoomCommand] = useState(null);
    const [basemap, setBasemap] = useState('dark');
    const [showBasemaps, setShowBasemaps] = useState(false);

    // Filters
    const [years, setYears] = useState([]);
    const [regions, setRegions] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');

    // Data
    const [metrics, setMetrics] = useState({ carbonStock: 0, carbonLoss: 0, trend: [] });

    // Loading states
    const [loading, setLoading] = useState(true);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingMetrics, setLoadingMetrics] = useState(false);

    // Error states
    const [metadataError, setMetadataError] = useState(null);
    const [metricsError, setMetricsError] = useState(null);
    const [districtsError, setDistrictsError] = useState(null);

    // Layers
    const [selectedLayers, setSelectedLayers] = useState(['carbon', 'mining']);

    const toggleLayer = (id) => {
        setSelectedLayers(prev =>
            prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
        );
    };

    const formatMetric = (val) => {
        const num = parseFloat(val) || 0;
        if (num >= 1000000) return { value: (num / 1000000).toFixed(1), suffix: 'M', unit: 'tonnes C' };
        if (num >= 1000) return { value: (num / 1000).toFixed(1), suffix: 'k', unit: 'tonnes C' };
        return { value: num.toFixed(0), suffix: '', unit: 'tonnes C' };
    };

    const clearFilters = useCallback(() => {
        setSelectedRegion('');
        setSelectedDistrict('');
        setDistricts([]);
    }, []);

    const hasFilters = selectedRegion !== '' || selectedDistrict !== '';

    // Slider fill percentage
    const sliderFill = years.length > 1 && selectedYear
        ? ((selectedYear - years[0]) / (years[years.length - 1] - years[0])) * 100
        : 0;

    // 1. Fetch Metadata
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                setMetadataError(null);
                const response = await fetch('/api/gee/metadata');
                if (!response.ok) throw new Error('Failed to connect to Earth Engine. Check server credentials.');

                const data = await response.json();
                if (data.error) throw new Error(data.error);

                setYears(data.years || []);
                setRegions(data.regions || []);

                if (data.years?.length > 0) {
                    setSelectedYear(parseInt(data.years[data.years.length - 1]));
                }
            } catch (err) {
                console.error('Metadata fetch error:', err);
                setMetadataError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMetadata();
    }, []);

    // 2. Fetch Districts
    useEffect(() => {
        if (!selectedRegion) {
            setDistricts([]);
            setSelectedDistrict('');
            setDistrictsError(null);
            return;
        }

        const fetchDistricts = async () => {
            setLoadingDistricts(true);
            setDistrictsError(null);
            try {
                const response = await fetch('/api/gee/districts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ region: selectedRegion })
                });

                if (!response.ok) throw new Error('Failed to load districts');

                const data = await response.json();
                if (data.error) throw new Error(data.error);

                setDistricts(data.districts || []);
                setSelectedDistrict('');
            } catch (err) {
                console.error('Districts fetch error:', err);
                setDistrictsError(err.message);
                setDistricts([]);
            } finally {
                setLoadingDistricts(false);
            }
        };

        fetchDistricts();
    }, [selectedRegion]);

    // 3. Fetch Metrics
    useEffect(() => {
        if (!selectedYear) return;

        const fetchMetrics = async () => {
            setLoadingMetrics(true);
            setMetricsError(null);
            try {
                const response = await fetch('/api/gee/metrics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        year: selectedYear,
                        region: selectedRegion,
                        district: selectedDistrict,
                        years
                    })
                });

                if (!response.ok) throw new Error('Failed to load metrics');

                const data = await response.json();
                if (data.error) throw new Error(data.error);

                setMetrics(data);
            } catch (err) {
                console.error('Metrics fetch error:', err);
                setMetricsError(err.message);
            } finally {
                setLoadingMetrics(false);
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
            setSelectedLayers(prev => prev.filter(l => l !== 'district'));
        }
    }, [selectedDistrict]);

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-brand-deep text-brand-gold">
                <div className="text-center">
                    <div className="flex justify-center mb-5">
                        <Loader2 size={28} className="animate-spin text-brand-gold" />
                    </div>
                    <div className="text-[13px] font-black uppercase tracking-widest mb-2">Initializing Earth Engine...</div>
                    <div className="text-[9px] font-bold uppercase tracking-widest opacity-40">National Environmental Monitoring System</div>
                </div>
            </div>
        );
    }

    const stockFmt = formatMetric(metrics.carbonStock);
    const lossFmt = formatMetric(metrics.carbonLoss);

    const stockTrend = metrics.prevCarbonStock
        ? ((metrics.carbonStock - metrics.prevCarbonStock) / metrics.prevCarbonStock) * 100
        : 0;
    const lossTrend = metrics.prevCarbonLoss
        ? ((metrics.carbonLoss - metrics.prevCarbonLoss) / metrics.prevCarbonLoss) * 100
        : 0;

    // System status for the footer
    const systemStatus = metricsError
        ? { label: 'Data Error', dotClass: 'bg-red-500', textClass: 'text-red-400/70' }
        : loadingMetrics
            ? { label: 'Fetching Data', dotClass: 'bg-brand-gold animate-pulse', textClass: 'text-brand-gold/60' }
            : { label: 'Network Active', dotClass: 'bg-emerald-500 animate-pulse', textClass: 'text-emerald-500/60' };

    return (
        <div className="relative h-screen w-screen bg-brand-deep overflow-hidden text-white selection:bg-brand-gold/30">
            {/* Full Screen Map */}
            <div className="absolute inset-0 z-0 bg-brand-deep">
                <MapComponent
                    year={selectedYear}
                    region={selectedRegion}
                    district={selectedDistrict}
                    activeLayers={selectedLayers}
                    zoomCommand={zoomCommand}
                    basemap={basemap}
                />
            </div>

            {/* Top Header */}
            <div className="absolute top-0 left-0 right-0 z-40" style={{ height: '64px' }}>
                <TopHeader
                    selectedYear={selectedYear}
                    selectedRegion={selectedRegion}
                    selectedDistrict={selectedDistrict}
                />
            </div>

            {/* LEFT PANEL */}
            <div
                className={`absolute left-0 bottom-0 z-30 bg-brand-deep/90 backdrop-blur-lg border-r border-brand-gold/20 transition-all duration-500 flex flex-col ${isLeftCollapsed ? '-translate-x-full shadow-none' : 'translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.6)]'}`}
                style={{ top: '64px', width: '320px' }}
            >
                <div className="flex-1 p-5 overflow-y-auto space-y-6 custom-scrollbar flex flex-col">

                    {/* Panel Header */}
                    <div className="flex justify-between items-center">
                        <h2 className="text-brand-gold text-[10px] font-black uppercase tracking-[0.25em]">
                            Analysis Inputs
                        </h2>
                        <button
                            onClick={() => setIsLeftCollapsed(true)}
                            className="p-1.5 hover:bg-brand-gold/10 text-brand-gold border border-brand-gold/20 rounded transition-colors cursor-pointer"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    </div>

                    {/* Metadata Error Banner */}
                    {metadataError && (
                        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-0.5">Connection Error</p>
                                <p className="text-[10px] text-red-300/70 leading-snug">{metadataError}</p>
                            </div>
                            <button onClick={() => setMetadataError(null)} className="shrink-0 text-red-400/50 hover:text-red-400 transition-colors">
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="flex flex-col gap-4">

                        {/* Region */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black text-brand-faded/40 uppercase tracking-widest pl-1">
                                Target Region
                            </label>
                            <select
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                className="w-full bg-brand-deep/40 border border-brand-gold/20 rounded px-3 py-2 text-xs font-bold text-white outline-none focus:border-brand-gold/60 appearance-none cursor-pointer h-10 transition-colors"
                            >
                                <option value="" className="bg-brand-deep">All Regions</option>
                                {regions.map(r => (
                                    <option key={r} value={r} className="bg-brand-deep">{r}</option>
                                ))}
                            </select>
                            {/* Region boundary toggle — only shown when a region is selected */}
                            {selectedRegion && (
                                <button
                                    onClick={() => toggleLayer('region')}
                                    className="flex items-center justify-between px-3 py-2 rounded border border-white/8 hover:border-white/15 bg-white/3 hover:bg-white/5 transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-3.5 h-3.5 rounded-sm border-2 border-white/50 shrink-0" />
                                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Region Boundary</span>
                                    </div>
                                    <div className={`relative w-8 h-4 rounded-full transition-all duration-200 ${selectedLayers.includes('region') ? 'bg-white/25' : 'bg-white/8'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200 ${selectedLayers.includes('region') ? 'right-0.5 bg-white' : 'left-0.5 bg-white/25'}`} />
                                    </div>
                                </button>
                            )}
                        </div>

                        {/* District */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between pl-1">
                                <label className="text-[9px] font-black text-brand-faded/40 uppercase tracking-widest">
                                    District Focus
                                </label>
                                {loadingDistricts && (
                                    <Loader2 size={10} className="animate-spin text-brand-gold/50" />
                                )}
                            </div>
                            <select
                                value={selectedDistrict}
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                                disabled={loadingDistricts || !selectedRegion}
                                className="w-full bg-brand-deep/40 border border-brand-gold/20 rounded px-3 py-2 text-xs font-bold text-white outline-none focus:border-brand-gold/60 appearance-none cursor-pointer h-10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <option value="" className="bg-brand-deep">
                                    {!selectedRegion ? 'Select a region first' : 'All Districts'}
                                </option>
                                {districts.map(d => (
                                    <option key={d} value={d} className="bg-brand-deep">{d}</option>
                                ))}
                            </select>
                            {districtsError && (
                                <p className="text-[9px] text-red-400/70 pl-1 flex items-center gap-1">
                                    <AlertTriangle size={9} /> {districtsError}
                                </p>
                            )}
                            {/* District boundary toggle — only shown when a district is selected */}
                            {selectedDistrict && (
                                <button
                                    onClick={() => toggleLayer('district')}
                                    className="flex items-center justify-between px-3 py-2 rounded border border-yellow-400/10 hover:border-yellow-400/20 bg-yellow-400/3 hover:bg-yellow-400/5 transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-3.5 h-3.5 rounded-sm border-2 border-yellow-400/60 shrink-0" />
                                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">District Boundary</span>
                                    </div>
                                    <div className={`relative w-8 h-4 rounded-full transition-all duration-200 ${selectedLayers.includes('district') ? 'bg-yellow-400/30' : 'bg-yellow-400/10'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200 ${selectedLayers.includes('district') ? 'right-0.5 bg-yellow-400' : 'left-0.5 bg-yellow-400/20'}`} />
                                    </div>
                                </button>
                            )}
                        </div>

                        {/* Clear Filters */}
                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center justify-center gap-1.5 py-2 text-[9px] font-black uppercase tracking-widest text-brand-gold/50 hover:text-brand-gold border border-brand-gold/10 hover:border-brand-gold/30 rounded transition-all"
                            >
                                <RotateCcw size={10} />
                                Clear Filters
                            </button>
                        )}

                        {/* Year Slider */}
                        <div className="flex flex-col gap-3 pt-1">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[9px] font-black text-brand-faded/40 uppercase tracking-widest">
                                    Temporal Range
                                </label>
                                <span className="text-[13px] font-black text-brand-gold tabular-nums tracking-widest">
                                    {selectedYear}
                                </span>
                            </div>
                            <div className="px-1">
                                <input
                                    type="range"
                                    min={years[0] || 2015}
                                    max={years[years.length - 1] || 2024}
                                    step="1"
                                    value={selectedYear || years[years.length - 1] || 2024}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="year-slider cursor-pointer"
                                    style={{
                                        background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${sliderFill}%, rgba(5,46,22,0.8) ${sliderFill}%, rgba(5,46,22,0.8) 100%)`
                                    }}
                                />
                                {/* Year tick marks */}
                                {years.length > 0 && (
                                    <div className="flex justify-between mt-1 px-0">
                                        {years.map((y) => (
                                            <div key={y} className="flex flex-col items-center gap-0.5">
                                                <div className={`w-px h-1.5 ${parseInt(y) === selectedYear ? 'bg-brand-gold/60' : 'bg-brand-faded/15'}`} />
                                                <span className={`text-[7px] font-bold tabular-nums ${parseInt(y) === selectedYear ? 'text-brand-gold/70' : 'text-brand-faded/20'}`}>
                                                    {String(y).slice(-2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-brand-gold/10 w-full" />

                    {/* Layer Selector */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-[9px] font-black text-brand-faded/40 uppercase tracking-widest pl-1">
                            Data Layers
                        </h3>
                        <LayerSelector
                            options={[
                                { id: 'carbon', label: 'Carbon Stock' },
                                { id: 'mining', label: 'Carbon Loss' },
                            ]}
                            selectedIds={selectedLayers}
                            onChange={toggleLayer}
                        />
                    </div>

                    {/* Legend Button */}
                    <div className="pt-2 mt-auto">
                        <button
                            onClick={() => setIsLegendOpen(!isLegendOpen)}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded border text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer ${isLegendOpen
                                ? 'bg-brand-gold text-brand-deep border-brand-gold'
                                : 'bg-transparent border-brand-gold/40 text-brand-gold hover:bg-brand-gold/10'
                                }`}
                        >
                            {isLegendOpen ? 'Hide Legend' : 'Show Legend'}
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div
                className={`absolute right-0 bottom-0 z-30 bg-brand-deep/90 backdrop-blur-lg border-l border-brand-gold/20 transition-all duration-500 flex flex-col ${isRightCollapsed ? 'translate-x-full shadow-none' : 'translate-x-0 shadow-[-20px_0_50px_rgba(0,0,0,0.6)]'}`}
                style={{ top: '64px', width: '320px' }}
            >
                <div className="flex-1 p-5 overflow-y-auto space-y-6 custom-scrollbar flex flex-col">

                    {/* Panel Header */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => setIsRightCollapsed(true)}
                            className="p-1.5 hover:bg-brand-gold/10 text-brand-gold border border-brand-gold/20 rounded transition-colors cursor-pointer"
                        >
                            <ChevronRight size={18} />
                        </button>
                        <div className="flex flex-col items-end gap-0.5">
                            <h2 className="text-brand-gold text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2">
                                Regional Output <BarChart3 size={14} />
                            </h2>
                            {(selectedRegion || selectedDistrict) && (
                                <span className="text-[8px] font-bold text-brand-faded/40 uppercase tracking-widest">
                                    {selectedDistrict || selectedRegion}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Metrics Error Banner */}
                    {metricsError && (
                        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-0.5">Metrics Unavailable</p>
                                <p className="text-[10px] text-red-300/70 leading-snug">{metricsError}</p>
                            </div>
                            <button onClick={() => setMetricsError(null)} className="shrink-0 text-red-400/50 hover:text-red-400 transition-colors">
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    {/* KPI Cards */}
                    <div className={`flex flex-col gap-3 transition-opacity duration-300 ${loadingMetrics ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        {loadingMetrics && (
                            <div className="flex items-center justify-center gap-2 py-1">
                                <Loader2 size={12} className="animate-spin text-brand-gold/50" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold/40">Calculating...</span>
                            </div>
                        )}
                        <KPI
                            label="Total Carbon Stock"
                            value={stockFmt.value}
                            suffix={stockFmt.suffix}
                            unit={stockFmt.unit}
                            trendValue={stockTrend}
                            icon={Leaf}
                        />
                        <KPI
                            label="Carbon Loss from Mining"
                            value={lossFmt.value}
                            suffix={lossFmt.suffix}
                            unit={lossFmt.unit}
                            trendValue={lossTrend}
                            invertColor={true}
                            icon={Tractor}
                        />
                    </div>

                    <div className="h-px bg-brand-gold/10 w-full" />

                    {/* Trend Chart */}
                    <div className="flex flex-col gap-3">
                        <span className="text-[9px] font-black text-brand-faded/40 uppercase tracking-widest">
                            Yearly Trend
                        </span>
                        <LossChart data={metrics.trend} loading={loadingMetrics} />
                    </div>

                    <div className="h-px bg-brand-gold/10 w-full" />

                    {/* Carbon Balance Chart */}
                    <div className="flex flex-col gap-3 flex-1 min-h-0">
                        <span className="text-[9px] font-black text-brand-faded/40 uppercase tracking-widest">
                            Carbon Balance — {selectedYear}
                        </span>
                        <CarbonBalanceChart
                            carbonStock={metrics.carbonStock}
                            carbonLoss={metrics.carbonLoss}
                            loading={loadingMetrics}
                        />
                    </div>
                </div>

                {/* Status Bar */}
                <div className="px-5 py-3 bg-brand-gold/5 border-t border-brand-gold/10 flex items-center justify-between shrink-0">
                    <span className="text-[8px] font-black text-brand-gold/30 uppercase tracking-widest">
                        {selectedYear || '—'} · {selectedRegion || 'All Regions'}
                    </span>
                    <div className={`w-1.5 h-1.5 rounded-full ${systemStatus.dotClass}`} />
                </div>
            </div>

            {/* Collapsed Panel Reveal Buttons */}
            <button
                onClick={() => setIsLeftCollapsed(false)}
                className={`absolute top-20 left-4 z-30 p-3 bg-brand-deep/95 border border-brand-gold/40 text-brand-gold rounded shadow-2xl transition-all duration-300 cursor-pointer ${isLeftCollapsed ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-20 opacity-0 pointer-events-none scale-90'}`}
                title="Open Inputs"
            >
                <Menu size={20} />
            </button>

            <button
                onClick={() => setIsRightCollapsed(false)}
                className={`absolute top-20 right-4 z-30 p-3 bg-brand-deep/95 border border-brand-gold/40 text-brand-gold rounded shadow-2xl transition-all duration-300 cursor-pointer ${isRightCollapsed ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-20 opacity-0 pointer-events-none scale-90'}`}
                title="Open Outputs"
            >
                <BarChart3 size={20} />
            </button>

            {/* Legend Panel */}
            <LegendPanel
                isOpen={isLegendOpen}
                onClose={() => setIsLegendOpen(false)}
                activeLayers={selectedLayers}
                className={`absolute bottom-12 z-50 transition-all duration-500 ${isLeftCollapsed ? 'left-6' : 'left-[336px]'}`}
            />

            {/* Map Controls */}
            <div
                className={`absolute bottom-12 z-30 flex flex-col gap-3 items-end transition-all duration-500 ${isRightCollapsed ? 'right-6' : 'right-[336px]'}`}
            >
                {/* Basemap Menu */}
                {showBasemaps && (
                    <div className="mb-1 animate-in fade-in slide-in-from-right-4 duration-200">
                        <GlassPanel className="flex flex-col p-1 shadow-2xl min-w-[140px] rounded-lg">
                            {[
                                { id: 'dark', label: 'Dark Matter' },
                                { id: 'satellite', label: 'Satellite' },
                                { id: 'osm', label: 'Classic Map' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => { setBasemap(opt.id); setShowBasemaps(false); }}
                                    className={`px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-left rounded transition-colors ${basemap === opt.id ? 'bg-brand-gold/20 text-brand-gold' : 'text-brand-faded hover:bg-white/5 hover:text-white'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </GlassPanel>
                    </div>
                )}

                <GlassPanel className="flex flex-col gap-1 p-1 shadow-2xl rounded-lg">
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
                        title="Switch Basemap"
                    >
                        <MapIcon size={18} />
                    </button>
                </GlassPanel>
            </div>
        </div>
    );
}
