import React from 'react';
import { X, Map as MapIcon } from 'lucide-react';
import { GlassPanel } from './GlassPanel';

export const LegendPanel = ({ isOpen, onClose, className = "" }) => {
    if (!isOpen) return null;

    const legendItems = [
        { color: 'border-4 border-yellow-400', label: 'DISTRICT', desc: 'FOCUS AREA' },
        { color: 'border-4 border-white', label: 'REGION', desc: 'BOUNDARY' },
        { color: 'bg-red-500', label: 'CARBON LOSS', desc: 'LOSS' },
        { color: 'bg-green-600', label: 'CARBON STOCK', desc: 'STOCK' },
    ];

    return (
        <div className={`z-50 ${className}`}>
            <GlassPanel className="min-w-[500px] rounded-xl shadow-2xl border-brand-gold/30">
                <div className="flex items-center justify-between p-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <MapIcon size={14} className="text-brand-gold" />
                        <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.25em]">Layer Legend</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 text-brand-gold/60 hover:text-white rounded-lg transition-all"
                    >
                        <X size={14} />
                    </button>
                </div>
                <div className="p-4 flex flex-row items-center gap-8 justify-between">
                    {legendItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded shrink-0 ${item.color}`} />
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-white uppercase tracking-wider leading-none">
                                    {item.label}
                                </span>
                                <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">
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
