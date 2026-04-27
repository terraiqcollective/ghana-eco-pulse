"use client";

import { useEffect } from 'react';
import { X, Play, TreePine, ScanSearch, Database } from 'lucide-react';
import { BrandMark } from './BrandMark';

export function AboutModal({ isOpen = false, onClose, onOpenTour, canOpenTour = true }) {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event) => { if (event.key === 'Escape') onClose?.(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    return (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 ${isOpen ? '' : 'pointer-events-none'}`}>
            <div className={`absolute inset-0 bg-black/62 backdrop-blur-[4px] transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

            <div
                className={`relative z-10 w-full max-w-lg overflow-hidden rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.68)] backdrop-blur-xl transition-all duration-200 ease-out ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-[0.97]'}`}
                style={{ background: 'linear-gradient(180deg,rgba(4,5,7,0.92)0%,rgba(2,3,5,0.96)100%)', border: '1px solid rgba(243,239,228,0.08)' }}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 pb-4 pt-5">
                    <div className="flex items-center gap-3">
                        <BrandMark className="h-10 w-10 shrink-0" />
                        <div>
                            <h2 className="font-display text-[1.25rem] font-medium leading-none text-[#f3efe4]">
                                Eco<span className="text-brand-gold">Pulse</span> Ghana
                            </h2>
                            <p className="mt-1 text-[10px] text-white/42">Forest Carbon Monitoring Portal</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-md p-1.5 text-white/34 transition-colors hover:bg-white/5 hover:text-white/72" aria-label="Close">
                        <X size={14} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-5 space-y-4">
                    <p className="text-[12px] leading-relaxed text-white/72">
                        Welcome to EcoPulse Ghana. This portal tracks forest carbon stock and mining-driven land loss across the study area, using satellite imagery to show how vegetation cover and disturbance have shifted year by year.
                    </p>

                    <div className="space-y-2.5 border-t border-white/6 pt-4">
                        <p className="text-[9px] font-bold tracking-[0.12em] text-white/30 uppercase mb-3">How to use</p>
                        <div className="flex items-start gap-3">
                            <ScanSearch size={13} className="mt-0.5 shrink-0 text-brand-gold/70" />
                            <p className="text-[11px] leading-relaxed text-white/52">Pick a region or district and a year in the Setup panel, then click <span className="text-white/72 font-medium">Run Analysis</span> to load results and map layers.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <TreePine size={13} className="mt-0.5 shrink-0 text-brand-gold/70" />
                            <p className="text-[11px] leading-relaxed text-white/52">Toggle carbon and mining layers on the map. Hover over a district to see its name, or click it to zoom in.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <Database size={13} className="mt-0.5 shrink-0 text-brand-gold/70" />
                            <p className="text-[11px] leading-relaxed text-white/52">All figures are satellite-derived estimates intended for research and planning use.</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col gap-2 border-t border-white/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        {canOpenTour ? (
                            <button onClick={onOpenTour} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-[10px] font-medium text-white/62 transition-colors hover:bg-white/6 hover:text-white">
                                <Play size={10} /> Quick tour
                            </button>
                        ) : (
                            <span className="text-[10px] text-white/28">Tour available on desktop.</span>
                        )}
                    </div>
                    <button onClick={onClose} className="rounded-lg bg-[#d0542c] px-5 py-2.5 text-[10px] font-semibold text-[#120f0c] transition-colors hover:bg-[#e37148]">
                        Start exploring
                    </button>
                </div>
            </div>
        </div>
    );
}
