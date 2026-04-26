"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
    AlertTriangle,
    BarChart3,
    ChevronDown,
    ChevronUp,
    Crosshair,
    Database,
    HelpCircle,
    Info,
    Layers,
    Loader2,
    MapPin,
    Maximize2,
    Menu,
    Minimize2,
    Minus,
    Plus,
    RotateCcw,
    Share2,
    TreePine,
    Pickaxe,
} from 'lucide-react';

import { GlassPanel } from './GlassPanel';
import { TourGuide } from './TourGuide';
import { AboutModal } from './AboutModal';
import { LossChart } from './LossChart';
import { BrandMark } from './BrandMark';

const ABOUT_KEY = 'ecopulse_about_seen';
const ANALYSIS_SCOPES = {
    region: 'Region',
    district: 'District',
};

const LAYER_INFO = {
    carbon: { name: 'Carbon stock', source: 'GEDI mosaics and Google Satellite Embeddings', dot: 'bg-emerald-500' },
    mining: { name: 'Mining loss', source: 'Planet NICFI and U-Net mining activity detection', dot: 'bg-red-500' },
    region: { name: 'Region boundary', source: 'Ghana Statistical Service (GSS)', dot: 'bg-white/50' },
    district: { name: 'District boundary', source: 'Ghana Statistical Service (GSS)', dot: 'bg-yellow-400' },
};

function computeTakeaway(metrics, selectedYear, selectedRegion, selectedDistrict) {
    const { carbonStock, carbonLoss, prevCarbonLoss } = metrics;

    if (prevCarbonLoss > 0 && carbonLoss > 0) {
        const change = ((carbonLoss - prevCarbonLoss) / prevCarbonLoss) * 100;
        if (Math.abs(change) > 3) {
            return change > 0
                ? `Mining-related loss increased by ${change.toFixed(0)}% relative to ${(selectedYear || 2024) - 1}.`
                : `Mining-related loss decreased by ${Math.abs(change).toFixed(0)}% relative to ${(selectedYear || 2024) - 1}.`;
        }
        return `Mining-related loss was broadly unchanged from ${(selectedYear || 2024) - 1}.`;
    }

    if (carbonStock > 0 && carbonLoss > 0) {
        const ratio = (carbonLoss / carbonStock) * 100;
        return `Estimated loss equals ${ratio.toFixed(ratio > 1.5 ? 1 : 2)}% of total forest carbon stock.`;
    }

    if (!selectedRegion) return 'Choose a region to begin.';
    if (!selectedDistrict) return `Showing totals for all districts in ${selectedRegion}.`;
    return `Showing district-level results for ${selectedDistrict} in ${selectedYear}.`;
}

const MapComponent = dynamic(() => import('./Map'), {
    ssr: false,
    loading: () => (
        <div className="flex h-full w-full items-center justify-center bg-brand-deep text-brand-gold">
            <div className="flex items-center gap-3">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-[11px] font-medium tracking-[0.04em]">Loading layers</span>
            </div>
        </div>
    ),
});

function compactValue(val) {
    const num = parseFloat(val) || 0;
    if (num >= 1_000_000) return { value: (num / 1_000_000).toFixed(1), suffix: 'M' };
    if (num >= 1_000) return { value: (num / 1_000).toFixed(1), suffix: 'k' };
    return { value: num.toFixed(0), suffix: '' };
}

function formatPercent(base, current) {
    if (!base) return null;
    return ((current - base) / base) * 100;
}

function FloatingToggle({ label, active, onToggle, icon: Icon, iconColor }) {
    return (
        <button onClick={onToggle} className="flex w-full items-center justify-between gap-3 py-2 text-left">
            <div className="flex min-w-0 items-center gap-2.5">
                <Icon size={15} strokeWidth={1.6} style={{ color: iconColor }} className={`shrink-0 transition-opacity ${active ? 'opacity-100' : 'opacity-35'}`} />
                <span className={`text-[10px] font-medium transition-colors ${active ? 'text-white/75' : 'text-white/35'}`}>{label}</span>
            </div>
            <div className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${active ? 'bg-brand-gold/85' : 'bg-white/12'}`}>
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${active ? 'right-0.5' : 'left-0.5 bg-white/70'}`} />
            </div>
        </button>
    );
}

