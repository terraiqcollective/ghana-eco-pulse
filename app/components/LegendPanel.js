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
            <GlassPanel className="min-w-[220px] rounded-xl">
                <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Layers size={12} className="text-brand-gold/60" />
                        <span className="text-[10px] font-medium text-white/72">
                            Active layers
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded p-1 text-white/30 transition-all hover:bg-white/6 hover:text-white/70"
                    >
                        <X size={12} />
                    </button>
                </div>

                <div className="flex flex-col gap-3 px-4 py-3">
                    {visibleItems.length === 0 ? (
                        <p className="py-2 text-center text-[10px] font-medium text-white/34">
                            No active layers
                        </p>
                    ) : (
                        visibleItems.map(item => (
                            <div key={item.id} className="flex items-center gap-3">
                                <div className={`h-4 w-4 shrink-0 rounded-sm ${item.swatch}`} />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-medium leading-none text-white/78">
                                        {item.label}
                                    </span>
                                    <span className="mt-0.5 text-[9px] text-white/38">
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
