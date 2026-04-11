"use client";

import { useEffect } from 'react';
import { X, ShieldAlert, Database, HelpCircle } from 'lucide-react';
import { BrandMark } from './BrandMark';

export function AboutModal({ isOpen = false, onClose, onOpenTour, canOpenTour = true }) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-brand-gold/25 bg-brand-deep shadow-[0_32px_80px_rgba(0,0,0,0.7)]">
                <div className="flex items-start justify-between gap-4 border-b border-white/6 px-6 pb-4 pt-6">
                    <div className="flex items-center gap-3">
                        <BrandMark className="h-10 w-10 shrink-0 rounded-[10px]" />
                        <div>
                            <h2 className="text-base font-bold leading-none tracking-wide text-white">
                                <span className="text-white/90">Eco</span><span className="text-brand-gold">Pulse</span> Ghana
                            </h2>
                            <p className="mt-1 text-[9px] font-medium uppercase tracking-widest text-white/30">
                                Forest Carbon Monitoring Portal
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="shrink-0 p-1.5 text-white/20 transition-colors hover:text-white/60"
                        aria-label="Close About modal"
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className="custom-scrollbar flex max-h-[60vh] flex-col gap-5 overflow-y-auto px-6 py-5">
                    <div>
                        <p className="text-[11px] leading-relaxed text-white/55">
                            EcoPulse Ghana is a satellite-driven monitoring platform developed to track forest carbon stock and mining-driven carbon loss across Ghana&apos;s forest zones. It combines data from multiple Earth observation sources to generate annual estimates at regional and district level.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5">
                            <Database size={9} className="text-brand-gold/50" />
                            <span className="text-[9px] font-semibold uppercase tracking-widest text-white/30">Data Coverage</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            {[
                                { label: 'Time Range', value: '2019 - 2024' },
                                { label: 'Resolution', value: '4.77m - 25m' },
                                { label: 'Update Cadence', value: 'Annual' },
                            ].map(item => (
                                <div key={item.label} className="flex flex-col gap-1 rounded-lg border border-white/5 bg-white/[0.03] p-2.5">
                                    <span className="text-[8px] font-semibold uppercase tracking-wide text-white/25">{item.label}</span>
                                    <span className="text-[10px] font-bold text-white/65">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border border-amber-500/15 bg-amber-500/5 p-3.5">
                        <ShieldAlert size={14} className="mt-0.5 shrink-0 text-amber-400/70" />
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400/80">Important Disclaimer</span>
                            <p className="text-[10px] leading-relaxed text-white/40">
                                All figures presented in this portal are <strong className="text-white/55">satellite-derived estimates</strong> produced using computational models. They are intended for research, planning, and policy exploration purposes only. Results may contain errors and <strong className="text-white/55">should not be treated as ground-truth measurements</strong> or cited as empirical facts without independent verification. TerraIQ Collective accepts no liability for decisions made on the basis of this data.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-white/6 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    {canOpenTour ? (
                        <button
                            onClick={onOpenTour}
                            className="flex w-full items-center justify-center gap-1.5 text-[9px] font-semibold text-white/30 transition-colors hover:text-white/60 sm:w-auto"
                        >
                            <HelpCircle size={11} />
                            Take a guided tour
                        </button>
                    ) : (
                        <span className="text-center text-[9px] font-medium text-white/25 sm:text-left">
                            Guided tour is available on desktop.
                        </span>
                    )}
                    <button
                        onClick={onClose}
                        className="w-full rounded-lg bg-brand-gold px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-brand-deep transition-opacity hover:opacity-90 sm:w-auto"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
}
