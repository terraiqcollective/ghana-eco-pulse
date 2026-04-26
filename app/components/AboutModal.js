"use client";

import { useEffect } from 'react';
import { X, Play, Map, Database } from 'lucide-react';
import { BrandMark } from './BrandMark';

export function AboutModal({ isOpen = false, onClose, onOpenTour, canOpenTour = true }) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose?.();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/62 backdrop-blur-[4px]" onClick={onClose} />

            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.68)] backdrop-blur-xl" style={{ background: 'linear-gradient(180deg,rgba(4,5,7,0.92)0%,rgba(2,3,5,0.96)100%)', border: '1px solid rgba(243,239,228,0.08)' }}>
                <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 pb-4 pt-5">
                    <div className="flex items-center gap-3">
                        <BrandMark className="h-10 w-10 shrink-0" />
                        <div>
                            <h2 className="font-display text-[1.25rem] font-medium leading-none text-[#f3efe4]">
                                Eco<span className="text-brand-gold">Pulse</span>
                            </h2>
                            <p className="mt-1 text-[10px] text-white/42">Forest carbon monitoring for Ghana.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-white/34 transition-colors hover:bg-white/5 hover:text-white/72"
                        aria-label="Close"
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className="px-5 py-5">
                    <p className="text-[12px] leading-relaxed text-white/62">
                        Choose a region or district, pick a year, then run the analysis to view carbon stock, mining loss, and map layers for that area.
                    </p>

                    <div className="mt-5 space-y-3">
                        <div className="flex items-start gap-3">
                            <Map size={14} className="mt-0.5 shrink-0 text-brand-gold/75" />
                            <p className="text-[10px] leading-relaxed text-white/46">The map is the main workspace. Layers stay tied to the selected area.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <Database size={14} className="mt-0.5 shrink-0 text-brand-gold/75" />
                            <p className="text-[10px] leading-relaxed text-white/46">All values are satellite-derived estimates intended for research and exploration.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-white/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    {canOpenTour ? (
                        <button
                            onClick={onOpenTour}
                            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-[10px] font-medium text-white/62 transition-colors hover:bg-white/6 hover:text-white sm:justify-start"
                        >
                            <Play size={11} />
                            Quick tour
                        </button>
                    ) : (
                        <span className="text-center text-[10px] text-white/32 sm:text-left">Quick tour is available on desktop.</span>
                    )}
                    <button
                        onClick={onClose}
                        className="rounded-lg bg-[#d0542c] px-5 py-2.5 text-[10px] font-semibold text-[#120f0c] transition-colors hover:bg-[#e37148]"
                    >
                        Start exploring
                    </button>
                </div>
            </div>
        </div>
    );
}
