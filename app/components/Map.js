"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Suppress Leaflet's broken default marker icon in Next.js/webpack
// Replace with a transparent 1x1 gif so no external request or broken img is rendered
const EMPTY_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: EMPTY_GIF,
    iconRetinaUrl: EMPTY_GIF,
    shadowUrl: EMPTY_GIF,
    iconSize: [0, 0],
    shadowSize: [0, 0],
});

// ─── Map controller: handles bounds fly-to, zoom commands, reset ─────────────
function MapController({ bounds, zoomCommand, mapCommand }) {
    const map = useMap();

    useEffect(() => {
        if (bounds && bounds.length === 2) {
            map.flyToBounds(bounds, { duration: 1.5, easeLinearity: 0.25 });
        }
    }, [bounds, map]);

    useEffect(() => {
        if (!zoomCommand) return;
        if (zoomCommand.type === 'in') map.zoomIn();
        else if (zoomCommand.type === 'out') map.zoomOut();
    }, [zoomCommand, map]);

    useEffect(() => {
        if (!mapCommand) return;
        if (mapCommand.type === 'reset') {
            map.flyTo([7.5, -1.2], 7, { duration: 1.8, easeLinearity: 0.25 });
        }
    }, [mapCommand, map]);

    return null;
}

// ─── Overview district layer (GeoJSON, shown before any selection) ────────────
function OverviewDistrictsLayer({ geojson, onFeatureClick, analysisMode = false }) {
    const map = useMap();
    const tooltipRef = useRef(null);
    const hoveredLayerRef = useRef(null);

    const defaultStyle = analysisMode ? {
        color: 'rgba(255, 255, 255, 0.12)',
        weight: 0.8,
        fillColor: 'transparent',
        fillOpacity: 0,
    } : {
        color: 'rgba(255, 255, 255, 0.18)',
        weight: 1,
        fillColor: 'transparent',
        fillOpacity: 0,
    };

    const hoverStyle = {
        color: 'rgba(251, 191, 36, 0.7)',
        weight: analysisMode ? 1.2 : 1.5,
        fillColor: 'rgba(251, 191, 36, 0.05)',
        fillOpacity: 1,
    };

    const closeTooltip = useCallback(() => {
        if (tooltipRef.current) {
            map.closeTooltip(tooltipRef.current);
            tooltipRef.current = null;
        }
    }, [map]);

    const resetHovered = useCallback(() => {
        if (hoveredLayerRef.current) {
            hoveredLayerRef.current.setStyle(defaultStyle);
            hoveredLayerRef.current = null;
        }
    }, []);

    const onEachFeature = useCallback((feature, layer) => {
        const districtName = feature.properties?.DISTRICTS
            || feature.properties?.District
            || feature.properties?.NAME
            || 'Unknown District';
        const regionName = feature.properties?.REGIONS
            || feature.properties?.Region
            || '';

        layer.on({
            mouseover: (e) => {
                // Always reset previous hovered layer first
                resetHovered();
                closeTooltip();

                hoveredLayerRef.current = e.target;
                e.target.setStyle(hoverStyle);

                tooltipRef.current = L.tooltip({
                    sticky: true,
                    direction: 'top',
                    className: 'eco-tooltip',
                    offset: [0, -4],
                })
                    .setContent(districtName)
                    .setLatLng(e.latlng)
                    .openOn(map);
            },
            mousemove: (e) => {
                if (tooltipRef.current) tooltipRef.current.setLatLng(e.latlng);
            },
            mouseout: () => {
                resetHovered();
                closeTooltip();
            },
            click: (e) => {
                resetHovered();
                closeTooltip();
                map.flyToBounds(e.target.getBounds(), {
                    duration: 1.4,
                    easeLinearity: 0.25,
                    padding: [40, 40],
                });
                onFeatureClick(districtName, regionName);
            },
        });
    }, [map, onFeatureClick, closeTooltip, resetHovered]);

    if (!geojson) return null;

    return (
        <GeoJSON
            key="overview-districts"
            data={geojson}
            style={defaultStyle}
            onEachFeature={onEachFeature}
        />
    );
}

