"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
    Plus, Minus, Map as MapIcon, Menu,
    ChevronLeft, ChevronRight, BarChart3,
    AlertTriangle, X, TreePine, Pickaxe, RotateCcw,
    Loader2, Database, ArrowUp, ArrowDown, Layers
} from 'lucide-react';

import { TopHeader } from './TopHeader';
import { GlassPanel } from './GlassPanel';
import { LegendPanel } from './LegendPanel';
import { TourGuide } from './TourGuide';
import { AboutModal } from './AboutModal';
import { KPI } from './KPI';
import { LossChart } from './LossChart';

// ─── Data source metadata for each layer ────────────────────────────────────
const LAYER_INFO = {
    carbon: {
        name: 'Carbon Stock',
        source: 'GEDI Mosaics + Google Satellite Embeddings',
        sensor: 'GEDI',
        resolution: '25m',
        cadence: 'Annual',
        dot: 'bg-emerald-500',
    },
    mining: {
        name: 'Mining Loss',
        source: 'Planet NICFI + U-Net Model · Mining Activity Detection',
        sensor: 'Planet NICFI',
        resolution: '4.77m',
        cadence: 'Annual',
        dot: 'bg-red-500',
    },
    region: {
        name: 'Region Boundary',
        source: 'Ghana Statistical Service (GSS)',
        sensor: 'Vector',
        resolution: 'Vector',
        cadence: 'Static',
        dot: 'bg-white/50',
    },
    district: {
        name: 'District Boundary',
        source: 'Ghana Statistical Service (GSS)',
        sensor: 'Vector',
        resolution: 'Vector',
        cadence: 'Static',
        dot: 'bg-yellow-400',
    },
};

// ─── Contextual insights derived from current metrics ───────────────────────
function computeTakeaway(metrics, selectedYear, selectedRegion, selectedDistrict) {
    const { carbonStock, carbonLoss, prevCarbonLoss } = metrics;

    if (prevCarbonLoss > 0 && carbonLoss > 0) {
        const change = ((carbonLoss - prevCarbonLoss) / prevCarbonLoss) * 100;
        if (Math.abs(change) > 3) {
            return {
                type: change > 0 ? 'warning' : 'good',
                text: change > 0
                    ? `Mining-related loss increased by ${change.toFixed(0)}% relative to ${(selectedYear || 2024) - 1}.`
                    : `Mining-related loss decreased by ${Math.abs(change).toFixed(0)}% relative to ${(selectedYear || 2024) - 1}.`,
            };
        }

        return {
            type: 'neutral',
            text: `Mining-related loss was broadly unchanged from ${(selectedYear || 2024) - 1}.`,
        };
    }

    if (carbonStock > 0 && carbonLoss > 0) {
        const ratio = (carbonLoss / carbonStock) * 100;
        return {
            type: ratio > 1.5 ? 'warning' : 'good',
            text: `Estimated loss equals ${ratio.toFixed(ratio > 1.5 ? 1 : 2)}% of total forest carbon stock.`,
        };
    }

    if (!selectedRegion) {
        return { type: 'info', text: 'Select a region to view district-level results.' };
    }

    if (!selectedDistrict) {
        return { type: 'info', text: `Regional totals currently include all districts in ${selectedRegion}.` };
    }

    return { type: 'neutral', text: `Showing district-level results for ${selectedDistrict} in ${selectedYear}.` };
}

const MapComponent = dynamic(() => import('./Map'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-brand-deep flex items-center justify-center text-brand-gold">
            <div className="flex items-center gap-3 animate-pulse">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-[11px] font-black uppercase tracking-widest">Loading Layers...</span>
            </div>
        </div>
    )
});

