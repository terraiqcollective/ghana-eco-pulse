
import React from 'react';
import { MapContainer, TileLayer, Circle, Polygon, Tooltip as LeafletTooltip } from 'react-leaflet';
import { GHANA_CENTER, MINING_ALERTS, FOREST_POLYGONS } from '../data/mockData';

interface MainMapProps {
  showMining: boolean;
  showForest: boolean;
  currentYear: number;
  basemapUrl: string;
  attribution: string;
}

const MainMap: React.FC<MainMapProps> = ({ showMining, showForest, currentYear, basemapUrl, attribution }) => {
  return (
    <MapContainer 
      center={GHANA_CENTER} 
      zoom={8} 
      style={{ height: '100vh', width: '100vw' }}
      zoomControl={false}
      scrollWheelZoom={true}
    >
      <TileLayer
        key={basemapUrl} // Force re-render when basemap changes
        attribution={attribution}
        url={basemapUrl}
      />

      {showForest && FOREST_POLYGONS.map(forest => (
        <Polygon 
          key={forest.id}
          positions={forest.coords}
          pathOptions={{
            color: '#fbbf24',
            fillColor: '#10b981',
            fillOpacity: currentYear > 2020 ? 0.15 : 0.35, // Fade as years go by to simulate degradation
            weight: 1,
            dashArray: '5, 5'
          }}
        >
          <LeafletTooltip direction="top" offset={[0, -20]} opacity={1}>
            <div className="bg-green-950 text-white p-2 rounded border border-amber-500/40 text-[11px]">
              <span className="font-black text-amber-400 uppercase tracking-widest">{forest.name}</span><br/>
              <span className="font-bold">STATUS: PROTECTED SINK</span>
            </div>
          </LeafletTooltip>
        </Polygon>
      ))}

      {showMining && MINING_ALERTS.map(alert => {
        // Simple logic: show alerts that were detected up to the current year
        const alertYear = parseInt(alert.date.split('-')[0]);
        if (alertYear > currentYear) return null;

        return (
          <Circle 
            key={alert.id}
            center={[alert.lat, alert.lng]}
            radius={alert.intensity === 'high' ? 8000 : 4000}
            className={alert.intensity === 'high' ? 'pulse-marker' : ''}
            pathOptions={{
              color: '#fbbf24',
              fillColor: '#fbbf24',
              fillOpacity: 0.5,
              weight: 2
            }}
          >
            <LeafletTooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="bg-green-950 text-white p-2 rounded border border-amber-500/40 text-[11px]">
                <span className="font-black text-amber-400 uppercase tracking-widest">Mining Anomaly</span><br/>
                <span className="font-bold">INTENSITY: {alert.intensity.toUpperCase()}</span><br/>
                <span className="text-white/60 text-[9px] font-bold">DETECTED: {alert.date}</span>
              </div>
            </LeafletTooltip>
          </Circle>
        );
      })}
    </MapContainer>
  );
};

export default MainMap;
