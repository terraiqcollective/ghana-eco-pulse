"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Helper to update map center/zoom and external zoom commands
function MapController({ bounds, zoomCommand }) {
    const map = useMap();

    useEffect(() => {
        if (bounds && bounds.length === 2) {
            map.fitBounds(bounds);
        }
    }, [bounds, map]);

    useEffect(() => {
        if (zoomCommand === 'in') {
            map.zoomIn();
        } else if (zoomCommand === 'out') {
            map.zoomOut();
        }
    }, [zoomCommand, map]);

    return null;
}

export default function MapComponent({ year, region, district, activeLayers = [], zoomCommand, basemap = 'dark' }) {
    const [layers, setLayers] = useState({ carbon: null, mining: null, region: null, district: null });
    const [prevLayers, setPrevLayers] = useState(null);
    const [fetchedFilters, setFetchedFilters] = useState({ year: null, region: null, district: null });
    const [bounds, setBounds] = useState(null);
    const [loading, setLoading] = useState(false);

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

                // Transition: Move current layers to "prev" and set new ones
                setPrevLayers(layers);
                setLayers(data.layers);
                setFetchedFilters({ year, region, district });
                setBounds(data.bounds);

                // Keep ghosts visible for 2 seconds to allow new tiles to resolve
                setTimeout(() => setPrevLayers(null), 2000);
            } catch (err) {
                console.error("Layer fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLayers();
    }, [year, region, district]);

    return (
        <div className="h-full w-full relative">
            {loading && (
                <div className="absolute top-20 right-4 z-[1000] glass-panel px-4 py-2 rounded shadow-lg text-brand-gold text-[10px] font-black uppercase tracking-widest animate-pulse">
                    Refining Viewport...
                </div>
            )}
            <MapContainer
                center={[6.666, -1.616]}
                zoom={7}
                className="h-full w-full bg-brand-deep"
                zoomControl={false}
            >
                <BasemapLayer type={basemap} />

                {/* Main Layers */}
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

                {/* Prev Layers for Cross-fade effect (Morphing) */}
                {prevLayers && (
                    <div className="opacity-30 pointer-events-none transition-opacity duration-1000">
                        {prevLayers.carbon && activeLayers.includes('carbon') && <TileLayer url={prevLayers.carbon} opacity={0.3} zIndex={9} />}
                        {prevLayers.mining && activeLayers.includes('mining') && <TileLayer url={prevLayers.mining} opacity={0.3} zIndex={19} />}
                        {prevLayers.region && activeLayers.includes('region') && <TileLayer url={prevLayers.region} opacity={0.3} zIndex={29} />}
                        {prevLayers.district && activeLayers.includes('district') && <TileLayer url={prevLayers.district} opacity={0.3} zIndex={39} />}
                    </div>
                )}

                <MapController bounds={bounds} zoomCommand={zoomCommand} />
            </MapContainer>
        </div>
    );
}

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