export default function Dashboard() {
    // Layout
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
    const [isRightCollapsed, setIsRightCollapsed] = useState(true);
    const [isLegendOpen, setIsLegendOpen] = useState(false);
    const [tourTrigger, setTourTrigger] = useState(false);

    // Mobile
    const [isMobile, setIsMobile] = useState(false);
    const [mobilePanel, setMobilePanel] = useState(null);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Map controls
    const [zoomCommand, setZoomCommand] = useState(null);
    const [mapCommand, setMapCommand] = useState(null);
    const [basemap, setBasemap] = useState('dark');
    const [showBasemaps, setShowBasemaps] = useState(false);

    // Boundary GeoJSON (loaded once on mount)
    const [boundaryGeoJSON, setBoundaryGeoJSON] = useState({ districts: null, regions: null });

    // Pending district — set when a map click triggers region+district together
    const [pendingDistrict, setPendingDistrict] = useState(null);

    // Filters
    const [years, setYears] = useState([]);
    const [regions, setRegions] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');

    // Data
    const [metrics, setMetrics] = useState({ carbonStock: 0, carbonLoss: 0, trend: [] });

    // Compare mode
    const [compareMode, setCompareMode] = useState(false);
    const [compareYear, setCompareYear] = useState(null);
    const [compareMetrics, setCompareMetrics] = useState(null);
    const [loadingCompare, setLoadingCompare] = useState(false);

    // Loading & errors
    const [loading, setLoading] = useState(true);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingMetrics, setLoadingMetrics] = useState(false);
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

    const fmtNum = (val) => {
        const num = parseFloat(val) || 0;
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
        return num.toFixed(0);
    };

    const clearFilters = useCallback(() => {
        setSelectedRegion('');
        setSelectedDistrict('');
        setDistricts([]);
    }, []);

    const resetDashboard = useCallback(() => {
        setSelectedRegion('');
        setSelectedDistrict('');
        setDistricts([]);
        setPendingDistrict(null);
        setSelectedLayers(['carbon', 'mining']);
        setCompareMode(false);
        setCompareMetrics(null);
        setMetrics({ carbonStock: 0, carbonLoss: 0, trend: [] });
        setMetadataError(null);
        setMetricsError(null);
        setDistrictsError(null);
        setIsRightCollapsed(true);
        setIsLegendOpen(false);
        if (years.length > 0) setSelectedYear(parseInt(years[years.length - 1]));
        setMapCommand({ type: 'reset', t: Date.now() });
    }, [years]);

    const handleDistrictClick = useCallback((districtName, regionName) => {
        if (regionName) {
            setPendingDistrict(districtName);
            setSelectedRegion(regionName);
        }
    }, []);

    const handleRegionClick = useCallback((regionName) => {
        setSelectedRegion(regionName);
        setSelectedDistrict('');
    }, []);

    const hasFilters = selectedRegion !== '' || selectedDistrict !== '';

    const sliderFill = years.length > 1 && selectedYear
        ? ((selectedYear - years[0]) / (years[years.length - 1] - years[0])) * 100
        : 0;

    const takeaway = useMemo(
        () => computeTakeaway(metrics, selectedYear, selectedRegion, selectedDistrict),
        [metrics, selectedYear, selectedRegion, selectedDistrict]
    );

    // 0. Fetch full boundary GeoJSON once on mount
    useEffect(() => {
        const abortController = new AbortController();

        const fetchBoundaries = async () => {
            try {
                const res = await fetch('/api/gee/boundaries', {
                    signal: abortController.signal,
                });
                if (!res.ok) return;
                const data = await res.json();
                if (!data.error) {
                    setBoundaryGeoJSON({ districts: data.districts || null, regions: data.regions || null });
                }
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.error('Boundary fetch error:', err);
            }
        };
        fetchBoundaries();

        return () => abortController.abort();
    }, []);

    // 1. Fetch metadata
    useEffect(() => {
        const abortController = new AbortController();

        const fetchMetadata = async () => {
            try {
                setMetadataError(null);
                const response = await fetch('/api/gee/metadata', {
                    signal: abortController.signal,
                });
                if (!response.ok) throw new Error('Failed to connect to Earth Engine. Check server credentials.');
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                setYears(data.years || []);
                setRegions(data.regions || []);
                if (data.years?.length > 0) {
                    const latest = parseInt(data.years[data.years.length - 1]);
                    setSelectedYear(latest);
                    setCompareYear(latest - 1);
                }
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.error('Metadata fetch error:', err);
                setMetadataError(err.message);
            } finally {
                if (!abortController.signal.aborted) {
                    setLoading(false);
                }
            }
        };
        fetchMetadata();

        return () => abortController.abort();
    }, []);

    // 2. Fetch districts
    useEffect(() => {
        if (!selectedRegion) {
            setDistricts([]);
            setSelectedDistrict('');
            setDistrictsError(null);
            return;
        }

        const abortController = new AbortController();

        const fetchDistricts = async () => {
            setLoadingDistricts(true);
            setDistrictsError(null);
            try {
                const response = await fetch('/api/gee/districts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ region: selectedRegion }),
                    signal: abortController.signal,
                });
                if (!response.ok) throw new Error('Failed to load districts');
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                setDistricts(data.districts || []);
                // If a district was pre-selected via map click, apply it now
                if (pendingDistrict) {
                    setSelectedDistrict(pendingDistrict);
                    setPendingDistrict(null);
                } else {
                    setSelectedDistrict('');
                }
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.error('Districts fetch error:', err);
                setDistrictsError(err.message);
                setDistricts([]);
            } finally {
                if (!abortController.signal.aborted) {
                    setLoadingDistricts(false);
                }
            }
        };
        fetchDistricts();

        return () => abortController.abort();
    }, [selectedRegion, pendingDistrict]);

    // 3. Fetch metrics
    useEffect(() => {
        if (!selectedYear) return;

        const abortController = new AbortController();

        const fetchMetrics = async () => {
            setLoadingMetrics(true);
            setMetricsError(null);
            try {
                const response = await fetch('/api/gee/metrics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ year: selectedYear, region: selectedRegion, district: selectedDistrict, years }),
                    signal: abortController.signal,
                });
                if (!response.ok) throw new Error('Failed to load metrics');
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                setMetrics(data);
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.error('Metrics fetch error:', err);
                setMetricsError(err.message);
            } finally {
                if (!abortController.signal.aborted) {
                    setLoadingMetrics(false);
                }
            }
        };
        fetchMetrics();

        return () => abortController.abort();
    }, [selectedYear, selectedRegion, selectedDistrict, years]);

    // 4. Fetch compare metrics
    useEffect(() => {
        if (!compareMode || !compareYear || !selectedYear || compareYear === selectedYear) {
            setCompareMetrics(null);
            return;
        }

        const abortController = new AbortController();

        const fetchCompare = async () => {
            setLoadingCompare(true);
            try {
                const response = await fetch('/api/gee/metrics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ year: compareYear, region: selectedRegion, district: selectedDistrict, years }),
                    signal: abortController.signal,
                });
                if (!response.ok) throw new Error();
                const data = await response.json();
                if (data.error) throw new Error();
                setCompareMetrics(data);
            } catch (err) {
                if (err.name === 'AbortError') return;
                setCompareMetrics(null);
            } finally {
                if (!abortController.signal.aborted) {
                    setLoadingCompare(false);
                }
            }
        };
        fetchCompare();

        return () => abortController.abort();
    }, [compareMode, compareYear, selectedYear, selectedRegion, selectedDistrict, years]);

    // Auto-enable region boundary layer
    useEffect(() => {
        if (selectedRegion) {
            setSelectedLayers(prev => (
                prev.includes('region') ? prev : [...prev, 'region']
            ));
        }
    }, [selectedRegion]);

    // Sync district layer
    useEffect(() => {
        setSelectedLayers(prev => {
            if (selectedDistrict) {
                return prev.includes('district') ? prev : [...prev, 'district'];
            }
            return prev.includes('district')
                ? prev.filter(l => l !== 'district')
                : prev;
        });
    }, [selectedDistrict]);

    // Auto-open right panel and legend when real metrics arrive
    useEffect(() => {
        if (metrics.carbonStock > 0 || metrics.carbonLoss > 0) {
            setIsRightCollapsed(false);
            setIsLegendOpen(true);
        }
    }, [metrics.carbonStock, metrics.carbonLoss]);

    // ─── Initial loading screen ──────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-brand-deep">
                <div className="flex flex-col items-center gap-8">
                    {/* Pulse rings */}
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <div className="canopy-ring" />
                        <div className="canopy-ring" />
                        <div className="canopy-ring" />
                        {/* Centre icon */}
                        <div className="relative z-10 w-10 h-10 rounded-full bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center">
                            <TreePine size={18} className="text-brand-gold" />
                        </div>
                    </div>
                    {/* Text */}
                    <div className="text-center">
                        <p className="text-white text-sm font-semibold tracking-wide">Loading dashboard data...</p>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Derived values ──────────────────────────────────────────────────────
    const stockFmt = formatMetric(metrics.carbonStock);
    const lossFmt = formatMetric(metrics.carbonLoss);

    const stockTrend = metrics.prevCarbonStock
        ? ((metrics.carbonStock - metrics.prevCarbonStock) / metrics.prevCarbonStock) * 100
        : 0;
    const lossTrend = metrics.prevCarbonLoss
        ? ((metrics.carbonLoss - metrics.prevCarbonLoss) / metrics.prevCarbonLoss) * 100
        : 0;

    const stockDelta = compareMetrics?.carbonStock
        ? ((metrics.carbonStock - compareMetrics.carbonStock) / compareMetrics.carbonStock) * 100
        : null;
    const lossDelta = compareMetrics?.carbonLoss
        ? ((metrics.carbonLoss - compareMetrics.carbonLoss) / compareMetrics.carbonLoss) * 100
        : null;

    const systemStatus = metricsError
        ? { dotClass: 'bg-red-500' }
        : loadingMetrics
            ? { dotClass: 'bg-brand-gold animate-pulse' }
            : { dotClass: 'bg-emerald-500 animate-pulse' };

    // ─── Panel class builders ────────────────────────────────────────────────
    const leftPanelClass = [
        'fixed md:absolute',
        'inset-x-0 md:inset-x-auto md:left-0',
        'bottom-14 md:bottom-0',
        'md:top-16 md:w-80',
        'z-40 md:z-30',
        'max-h-[78vh] md:max-h-none',
        'bg-brand-deep/95 md:bg-brand-deep/90 backdrop-blur-lg',
        'border-t border-brand-gold/20 md:border-r md:border-t-0',
        'rounded-t-2xl md:rounded-none',
        'transition-all duration-500 flex flex-col',
        mobilePanel === 'left'
            ? 'translate-y-0 shadow-[0_-20px_50px_rgba(0,0,0,0.6)]'
            : 'translate-y-full md:translate-y-0',
        isLeftCollapsed
            ? 'md:-translate-x-full md:shadow-none'
            : 'md:translate-x-0 md:shadow-[20px_0_50px_rgba(0,0,0,0.6)]',
    ].join(' ');

    const rightPanelClass = [
        'fixed md:absolute',
        'inset-x-0 md:inset-x-auto md:right-0',
        'bottom-14 md:bottom-0',
        'md:top-16 md:w-80',
        'z-40 md:z-30',
        'max-h-[78vh] md:max-h-none',
        'bg-brand-deep/95 md:bg-brand-deep/90 backdrop-blur-lg',
        'border-t border-brand-gold/20 md:border-l md:border-t-0',
        'rounded-t-2xl md:rounded-none',
        'transition-all duration-500 flex flex-col',
        mobilePanel === 'right'
            ? 'translate-y-0 shadow-[0_-20px_50px_rgba(0,0,0,0.6)]'
            : 'translate-y-full md:translate-y-0',
        isRightCollapsed
            ? 'md:translate-x-full md:shadow-none'
            : 'md:translate-x-0 md:shadow-[-20px_0_50px_rgba(0,0,0,0.6)]',
    ].join(' ');

    // Insight chip styles
    const takeawayStyle = {
        warning: 'border-red-500/20 bg-red-500/5',
        good:    'border-emerald-500/20 bg-emerald-500/5',
        neutral: 'border-white/8 bg-white/3',
        info:    'border-brand-gold/15 bg-brand-gold/4',
    };
    const takeawayDot = {
        warning: 'bg-red-500',
        good:    'bg-emerald-500',
        neutral: 'bg-white/30',
        info:    'bg-brand-gold',
    };

    return (
        <div className="relative h-screen w-screen bg-brand-deep overflow-hidden text-white selection:bg-brand-gold/30">

            {/* Full-screen map */}
            <div id="tour-map" className="absolute inset-0 z-0 bg-brand-deep">
                <MapComponent
                    year={selectedYear}
                    region={selectedRegion}
                    district={selectedDistrict}
                    activeLayers={selectedLayers}
                    zoomCommand={zoomCommand}
                    mapCommand={mapCommand}
                    basemap={basemap}
                    boundaryGeoJSON={boundaryGeoJSON}
                    onDistrictClick={handleDistrictClick}
                    onRegionClick={handleRegionClick}
                />
            </div>

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-40" style={{ height: '64px' }}>
                <TopHeader
                    selectedYear={selectedYear}
                    selectedRegion={selectedRegion}
                    selectedDistrict={selectedDistrict}
                    onReset={resetDashboard}
                    onTour={() => { setTourTrigger(t => !t); }}
                />
            </div>

            {/* Mobile backdrop */}
            {mobilePanel !== null && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 md:hidden"
                    onClick={() => setMobilePanel(null)}
                />
            )}

            {/* ══════════════════════════════ LEFT PANEL ══════════════════════════════ */}
            <div id="tour-left-panel" className={leftPanelClass}>
                {/* Mobile drag handle */}
                <div className="flex justify-center pt-2.5 pb-0.5 md:hidden shrink-0">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                <div className="flex-1 p-5 overflow-y-auto custom-scrollbar flex flex-col gap-5">

                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-white text-sm font-bold leading-none">Filters</h2>
                            <p className="text-[9px] text-white/25 mt-1 font-medium">Ghana forest carbon and mining data</p>
                        </div>
                        <button
                            onClick={() => isMobile ? setMobilePanel(null) : setIsLeftCollapsed(true)}
                            className="p-1.5 hover:bg-brand-gold/10 text-brand-gold/50 hover:text-brand-gold border border-brand-gold/20 rounded transition-colors cursor-pointer shrink-0"
                        >
                            <ChevronLeft size={16} />
                        </button>
                    </div>

                    {/* Connection error */}
                    {metadataError && (
                        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-bold text-red-400 mb-0.5">Data connection error</p>
                                <p className="text-[10px] text-red-300/70 leading-snug">{metadataError}</p>
                            </div>
                            <button onClick={() => setMetadataError(null)} className="shrink-0 text-red-400/50 hover:text-red-400 transition-colors">
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    {/* ── Location ───────────────────────────────── */}
                    <div className="flex flex-col gap-3">
                        <span className="text-[9px] font-semibold text-white/25 uppercase tracking-widest">Location</span>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-medium text-white/45 pl-0.5">Region</label>
                            <select
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                className="w-full bg-brand-deep/40 border border-brand-gold/20 rounded px-3 py-2 text-xs font-bold text-white outline-none focus:border-brand-gold/60 appearance-none cursor-pointer h-10 transition-colors"
                            >
                                <option value="" className="bg-brand-deep">All Regions</option>
                                {regions.map(r => <option key={r} value={r} className="bg-brand-deep">{r}</option>)}
                            </select>
                            {selectedRegion && (
                                <button
                                    onClick={() => toggleLayer('region')}
                                    className="flex items-center justify-between px-3 py-2 rounded border border-white/8 hover:border-white/15 bg-white/3 hover:bg-white/5 transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-3.5 h-3.5 rounded-sm border-2 border-white/40 shrink-0" />
                                        <span className="text-[9px] font-medium text-white/35">Show boundary</span>
                                    </div>
                                    <div className={`relative w-8 h-4 rounded-full transition-all duration-200 ${selectedLayers.includes('region') ? 'bg-white/25' : 'bg-white/8'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200 ${selectedLayers.includes('region') ? 'right-0.5 bg-white' : 'left-0.5 bg-white/25'}`} />
                                    </div>
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-medium text-white/45 pl-0.5">District</label>
                                {loadingDistricts && <Loader2 size={10} className="animate-spin text-brand-gold/50" />}
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
                                {districts.map(d => <option key={d} value={d} className="bg-brand-deep">{d}</option>)}
                            </select>
                            {districtsError && (
                                <p className="text-[9px] text-red-400/70 pl-1 flex items-center gap-1">
                                    <AlertTriangle size={9} /> {districtsError}
                                </p>
                            )}
                            {selectedDistrict && (
                                <button
                                    onClick={() => toggleLayer('district')}
                                    className="flex items-center justify-between px-3 py-2 rounded border border-yellow-400/10 hover:border-yellow-400/20 bg-yellow-400/3 hover:bg-yellow-400/5 transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-3.5 h-3.5 rounded-sm border-2 border-yellow-400/50 shrink-0" />
                                        <span className="text-[9px] font-medium text-white/35">Show boundary</span>
                                    </div>
                                    <div className={`relative w-8 h-4 rounded-full transition-all duration-200 ${selectedLayers.includes('district') ? 'bg-yellow-400/30' : 'bg-yellow-400/10'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200 ${selectedLayers.includes('district') ? 'right-0.5 bg-yellow-400' : 'left-0.5 bg-yellow-400/20'}`} />
                                    </div>
                                </button>
                            )}
                        </div>

                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center justify-center gap-1.5 py-2 text-[9px] font-medium text-white/25 hover:text-white/50 border border-white/8 hover:border-white/15 rounded transition-all"
                            >
                                <RotateCcw size={10} />
                                Clear filters
                            </button>
                        )}
                    </div>

                    {/* ── Year ────────────────────────────────────── */}
                    <div className="flex flex-col gap-2.5">
                        <div className="flex items-baseline justify-between">
                            <span className="text-[9px] font-semibold text-white/25 uppercase tracking-widest">Year</span>
                            <span className="text-[15px] font-black text-brand-gold tabular-nums">{selectedYear}</span>
                        </div>
                        <div id="tour-year-slider">
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
                            {years.length > 0 && (
                                <div className="flex justify-between mt-1">
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

                    {/* ── Map Layers ──────────────────────────────── */}
                    <div id="tour-map-layers" className="flex flex-col gap-2">
                        <span className="text-[9px] font-semibold text-white/25 uppercase tracking-widest">Map Layers</span>
                        {[
                            { id: 'carbon', label: 'Carbon Stock', dot: 'bg-emerald-500' },
                            { id: 'mining', label: 'Mining Loss',  dot: 'bg-red-500' },
                        ].map(layer => (
                            <button
                                key={layer.id}
                                onClick={() => toggleLayer(layer.id)}
                                className={`flex items-center justify-between px-3 py-2.5 rounded border transition-all cursor-pointer ${selectedLayers.includes(layer.id) ? 'border-white/12 bg-white/4' : 'border-white/5 bg-transparent opacity-45'}`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${layer.dot}`} />
                                    <span className="text-[10px] font-semibold text-white/65">{layer.label}</span>
                                </div>
                                <div className={`relative w-8 h-4 rounded-full transition-all duration-200 ${selectedLayers.includes(layer.id) ? 'bg-white/20' : 'bg-white/8'}`}>
                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200 ${selectedLayers.includes(layer.id) ? 'right-0.5 bg-white' : 'left-0.5 bg-white/20'}`} />
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* ── Year Comparison (E) ─────────────────────── */}
                    <div id="tour-year-comparison" className="flex flex-col gap-2.5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <span className="text-[9px] font-semibold text-white/25 uppercase tracking-widest block leading-none">Comparison</span>
                                <p className="text-[9px] text-white/18 mt-1 leading-snug">Compare the selected year with another reporting year</p>
                            </div>
                            <button
                                onClick={() => { setCompareMode(!compareMode); if (compareMode) setCompareMetrics(null); }}
                                className={`relative shrink-0 w-9 h-5 rounded-full transition-all duration-200 ${compareMode ? 'bg-brand-gold' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${compareMode ? 'right-0.5' : 'left-0.5'}`} />
                            </button>
                        </div>
                        {compareMode && (
                            <select
                                value={compareYear || ''}
                                onChange={(e) => setCompareYear(parseInt(e.target.value))}
                                className="w-full bg-brand-deep/40 border border-brand-gold/20 rounded px-3 py-2 text-xs font-bold text-white outline-none focus:border-brand-gold/60 appearance-none cursor-pointer h-10"
                            >
                                <option value="" className="bg-brand-deep">Select comparison year</option>
                                {years.filter(y => parseInt(y) !== selectedYear).map(y => (
                                    <option key={y} value={y} className="bg-brand-deep">{y}</option>
                                ))}
                            </select>
                        )}
                    </div>



                    {/* Bottom actions */}
                    <div className="mt-auto pt-1 flex flex-col gap-2">
                        {/* Reset — always visible */}
                        <button
                            id="tour-reset"
                            onClick={resetDashboard}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded border border-white/8 hover:border-red-500/30 text-white/25 hover:text-red-400 text-[10px] font-semibold transition-all cursor-pointer group"
                        >
                            <RotateCcw size={11} className="group-hover:rotate-[-360deg] transition-transform duration-500" />
                            Restore Default View
                        </button>

                    </div>
                </div>
            </div>

            {/* ══════════════════════════════ RIGHT PANEL ═════════════════════════════ */}
            <div id="tour-right-panel" className={rightPanelClass}>
                {/* Mobile drag handle */}
                <div className="flex justify-center pt-2.5 pb-0.5 md:hidden shrink-0">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                <div className="flex-1 p-5 overflow-y-auto custom-scrollbar flex flex-col gap-5">

                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <button
                            onClick={() => isMobile ? setMobilePanel(null) : setIsRightCollapsed(true)}
                            className="p-1.5 hover:bg-brand-gold/10 text-brand-gold/50 hover:text-brand-gold border border-brand-gold/20 rounded transition-colors cursor-pointer shrink-0"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <div className="flex flex-col items-end gap-0.5">
                            <h2 className="text-white text-sm font-bold flex items-center gap-2">
                                Carbon Metrics <BarChart3 size={13} className="text-brand-gold/50" />
                            </h2>
                            <p className="text-[9px] text-white/25 font-medium">
                                {selectedDistrict || selectedRegion || 'Ghana · National'}
                            </p>
                        </div>
                    </div>

                    {/* Metrics error */}
                    {metricsError && (
                        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-bold text-red-400 mb-0.5">Unable to load metrics</p>
                                <p className="text-[10px] text-red-300/70 leading-snug">{metricsError}</p>
                            </div>
                            <button onClick={() => setMetricsError(null)} className="shrink-0 text-red-400/50 hover:text-red-400 transition-colors">
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    {/* Takeaway */}
                    {!loadingMetrics && takeaway && (
                        <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border ${takeawayStyle[takeaway.type]}`}>
                            <div className={`w-1.5 h-1.5 rounded-full mt-[3px] shrink-0 ${takeawayDot[takeaway.type]}`} />
                            <span className="text-[10px] font-medium text-white/55 leading-snug">{takeaway.text}</span>
                        </div>
                    )}

                    {/* KPI cards */}
                    <div className={`flex flex-col gap-3 transition-opacity duration-300 ${loadingMetrics ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        {loadingMetrics && (
                            <div className="flex items-center justify-center gap-2 py-1">
                                <Loader2 size={12} className="animate-spin text-brand-gold/50" />
                                <span className="text-[9px] font-medium text-brand-gold/40">Updating values...</span>
                            </div>
                        )}
                        <KPI
                            label="Forest Carbon Stock"
                            value={stockFmt.value}
                            suffix={stockFmt.suffix}
                            unit={stockFmt.unit}
                            trendValue={stockTrend}
                            absoluteDelta={metrics.prevCarbonStock ? metrics.carbonStock - metrics.prevCarbonStock : null}
                            prevYear={selectedYear ? selectedYear - 1 : null}
                            icon={TreePine}
                        />
                        <KPI
                            label="Mining-Driven Loss"
                            value={lossFmt.value}
                            suffix={lossFmt.suffix}
                            unit={lossFmt.unit}
                            trendValue={lossTrend}
                            absoluteDelta={metrics.prevCarbonLoss ? metrics.carbonLoss - metrics.prevCarbonLoss : null}
                            prevYear={selectedYear ? selectedYear - 1 : null}
                            invertColor={true}
                            icon={Pickaxe}
                        />
                    </div>

                    {/* Year comparison panel */}
                    {compareMode && (
                        <div className="rounded-xl border border-brand-gold/15 bg-brand-gold/[0.03]">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-brand-gold/10">
                                <span className="text-[9px] font-semibold text-brand-gold/40">
                                    {selectedYear} vs {compareYear || '—'}
                                </span>
                                {loadingCompare && <Loader2 size={10} className="animate-spin text-brand-gold/40" />}
                            </div>
                            {compareMetrics ? (
                                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 min-[420px]:divide-x divide-brand-gold/10">
                                    {/* Stock cell */}
                                    <div className="px-3 py-3 flex flex-col gap-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[8px] font-semibold text-white/25 uppercase tracking-wide">Stock</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5 min-w-0">
                                            <div className="grid grid-cols-[auto,minmax(0,1fr)] items-start gap-2 min-w-0">
                                                <span className="text-[8px] text-white/30 tabular-nums shrink-0">{selectedYear}</span>
                                                <span className="text-[clamp(10px,2.4vw,11px)] leading-tight font-black text-white/75 tabular-nums text-right min-w-0 break-words">{fmtNum(metrics.carbonStock)}</span>
                                            </div>
                                            <div className="grid grid-cols-[auto,minmax(0,1fr)] items-start gap-2 min-w-0">
                                                <span className="text-[8px] text-white/30 tabular-nums shrink-0">{compareYear}</span>
                                                <span className="text-[clamp(9px,2.2vw,10px)] leading-tight font-bold text-white/40 tabular-nums text-right min-w-0 break-words">{fmtNum(compareMetrics.carbonStock)}</span>
                                            </div>
                                        </div>
                                        {stockDelta !== null && (
                                            <div className={`flex flex-wrap items-center gap-x-1 gap-y-0.5 mt-1 pt-1 border-t border-white/5 text-[8px] sm:text-[9px] leading-tight font-bold tabular-nums ${stockDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {stockDelta >= 0 ? <ArrowUp size={9} strokeWidth={2.5} className="shrink-0" /> : <ArrowDown size={9} strokeWidth={2.5} className="shrink-0" />}
                                                <span>{Math.abs(stockDelta).toFixed(1)}%</span>
                                                <span className="text-current/80">{stockDelta >= 0 ? 'increase' : 'decrease'}</span>
                                            </div>
                                        )}
                                    </div>
                                    {/* Loss cell */}
                                    <div className="px-3 py-3 flex flex-col gap-1 min-w-0 border-t border-brand-gold/10 min-[420px]:border-t-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                                            <span className="text-[8px] font-semibold text-white/25 uppercase tracking-wide">Loss</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5 min-w-0">
                                            <div className="grid grid-cols-[auto,minmax(0,1fr)] items-start gap-2 min-w-0">
                                                <span className="text-[8px] text-white/30 tabular-nums shrink-0">{selectedYear}</span>
                                                <span className="text-[clamp(10px,2.4vw,11px)] leading-tight font-black text-white/75 tabular-nums text-right min-w-0 break-words">{fmtNum(metrics.carbonLoss)}</span>
                                            </div>
                                            <div className="grid grid-cols-[auto,minmax(0,1fr)] items-start gap-2 min-w-0">
                                                <span className="text-[8px] text-white/30 tabular-nums shrink-0">{compareYear}</span>
                                                <span className="text-[clamp(9px,2.2vw,10px)] leading-tight font-bold text-white/40 tabular-nums text-right min-w-0 break-words">{fmtNum(compareMetrics.carbonLoss)}</span>
                                            </div>
                                        </div>
                                        {lossDelta !== null && (
                                            <div className={`flex flex-wrap items-center gap-x-1 gap-y-0.5 mt-1 pt-1 border-t border-white/5 text-[8px] sm:text-[9px] leading-tight font-bold tabular-nums ${lossDelta <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {lossDelta >= 0 ? <ArrowUp size={9} strokeWidth={2.5} className="shrink-0" /> : <ArrowDown size={9} strokeWidth={2.5} className="shrink-0" />}
                                                <span>{Math.abs(lossDelta).toFixed(1)}%</span>
                                                <span className="text-current/80">{lossDelta >= 0 ? 'increase' : 'decrease'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="px-3 py-4 text-center text-[9px] text-white/20 font-medium">
                                    {loadingCompare ? 'Loading comparison...' : compareYear ? 'No comparison data available for the selected year' : 'Select a comparison year in the filters panel'}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="h-px bg-white/5 w-full" />

                    {/* Loss trend */}
                    <div className="flex flex-col gap-3">
                        <span className="text-[9px] font-semibold text-white/30">Loss Trend</span>
                        <LossChart data={metrics.trend} loading={loadingMetrics} />
                    </div>

                    <div className="h-px bg-white/5 w-full" />

                    {/* ── Data Sources ─────────────────────────────── */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5">
                            <Database size={9} className="text-white/20" />
                            <span className="text-[9px] font-semibold text-white/25 uppercase tracking-widest">Data Sources</span>
                        </div>
                        {selectedLayers.filter(id => LAYER_INFO[id]).map(layerId => {
                            const info = LAYER_INFO[layerId];
                            return (
                                <div key={layerId} className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                    <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${info.dot}`} />
                                    <div className="flex flex-col gap-1.5 min-w-0">
                                        <span className="text-[10px] font-semibold text-white/55 leading-none">{info.name}</span>
                                        <span className="text-[9px] text-white/25 leading-snug">{info.source}</span>
                                        <div className="flex gap-1 flex-wrap">
                                            {[info.sensor, info.resolution, info.cadence].map((tag, i) => (
                                                <span key={i} className="text-[7px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/5 text-white/25">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>

                {/* Status bar */}
                <div className="px-5 py-3 bg-brand-gold/5 border-t border-brand-gold/10 flex items-center justify-between shrink-0">
                    <span className="text-[8px] font-medium text-white/20">
                        {selectedRegion ? `${selectedDistrict || selectedRegion} · ${selectedYear}` : `Ghana · ${selectedYear}`}
                    </span>
                    <div className={`w-1.5 h-1.5 rounded-full ${systemStatus.dotClass}`} />
                </div>
            </div>

            {/* Desktop reveal buttons */}
            <button
                onClick={() => setIsLeftCollapsed(false)}
                className={`hidden md:block absolute top-20 left-4 z-30 p-3 bg-brand-deep/95 border border-brand-gold/40 text-brand-gold rounded shadow-2xl transition-all duration-300 cursor-pointer ${isLeftCollapsed ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-20 opacity-0 pointer-events-none scale-90'}`}
                title="Open Filters"
            >
                <Menu size={20} />
            </button>
            <button
                onClick={() => setIsRightCollapsed(false)}
                className={`hidden md:block absolute top-20 right-4 z-30 p-3 bg-brand-deep/95 border border-brand-gold/40 text-brand-gold rounded shadow-2xl transition-all duration-300 cursor-pointer ${isRightCollapsed ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-20 opacity-0 pointer-events-none scale-90'}`}
                title="Open Metrics"
            >
                <BarChart3 size={20} />
            </button>

            {/* Legend floating panel + button — desktop only, mirrors zoom controls pattern */}
            <div className={`hidden md:flex absolute bottom-12 z-30 flex-col gap-3 items-start transition-all duration-500 ${isLeftCollapsed ? 'left-6' : 'left-[336px]'}`}>
                {isLegendOpen && (
                    <div className="mb-1 animate-in fade-in slide-in-from-left-4 duration-200">
                        <LegendPanel
                            isOpen={isLegendOpen}
                            onClose={() => setIsLegendOpen(false)}
                            activeLayers={selectedLayers}
                            className=""
                        />
                    </div>
                )}
                <GlassPanel className="flex flex-col gap-1 p-1 shadow-2xl rounded-lg">
                    <button
                        onClick={() => setIsLegendOpen(!isLegendOpen)}
                        className={`p-2.5 transition-all rounded cursor-pointer ${isLegendOpen ? 'text-brand-gold bg-brand-gold/20' : 'text-brand-faded hover:text-white hover:bg-brand-gold/20'}`}
                        title="Toggle Legend"
                    >
                        <Layers size={18} />
                    </button>
                </GlassPanel>
            </div>

            {/* Map controls — desktop only */}
            <div className={`hidden md:flex absolute bottom-12 z-30 flex-col gap-3 items-end transition-all duration-500 ${isRightCollapsed ? 'right-6' : 'right-[336px]'}`}>
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
                                    className={`px-3 py-2.5 text-[10px] font-semibold text-left rounded transition-colors ${basemap === opt.id ? 'bg-brand-gold/20 text-brand-gold' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </GlassPanel>
                    </div>
                )}
                <GlassPanel className="flex flex-col gap-1 p-1 shadow-2xl rounded-lg">
                    <button onClick={() => setZoomCommand({ type: 'in', t: Date.now() })} className="p-2.5 text-brand-faded hover:text-white hover:bg-brand-gold/20 transition-all rounded cursor-pointer" title="Zoom In">
                        <Plus size={18} />
                    </button>
                    <div className="h-px bg-brand-gold/10 mx-2" />
                    <button onClick={() => setZoomCommand({ type: 'out', t: Date.now() })} className="p-2.5 text-brand-faded hover:text-white hover:bg-brand-gold/20 transition-all rounded cursor-pointer" title="Zoom Out">
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

            {/* About modal — shows on first visit */}
            <AboutModal onOpenTour={() => setTourTrigger(t => !t)} />

            {/* Tour guide — desktop only, auto-starts on first visit */}
            <TourGuide autoStart={tourTrigger} />

            {/* Mobile bottom nav */}
            <div className="fixed bottom-0 left-0 right-0 z-50 h-14 bg-brand-deep/95 backdrop-blur-md border-t border-brand-gold/20 flex items-stretch md:hidden">
                <button
                    onClick={() => setMobilePanel(p => p === 'left' ? null : 'left')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${mobilePanel === 'left' ? 'text-brand-gold' : 'text-white/25'}`}
                >
                    <Menu size={18} />
                    <span className="text-[8px] font-semibold">Filters</span>
                </button>
                <div className="w-px bg-brand-gold/10 my-3" />
                <button
                    onClick={() => setMobilePanel(p => p === 'right' ? null : 'right')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${mobilePanel === 'right' ? 'text-brand-gold' : 'text-white/25'}`}
                >
                    <BarChart3 size={18} />
                    <span className="text-[8px] font-semibold">Metrics</span>
                </button>
            </div>
        </div>
    );
}