// ─── Overview region layer (GeoJSON, always subtle, shown before any selection)
function OverviewRegionsLayer({ geojson, onRegionClick, analysisMode = false }) {
    const map = useMap();
    const tooltipRef = useRef(null);
    const hoveredLayerRef = useRef(null);

    const defaultStyle = analysisMode ? {
        color: 'rgba(255, 255, 255, 0.20)',
        weight: 1,
        fillColor: 'transparent',
        fillOpacity: 0,
        dashArray: '3 3',
    } : {
        color: 'rgba(255, 255, 255, 0.35)',
        weight: 1.5,
        fillColor: 'transparent',
        fillOpacity: 0,
        dashArray: '4 3',
    };

    const hoverStyle = {
        color: 'rgba(255, 255, 255, 0.7)',
        weight: analysisMode ? 1.5 : 2,
        fillColor: 'rgba(255, 255, 255, 0.03)',
        fillOpacity: 1,
        dashArray: null,
    };

    const closeTooltip = useCallback(() => {
        if (tooltipRef.current) {
            map.closeTooltip(tooltipRef.current);
            tooltipRef.current = null;
        }
    }, [map]);

    const resetHovered = useCallback(() => {
        if (hoveredLayerRef.current) {
            hoveredLayerRef.current.setStyle(defaultStyle);
            hoveredLayerRef.current = null;
        }
    }, []);

    const onEachFeature = useCallback((feature, layer) => {
        const regionName = feature.properties?.REGIONS
            || feature.properties?.Region
            || feature.properties?.NAME
            || 'Unknown Region';

        layer.on({
            mouseover: (e) => {
                resetHovered();
                closeTooltip();

                hoveredLayerRef.current = e.target;
                e.target.setStyle(hoverStyle);

                tooltipRef.current = L.tooltip({
                    sticky: true,
                    direction: 'top',
                    className: 'eco-tooltip',
                    offset: [0, -4],
                })
                    .setContent(regionName)
                    .setLatLng(e.latlng)
                    .openOn(map);
            },
            mousemove: (e) => {
                if (tooltipRef.current) tooltipRef.current.setLatLng(e.latlng);
            },
            mouseout: () => {
                resetHovered();
                closeTooltip();
            },
            click: (e) => {
                resetHovered();
                closeTooltip();
                map.flyToBounds(e.target.getBounds(), {
                    duration: 1.4,
                    easeLinearity: 0.25,
                    padding: [40, 40],
                });
                onRegionClick(regionName);
            },
        });
    }, [map, onRegionClick, closeTooltip, resetHovered]);

    if (!geojson) return null;

    return (
        <GeoJSON
            key="overview-regions"
            data={geojson}
            style={defaultStyle}
            onEachFeature={onEachFeature}
        />
    );
}

