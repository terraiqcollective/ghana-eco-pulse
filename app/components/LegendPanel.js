import { X, Layers } from 'lucide-react';
import { GlassPanel } from './GlassPanel';

const ALL_LEGEND_ITEMS = [
    {
        id: 'carbon',
        label: 'Forest Carbon Stock',
        desc: 'Lower to higher carbon density',
        gradient: 'linear-gradient(90deg,#1b1f1d 0%,#1f4d46 24%,#4f7f3e 52%,#8fbf5a 78%,#d7e87a 100%)',
        lowLabel: 'Low stock',
        highLabel: 'High stock',
    },
    {
        id: 'mining',
        label: 'Forest Carbon Loss',
        desc: 'Loss linked to mining disturbance',
        gradient: 'linear-gradient(90deg,#220505 0%,#6d0f0f 24%,#b91c1c 52%,#f97316 78%,#ffd166 100%)',
        lowLabel: 'Low loss',
        highLabel: 'High loss',
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
                            <div key={item.id} className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                    {item.gradient ? (
                                        <div className="w-full min-w-0">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-medium leading-none text-white/78">
                                                        {item.label}
                                                    </span>
                                                    <span className="mt-0.5 text-[9px] text-white/38">
                                                        {item.desc}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <div
                                                    className="h-2.5 w-full rounded-full border border-white/10"
                                                    style={{ background: item.gradient }}
                                                />
                                                <div className="mt-1 flex items-center justify-between text-[8px] uppercase tracking-[0.08em] text-white/34">
                                                    <span>{item.lowLabel}</span>
                                                    <span>{item.highLabel}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`h-4 w-4 shrink-0 rounded-sm ${item.swatch}`} />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-medium leading-none text-white/78">
                                                    {item.label}
                                                </span>
                                                <span className="mt-0.5 text-[9px] text-white/38">
                                                    {item.desc}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </GlassPanel>
        </div>
    );
};