function MetricStrip({ label, value, suffix, delta, icon: Icon, accentClass }) {
    return (
        <div className="grid grid-cols-[minmax(0,1fr),auto] gap-3 py-3">
            <div className="min-w-0">
                <div className="flex items-center gap-2 text-white/42">
                    <Icon size={12} className={accentClass} />
                    <span className="text-[10px] font-medium">{label}</span>
                </div>
                <div className="mt-1.5 flex items-end gap-1.5">
                    <span className="font-display text-[1.8rem] leading-none text-[#f3efe4]">{value}</span>
                    {suffix ? <span className="font-display pb-0.5 text-[1rem] leading-none text-white/54">{suffix}</span> : null}
                </div>
                <span className="mt-1 block text-[9px] text-white/28">tonnes C</span>
            </div>
            <div className="flex min-w-[64px] items-end justify-end">
                <span className={`font-mono text-[9px] ${delta === null ? 'text-white/26' : delta >= 0 ? 'text-[#9a5d3f]' : 'text-[#6f8f63]'}`}>
                    {delta === null ? '-' : `${delta >= 0 ? '+' : '-'}${Math.abs(delta).toFixed(1)}%`}
                </span>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [isMobile, setIsMobile] = useState(false);
    const [mobilePanel, setMobilePanel] = useState(null);
    const [isSetupOpen, setIsSetupOpen] = useState(true);
    const [isFindingsOpen, setIsFindingsOpen] = useState(true);
    const [tourTrigger, setTourTrigger] = useState(0);
    const [isAboutOpen, setIsAboutOpen] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const seen = window.localStorage.getItem(ABOUT_KEY);
        if (seen) return;
        const timeoutId = window.setTimeout(() => setIsAboutOpen(true), 600);
        return () => window.clearTimeout(timeoutId);
    }, []);

    const [zoomCommand, setZoomCommand] = useState(null);
    const [mapCommand, setMapCommand] = useState(null);
    const [basemap, setBasemap] = useState('dark');
    const [showBasemaps, setShowBasemaps] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);

    const [years, setYears] = useState([]);
    const [regions, setRegions] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [analysisScope, setAnalysisScope] = useState('region');
    const [draftYear, setDraftYear] = useState(null);
    const [draftRegion, setDraftRegion] = useState('');
    const [draftDistrict, setDraftDistrict] = useState('');
    const [activeYear, setActiveYear] = useState(null);
    const [activeRegion, setActiveRegion] = useState('');
    const [activeDistrict, setActiveDistrict] = useState('');

    const [metrics, setMetrics] = useState({ carbonStock: 0, carbonLoss: 0, prevCarbonStock: 0, prevCarbonLoss: 0, trend: [] });
    const [loading, setLoading] = useState(true);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingMetrics, setLoadingMetrics] = useState(false);
    const [metadataError, setMetadataError] = useState(null);
    const [metricsError, setMetricsError] = useState(null);
    const [districtsError, setDistrictsError] = useState(null);

    const [selectedLayers, setSelectedLayers] = useState(['carbon', 'mining']);

    const toggleLayer = (id) => {
        setSelectedLayers(prev => prev.includes(id) ? prev.filter(layer => layer !== id) : [...prev, id]);
    };

    const resetDashboard = useCallback(() => {
        setDraftRegion('');
        setDraftDistrict('');
        setActiveRegion('');
        setActiveDistrict('');
        setDistricts([]);
        setAnalysisScope('region');
        setSelectedLayers(['carbon', 'mining']);
        setMetrics({ carbonStock: 0, carbonLoss: 0, prevCarbonStock: 0, prevCarbonLoss: 0, trend: [] });
        setMetadataError(null);
        setMetricsError(null);
        setDistrictsError(null);
        if (years.length > 0) {
            const latestYear = parseInt(years[years.length - 1]);
            setDraftYear(latestYear);
            setActiveYear(null);
        }
        setMapCommand({ type: 'reset', t: Date.now() });
    }, [years]);

    const closeAboutModal = useCallback(() => {
        if (typeof window !== 'undefined') window.localStorage.setItem(ABOUT_KEY, '1');
        setIsAboutOpen(false);
    }, []);

    const openTourFromAbout = useCallback(() => {
        closeAboutModal();
        setTourTrigger(prev => prev + 1);
    }, [closeAboutModal]);

    const handleLocate = useCallback(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setMapCommand({ type: 'flyTo', lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 13, t: Date.now() }),
            () => {}
        );
    }, []);

    const handleShare = useCallback(() => {
        const params = new URLSearchParams();
        if (activeYear)     params.set('year',     activeYear);
        if (activeRegion)   params.set('region',   activeRegion);
        if (activeDistrict) params.set('district', activeDistrict);
        if (activeDistrict) params.set('scope',    'district');
        const url = `${window.location.origin}${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        const confirm = () => { setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); };
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(confirm).catch(() => {});
        } else {
            const ta = document.createElement('textarea');
            ta.value = url;
            ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            confirm();
        }
    }, [activeYear, activeRegion, activeDistrict]);

    const handleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }, []);

    useEffect(() => {
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const hasActiveAnalysis = !!activeRegion;
    const hasDraftLocation = analysisScope === 'district' ? !!draftRegion && !!draftDistrict : !!draftRegion;
    const canRunAnalysis = !!draftYear && hasDraftLocation;
    const hasPendingChanges = draftYear !== activeYear || draftRegion !== activeRegion || draftDistrict !== activeDistrict;
    const sliderFill = years.length > 1 && draftYear ? ((draftYear - years[0]) / (years[years.length - 1] - years[0])) * 100 : 0;

    const takeaway = useMemo(
        () => computeTakeaway(metrics, activeYear, activeRegion, activeDistrict),
        [metrics, activeYear, activeRegion, activeDistrict]
    );

    const visibleLegendLayers = useMemo(
        () => selectedLayers.filter(layerId => {
            if (layerId === 'region') return !!activeRegion;
            if (layerId === 'district') return !!activeDistrict;
            return !!activeYear;
        }),
        [selectedLayers, activeYear, activeRegion, activeDistrict]
    );

    const runAnalysis = useCallback(() => {
        if (!canRunAnalysis) return;
        setActiveYear(draftYear);
        setActiveRegion(draftRegion);
        setActiveDistrict(analysisScope === 'district' ? draftDistrict : '');
        setMetricsError(null);
        if (isMobile) setMobilePanel(null);
    }, [canRunAnalysis, draftYear, draftRegion, draftDistrict, analysisScope, isMobile]);

    useEffect(() => {
        const abortController = new AbortController();
        const fetchMetadata = async () => {
            try {
                setMetadataError(null);
                const response = await fetch('/api/gee/metadata', { signal: abortController.signal });
                if (!response.ok) throw new Error('Failed to connect to Earth Engine. Check server credentials.');
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                setYears(data.years || []);
                setRegions(data.regions || []);
                if (data.years?.length > 0) {
                    setDraftYear(parseInt(data.years[data.years.length - 1]));
                }

                const sp = new URLSearchParams(window.location.search);
                const urlYear     = parseInt(sp.get('year'));
                const urlRegion   = sp.get('region')   || '';
                const urlDistrict = sp.get('district') || '';
                const urlScope    = sp.get('scope')    || 'region';
                if (urlYear && urlRegion
                    && (data.years || []).includes(String(urlYear))
                    && (data.regions || []).includes(urlRegion)) {
                    setDraftYear(urlYear);
                    setDraftRegion(urlRegion);
                    setDraftDistrict(urlDistrict);
                    setAnalysisScope(urlScope);
                    setActiveYear(urlYear);
                    setActiveRegion(urlRegion);
                    setActiveDistrict(urlDistrict);
                }
            } catch (err) {
                if (err.name === 'AbortError') return;
                setMetadataError(err.message);
            } finally {
                if (!abortController.signal.aborted) setLoading(false);
            }
        };
        fetchMetadata();
        return () => abortController.abort();
    }, []);

    useEffect(() => {
        if (!draftRegion) {
            setDistricts([]);
            setDraftDistrict('');
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
                    body: JSON.stringify({ region: draftRegion }),
                    signal: abortController.signal,
                });
                if (!response.ok) throw new Error('Failed to load districts');
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                setDistricts(data.districts || []);
                if (analysisScope !== 'district') setDraftDistrict('');
            } catch (err) {
                if (err.name === 'AbortError') return;
                setDistrictsError(err.message);
                setDistricts([]);
            } finally {
                if (!abortController.signal.aborted) setLoadingDistricts(false);
            }
        };
        fetchDistricts();
        return () => abortController.abort();
    }, [draftRegion, analysisScope]);

    useEffect(() => {
        if (!activeYear || !activeRegion) {
            setMetrics({ carbonStock: 0, carbonLoss: 0, prevCarbonStock: 0, prevCarbonLoss: 0, trend: [] });
            setLoadingMetrics(false);
            return;
        }
        const abortController = new AbortController();
        const fetchMetrics = async () => {
            setLoadingMetrics(true);
            setMetricsError(null);
            try {
                const response = await fetch('/api/gee/metrics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ year: activeYear, region: activeRegion, district: activeDistrict, years }),
                    signal: abortController.signal,
                });
                if (!response.ok) throw new Error('Failed to load metrics');
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                setMetrics(data);
            } catch (err) {
                if (err.name === 'AbortError') return;
                setMetricsError(err.message);
            } finally {
                if (!abortController.signal.aborted) setLoadingMetrics(false);
            }
        };
        fetchMetrics();
        return () => abortController.abort();
    }, [activeYear, activeRegion, activeDistrict, years]);

    useEffect(() => {
        if (activeRegion) {
            setSelectedLayers(prev => prev.includes('region') ? prev : [...prev, 'region']);
        }
    }, [activeRegion]);

    useEffect(() => {
        setSelectedLayers(prev => {
            if (activeDistrict) return prev.includes('district') ? prev : [...prev, 'district'];
            return prev.includes('district') ? prev.filter(layer => layer !== 'district') : prev;
        });
    }, [activeDistrict]);

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-brand-deep">
                <div className="flex flex-col items-center gap-8">
                    <div className="relative flex h-16 w-16 items-center justify-center">
                        <div className="canopy-ring" />
                        <div className="canopy-ring" />
                        <div className="canopy-ring" />
                        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-brand-gold/30 bg-brand-gold/10">
                            <TreePine size={18} className="text-brand-gold" />
                        </div>
                    </div>
                    <p className="text-sm font-medium tracking-[0.02em] text-white/78">Loading dashboard data</p>
                </div>
            </div>
        );
    }

    const stockFmt = compactValue(metrics.carbonStock);
    const lossFmt = compactValue(metrics.carbonLoss);
    const stockDelta = formatPercent(metrics.prevCarbonStock, metrics.carbonStock);
    const lossDelta = formatPercent(metrics.prevCarbonLoss, metrics.carbonLoss);

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-brand-deep text-white selection:bg-brand-gold/30">
            <div className="absolute inset-0 z-0">
                <MapComponent
                    year={activeYear}
                    region={activeRegion}
                    district={activeDistrict}
                    activeLayers={selectedLayers}
                    zoomCommand={zoomCommand}
                    mapCommand={mapCommand}
                    basemap={basemap}
                />
            </div>

            <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_42%,rgba(14,11,8,0.58)_100%)]" />

            <div className="absolute left-4 top-4 z-40 flex items-start gap-3 md:left-6 md:top-6">
                <GlassPanel className="pointer-events-auto w-[18rem] rounded-2xl border-white/10">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <BrandMark className="h-9 w-9 shrink-0" />
                        <div className="min-w-0">
                            <h1 className="font-display text-[1.3rem] leading-none text-[#f3efe4]">EcoPulse</h1>
                            <p className="mt-1 text-[9px] tracking-[0.12em] text-white/34 uppercase">Forest Carbon Monitoring</p>
                        </div>
                    </div>
                </GlassPanel>
            </div>

            <div className="absolute right-4 top-4 z-40 hidden items-center gap-2 md:flex">
                {activeYear ? (
                    <GlassPanel className="pointer-events-auto rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2 text-[10px] text-white/62">
                            <MapPin size={11} />
                            <span className="font-mono">{activeDistrict || activeRegion}</span>
                        </div>
                    </GlassPanel>
                ) : null}
                {activeYear ? (
                    <GlassPanel className="pointer-events-auto rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2 text-[10px] text-white/62">
                            <Database size={11} />
                            <span className="font-mono">{activeYear}</span>
                        </div>
                    </GlassPanel>
                ) : null}
                <GlassPanel className="pointer-events-auto rounded-xl p-1">
                    <button onClick={() => setTourTrigger(prev => prev + 1)} className="rounded-lg px-3 py-2 text-[10px] text-white/58 transition-colors hover:bg-white/6 hover:text-white">
                        <span className="flex items-center gap-2"><HelpCircle size={11} /> Help</span>
                    </button>
                </GlassPanel>
                <GlassPanel className="pointer-events-auto rounded-xl p-1">
                    <button onClick={() => setIsAboutOpen(true)} className="rounded-lg px-3 py-2 text-[10px] text-white/58 transition-colors hover:bg-white/6 hover:text-white">
                        <span className="flex items-center gap-2"><Info size={11} /> About</span>
                    </button>
                </GlassPanel>
            </div>

            {mobilePanel !== null ? <div className="fixed inset-0 z-30 bg-black/55 md:hidden" onClick={() => setMobilePanel(null)} /> : null}

            <div id="tour-setup-panel" className={`absolute left-4 top-24 z-40 w-[20rem] max-w-[calc(100vw-2rem)] transition-transform duration-300 ${isMobile ? (mobilePanel === 'setup' ? 'translate-y-0' : '-translate-y-[120%]') : ''}`}>
                <GlassPanel className="pointer-events-auto rounded-2xl border-white/10">
                    <div className="border-b border-white/8 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.14em] text-white/80 uppercase">Setup</p>
                                <p className="mt-1 text-[10px] leading-snug text-white/50">Choose area and year, then run the analysis.</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsSetupOpen(prev => !prev)}
                                    className="rounded-lg p-2 text-white/34 transition-colors hover:bg-white/6 hover:text-white"
                                    title={isSetupOpen ? 'Collapse setup' : 'Expand setup'}
                                >
                                    {isSetupOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>
                                <button onClick={resetDashboard} className="rounded-lg p-2 text-white/34 transition-colors hover:bg-white/6 hover:text-white" title="Reset">
                                    <RotateCcw size={12} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {isSetupOpen && (
                    <div className="space-y-4 px-4 py-4">
                        {metadataError ? (
                            <div className="border border-red-500/30 bg-red-500/10 px-3 py-2 text-[9px] text-red-200/76">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle size={11} className="mt-0.5 shrink-0 text-red-300" />
                                    <span>{metadataError}</span>
                                </div>
                            </div>
                        ) : null}

                        <div className="space-y-2">
                            <span className="text-[9px] tracking-[0.12em] text-white/30 uppercase">Scope</span>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(ANALYSIS_SCOPES).map(([scopeId, label]) => (
                                    <button
                                        key={scopeId}
                                        onClick={() => {
                                            setAnalysisScope(scopeId);
                                            if (scopeId === 'region') setDraftDistrict('');
                                        }}
                                        className={`border px-3 py-2 text-[10px] font-medium transition-colors ${analysisScope === scopeId ? 'border-brand-gold/55 bg-brand-gold/10 text-[#dfbd84]' : 'border-white/10 text-white/46 hover:border-white/20 hover:text-white/78'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="mb-1.5 block text-[9px] tracking-[0.12em] text-white/30 uppercase">Region</label>
                                <select value={draftRegion} onChange={(e) => { setDraftRegion(e.target.value); setDraftDistrict(''); }} className="h-11 w-full appearance-none border border-white/10 bg-[#0f1114] px-3 text-[11px] font-medium text-white outline-none transition-colors focus:border-brand-gold/60">
                                    <option value="" className="bg-brand-deep">Select region</option>
                                    {regions.map(region => <option key={region} value={region} className="bg-brand-deep">{region}</option>)}
                                </select>
                            </div>
                            {analysisScope === 'district' ? (
                                <div>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <label className="block text-[9px] tracking-[0.12em] text-white/30 uppercase">District</label>
                                        {loadingDistricts ? <Loader2 size={10} className="animate-spin text-brand-gold/50" /> : null}
                                    </div>
                                    <select value={draftDistrict} onChange={(e) => setDraftDistrict(e.target.value)} disabled={loadingDistricts || !draftRegion} className="h-11 w-full appearance-none border border-white/10 bg-[#0f1114] px-3 text-[11px] font-medium text-white outline-none transition-colors focus:border-brand-gold/60 disabled:cursor-not-allowed disabled:opacity-40">
                                        <option value="" className="bg-brand-deep">{!draftRegion ? 'Select a region first' : 'Select district'}</option>
                                        {districts.map(district => <option key={district} value={district} className="bg-brand-deep">{district}</option>)}
                                    </select>
                                    {districtsError ? <p className="mt-1 text-[9px] text-red-300/70">{districtsError}</p> : null}
                                </div>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] tracking-[0.12em] text-white/30 uppercase">Year</span>
                                <span className="font-mono text-[12px] text-brand-gold">{draftYear}</span>
                            </div>
                            <input
                                type="range"
                                min={years[0] || 2015}
                                max={years[years.length - 1] || 2024}
                                step="1"
                                value={draftYear || years[years.length - 1] || 2024}
                                onChange={(e) => setDraftYear(parseInt(e.target.value))}
                                className="year-slider"
                                style={{ background: `linear-gradient(to right, #d0542c 0%, #d0542c ${sliderFill}%, rgba(255,255,255,0.10) ${sliderFill}%, rgba(255,255,255,0.10) 100%)` }}
                            />
                            {years.length > 0 ? (
                                <div className="flex justify-between">
                                    {years.map((year) => (
                                        <span key={year} className={`font-mono text-[8px] ${parseInt(year) === draftYear ? 'text-brand-gold/78' : 'text-white/18'}`}>
                                            {String(year).slice(-2)}
                                        </span>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        <button onClick={runAnalysis} disabled={!canRunAnalysis} className="w-full bg-[#d0542c] px-4 py-3 text-[10px] font-semibold tracking-[0.06em] text-[#120f0c] transition-colors hover:bg-[#e37148] disabled:cursor-not-allowed disabled:opacity-40">
                            {hasPendingChanges && hasActiveAnalysis ? 'Update Analysis' : 'Run Analysis'}
                        </button>

                        <div>
                            <span className="text-[10px] font-bold tracking-[0.14em] text-white/80 uppercase">Legend</span>
                            <div className="mt-2">
                                <FloatingToggle label="Carbon stock" active={selectedLayers.includes('carbon')} onToggle={() => toggleLayer('carbon')} icon={TreePine} iconColor="#6f8f63" />
                                <FloatingToggle label="Mining loss" active={selectedLayers.includes('mining')} onToggle={() => toggleLayer('mining')} icon={Pickaxe} iconColor="#e05252" />
                                {hasActiveAnalysis ? <FloatingToggle label="Region boundary" active={selectedLayers.includes('region')} onToggle={() => toggleLayer('region')} icon={Layers} iconColor="#c8c8c8" /> : null}
                                {activeDistrict ? <FloatingToggle label="District boundary" active={selectedLayers.includes('district')} onToggle={() => toggleLayer('district')} icon={MapPin} iconColor="#d4b27a" /> : null}
                            </div>
                        </div>
                    </div>
                    )}
                </GlassPanel>
            </div>

            <div id="tour-findings-panel" className={`absolute right-4 top-24 z-40 w-[22rem] max-w-[calc(100vw-2rem)] md:right-6 ${isMobile ? (mobilePanel === 'findings' ? 'translate-y-0' : '-translate-y-[120%] transition-transform duration-300') : ''}`}>
                <GlassPanel className="pointer-events-auto border-white/10">
                    <div className="border-b border-white/8 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold tracking-[0.14em] text-white/80 uppercase">Analysis Results</p>
                                <p className="mt-1 text-[10px] leading-snug text-white/50">{activeDistrict || activeRegion || 'No analysis yet'}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {loadingMetrics ? <Loader2 size={12} className="animate-spin text-brand-gold/50" /> : null}
                                <button
                                    onClick={() => setIsFindingsOpen(prev => !prev)}
                                    className="rounded-lg p-1.5 text-white/34 transition-colors hover:bg-white/6 hover:text-white"
                                    title={isFindingsOpen ? 'Collapse' : 'Expand'}
                                >
                                    {isFindingsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {isFindingsOpen && (
                    <div className="px-4 py-4">
                        {!hasActiveAnalysis ? (
                            <p className="text-[11px] leading-relaxed text-white/42">
                                Select a place and year, then run the analysis to populate this panel.
                            </p>
                        ) : (
                            <>
                                {metricsError ? (
                                    <div className="border border-red-500/30 bg-red-500/10 px-3 py-2 text-[9px] text-red-200/76">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle size={11} className="mt-0.5 shrink-0 text-red-300" />
                                            <span>{metricsError}</span>
                                        </div>
                                    </div>
                                ) : null}

                                <p className="font-display text-[1.1rem] leading-snug text-[#f3efe4]">{takeaway}</p>

                                <div className="mt-4">
                                    <MetricStrip label="Forest carbon stock" value={stockFmt.value} suffix={stockFmt.suffix} delta={stockDelta} icon={TreePine} accentClass="text-[#6f8f63]" />
                                    <MetricStrip label="Mining-driven loss" value={lossFmt.value} suffix={lossFmt.suffix} delta={lossDelta} icon={Pickaxe} accentClass="text-[#d0542c]" />
                                </div>

                                <div className="mt-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-[9px] tracking-[0.12em] text-white/30 uppercase">Trend</span>
                                        <span className="font-mono text-[9px] text-white/28">{activeYear}</span>
                                    </div>
                                    <LossChart data={metrics.trend} loading={loadingMetrics} />
                                </div>

                                <div className="mt-4">
                                    <div className="mb-2 flex items-center gap-2 text-white/36">
                                        <Database size={10} />
                                        <span className="text-[9px] tracking-[0.12em] uppercase">Sources</span>
                                    </div>
                                    <div className="space-y-2">
                                        {visibleLegendLayers.filter(id => LAYER_INFO[id]).map(layerId => {
                                            const info = LAYER_INFO[layerId];
                                            return (
                                                <div key={layerId} className="grid grid-cols-[10px,minmax(0,1fr)] gap-2">
                                                    <div className={`mt-1.5 h-2 w-2 rounded-full ${info.dot}`} />
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-medium text-white/68">{info.name}</p>
                                                        <p className="mt-0.5 text-[9px] leading-snug text-white/28">{info.source}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    )}
                </GlassPanel>
            </div>


            {/* Map controls — bottom-centre, horizontal, clear of both panels */}
            <div className="absolute bottom-6 left-1/2 z-40 hidden -translate-x-1/2 md:flex items-center gap-2">
                {/* Compass */}
                <button onClick={() => setMapCommand({ type: 'reset', t: Date.now() })} title="Reset view" className="map-ctrl flex h-11 w-11 items-center justify-center rounded-2xl transition-colors hover:bg-white/6">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <polygon points="10,2 12.5,10 10,8.5 7.5,10" fill="#d0542c" />
                        <polygon points="10,18 12.5,10 10,11.5 7.5,10" fill="rgba(255,255,255,0.25)" />
                        <circle cx="10" cy="10" r="1.5" fill="rgba(255,255,255,0.5)" />
                    </svg>
                </button>

                {/* Zoom pill */}
                <div className="map-ctrl flex overflow-hidden rounded-2xl">
                    <button onClick={() => setZoomCommand({ type: 'in', t: Date.now() })} title="Zoom in" className="flex h-11 w-11 items-center justify-center text-white/55 transition-colors hover:bg-white/6 hover:text-white">
                        <Plus size={16} strokeWidth={2} />
                    </button>
                    <div className="my-3 w-px bg-white/8" />
                    <button onClick={() => setZoomCommand({ type: 'out', t: Date.now() })} title="Zoom out" className="flex h-11 w-11 items-center justify-center text-white/55 transition-colors hover:bg-white/6 hover:text-white">
                        <Minus size={16} strokeWidth={2} />
                    </button>
                </div>

                {/* Basemap toggle — picker opens upward */}
                <div className="relative">
                    {showBasemaps ? (
                        <div className="map-ctrl absolute bottom-full left-1/2 mb-2 w-52 -translate-x-1/2 overflow-hidden rounded-2xl">
                            <div className="border-b border-white/8 px-4 py-3">
                                <span className="text-[10px] font-bold tracking-[0.12em] text-white/55 uppercase">Base map</span>
                            </div>
                            <div className="py-1">
                                {[
                                    { id: 'dark', label: 'Dark' },
                                    { id: 'satellite', label: 'Satellite' },
                                    { id: 'osm', label: 'Classic' },
                                ].map((opt) => {
                                    const active = basemap === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => { setBasemap(opt.id); setShowBasemaps(false); }}
                                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${active ? 'bg-brand-gold/8' : 'hover:bg-white/5'}`}
                                        >
                                            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${active ? 'border-brand-gold bg-brand-gold/15' : 'border-white/20'}`}>
                                                {active && <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />}
                                            </span>
                                            <span className={`text-[11px] font-medium transition-colors ${active ? 'text-[#eab08c]' : 'text-white/55'}`}>{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}
                    <button onClick={() => setShowBasemaps(prev => !prev)} title="Basemap" className={`map-ctrl flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${showBasemaps ? 'text-brand-gold' : 'text-white/55 hover:bg-white/6 hover:text-white'}`}>
                        <Layers size={16} strokeWidth={1.6} />
                    </button>
                </div>

                {/* Locate */}
                <button onClick={handleLocate} title="My location" className="map-ctrl flex h-11 w-11 items-center justify-center rounded-2xl text-white/55 transition-colors hover:bg-white/6 hover:text-white">
                    <Crosshair size={16} strokeWidth={1.6} />
                </button>

                {/* Share */}
                <button onClick={handleShare} title={shareCopied ? 'Copied!' : 'Share view'} className={`map-ctrl flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${shareCopied ? 'text-[#6f8f63]' : 'text-white/55 hover:bg-white/6 hover:text-white'}`}>
                    <Share2 size={16} strokeWidth={1.6} />
                </button>

                {/* Fullscreen */}
                <button onClick={handleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} className="map-ctrl flex h-11 w-11 items-center justify-center rounded-2xl text-white/55 transition-colors hover:bg-white/6 hover:text-white">
                    {isFullscreen ? <Minimize2 size={16} strokeWidth={1.6} /> : <Maximize2 size={16} strokeWidth={1.6} />}
                </button>
            </div>

            <AboutModal isOpen={isAboutOpen} onClose={closeAboutModal} onOpenTour={openTourFromAbout} canOpenTour={!isMobile} />
            <TourGuide autoStart={tourTrigger} />

            <div className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-stretch border-t border-white/8 bg-[#121519]/96 backdrop-blur-sm md:hidden">
                <button onClick={() => setMobilePanel(p => p === 'setup' ? null : 'setup')} className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${mobilePanel === 'setup' ? 'text-[#eab08c]' : 'text-white/28'}`}>
                    <Menu size={18} />
                    <span className="text-[8px] font-medium">Setup</span>
                </button>
                <div className="my-3 w-px bg-white/8" />
                <button onClick={() => setMobilePanel(p => p === 'findings' ? null : 'findings')} className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${mobilePanel === 'findings' ? 'text-[#eab08c]' : 'text-white/28'}`}>
                    <BarChart3 size={18} />
                    <span className="text-[8px] font-medium">Findings</span>
                </button>
            </div>
        </div>
    );
}