// ─── Main map component ───────────────────────────────────────────────────────
export default function MapComponent({
    year,
    region,
    district,
    activeLayers = [],
    zoomCommand,
    mapCommand,
    basemap = 'dark',
    boundaryGeoJSON = { districts: null, regions: null },
    onDistrictClick,
    onRegionClick,
}) {
    const [layers, setLayers] = useState({ carbon: null, mining: null, region: null, district: null });
    const [prevLayers, setPrevLayers] = useState(null);
    const [fetchedFilters, setFetchedFilters] = useState({ year: null, region: null, district: null });
    const [bounds, setBounds] = useState(null);
    const [loading, setLoading] = useState(false);

    // Analysis mode: a region or district has been queried
    const analysisMode = !!(region || district);

    useEffect(() => {
        if (!year) return;

        const fetchLayers = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/gee/layers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ year, region, district })
                });

                if (!response.ok) throw new Error('Failed to fetch layers');

                const data = await response.json();

                setPrevLayers(layers);
                setLayers(data.layers);
                setFetchedFilters({ year, region, district });
                setBounds(data.bounds);

                setTimeout(() => setPrevLayers(null), 2000);
            } catch (err) {
                console.error('Layer fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchLayers();
    }, [year, region, district]);

    return (
        <div className="h-full w-full relative">
            {loading && (
                <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-brand-deep/30 backdrop-blur-[2px] pointer-events-none">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <div className="canopy-ring" />
                        <div className="canopy-ring" />
                        <div className="canopy-ring" />
                        <div className="relative z-10 w-10 h-10 rounded-full bg-brand-deep/80 border border-brand-gold/30 flex items-center justify-center">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(251,191,36,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 8c0-4-2.5-6-5-6S7 4 7 8c-2 0-4 1.5-4 4s2 4 4 4h10c2 0 4-1.5 4-4s-2-4-4-4z"/>
                                <line x1="12" y1="16" x2="12" y2="21"/>
                                <line x1="8" y1="21" x2="16" y2="21"/>
                            </svg>
                        </div>
                    </div>
                    <p className="mt-4 text-[10px] font-semibold text-brand-gold/60 tracking-wider">Reading the canopy...</p>
                </div>
            )}
            <MapContainer
                center={[7.5, -1.2]}
                zoom={7}
                className="h-full w-full bg-brand-deep"
                zoomControl={false}
            >
                <BasemapLayer type={basemap} />

                {/* GeoJSON boundary layers — always visible, style adapts to analysis mode */}
                {boundaryGeoJSON.regions && (
                    <OverviewRegionsLayer
                        geojson={boundaryGeoJSON.regions}
                        onRegionClick={onRegionClick}
                        analysisMode={analysisMode}
                    />
                )}
                {boundaryGeoJSON.districts && (
                    <OverviewDistrictsLayer
                        geojson={boundaryGeoJSON.districts}
                        onFeatureClick={onDistrictClick}
                        analysisMode={analysisMode}
                    />
                )}

                {/* Analysis raster layers */}
                {layers.carbon && activeLayers.includes('carbon') && fetchedFilters.year === year && (
                    <TileLayer url={layers.carbon} opacity={0.7} zIndex={10} />
                )}
                {layers.mining && activeLayers.includes('mining') && fetchedFilters.year === year && (
                    <TileLayer url={layers.mining} zIndex={20} />
                )}
                {layers.region && activeLayers.includes('region') && fetchedFilters.region === region && (
                    <TileLayer url={layers.region} zIndex={30} />
                )}
                {layers.district && activeLayers.includes('district') && fetchedFilters.district === district && (
                    <TileLayer url={layers.district} zIndex={40} />
                )}

                {/* Ghost layers for cross-fade on transition */}
                {prevLayers && (
                    <>
                        {prevLayers.carbon && activeLayers.includes('carbon') && <TileLayer url={prevLayers.carbon} opacity={0.3} zIndex={9} />}
                        {prevLayers.mining && activeLayers.includes('mining') && <TileLayer url={prevLayers.mining} opacity={0.3} zIndex={19} />}
                        {prevLayers.region && activeLayers.includes('region') && <TileLayer url={prevLayers.region} opacity={0.3} zIndex={29} />}
                        {prevLayers.district && activeLayers.includes('district') && <TileLayer url={prevLayers.district} opacity={0.3} zIndex={39} />}
                    </>
                )}

                <MapController bounds={bounds} zoomCommand={zoomCommand} mapCommand={mapCommand} />
            </MapContainer>
        </div>
    );
}

// ─── Basemap switcher ─────────────────────────────────────────────────────────
function BasemapLayer({ type }) {
    switch (type) {
        case 'satellite':
            return (
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                />
            );
        case 'osm':
            return (
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
            );
        case 'dark':
        default:
            return (
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
            );
    }
}
