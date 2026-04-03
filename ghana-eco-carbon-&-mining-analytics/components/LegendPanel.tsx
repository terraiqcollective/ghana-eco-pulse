import React from 'react';
import { X, Map as MapIcon } from 'lucide-react';
import { GlassPanel } from './GlassPanel';

interface LegendPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const LegendPanel: React.FC<LegendPanelProps> = ({ isOpen, onClose, className = "" }) => {
  if (!isOpen) return null;

  const legendItems = [
    { color: 'bg-amber-400', label: 'Mining Anomaly', desc: 'Active sensor alert' },
    { color: 'bg-emerald-500', label: 'Protected Forest', desc: 'Primary canopy' },
    { color: 'bg-blue-400', label: 'Water Body', desc: 'Pra River Basin' },
    { color: 'border border-white/40', label: 'Agency Boundary', desc: 'District limits' },
  ];

  return (
    <div className={`z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 ${className}`}>
      <GlassPanel className="w-64 rounded-lg shadow-2xl border-amber-500/40">
        <div className="flex items-center justify-between p-3 border-b border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2">
            <MapIcon size={14} className="text-amber-400" />
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">Layer Legend</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-amber-500/20 text-amber-400 rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {legendItems.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className={`w-3.5 h-3.5 rounded-sm mt-0.5 shrink-0 ${item.color}`} />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white uppercase tracking-wider leading-none">
                  {item.label}
                </span>
                <span className="text-[8px] font-bold text-amber-100/40 uppercase tracking-tighter mt-1">
                  {item.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
};