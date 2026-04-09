import { X, Layers } from 'lucide-react';
import { GlassPanel } from './GlassPanel';

const ALL_LEGEND_ITEMS = [
    {
        id: 'carbon',
        swatch: 'bg-emerald-600',
        label: 'Carbon Stock',
        desc: 'Forest carbon storage',
    },
    {
        id: 'mining',
        swatch: 'bg-red-500',
        label: 'Carbon Loss',
        desc: 'Mining-driven loss',
    },
    {
        id: 'region',
        swatch: 'border-2 border-white/80 bg-transparent',
        label: 'Region',
        desc: 'Administrative boundary',
    },
    {
        id: 'district',
        swatch: 'border-2 border-yellow-400 bg-transparent',
        label: 'District',
        desc: 'Focus area boundary',
    },
];

export const LegendPanel = ({ isOpen, onClose, activeLayers = [], className = '' }) => {
    if (!isOpen) return null;

    const visibleItems = ALL_LEGEND_ITEMS.filter(item => activeLayers.includes(item.id));

    return (
        <div className={`z-50 ${className}`}>
            <GlassPanel className="rounded-xl shadow-2xl border-brand-gold/30 min-w-[220px]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Layers size={12} className="text-brand-gold/60" />
                        <span className="text-[9px] font-black text-brand-gold uppercase tracking-[0.25em]">
                            Active Layers
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 text-brand-gold/40 hover:text-white rounded transition-all"
                    >
                        <X size={12} />
                    </button>
                </div>

                {/* Items */}
                <div className="px-4 py-3 flex flex-col gap-3">
                    {visibleItems.length === 0 ? (
                        <p className="text-[9px] font-bold text-brand-faded/30 uppercase tracking-widest text-center py-2">
                            No active layers
                        </p>
                    ) : (
                        visibleItems.map(item => (
                            <div key={item.id} className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-sm shrink-0 ${item.swatch}`} />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-white uppercase tracking-wider leading-none">
                                        {item.label}
                                    </span>
                                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                                        {item.desc}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </GlassPanel>
        </div>
    );
};
