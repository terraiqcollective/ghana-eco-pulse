"use client";

import { useEffect, useState } from 'react';
import { X, ShieldAlert, Database, HelpCircle } from 'lucide-react';
import { BrandMark } from './BrandMark';

const ABOUT_KEY = 'ecopulse_about_seen';

export function AboutModal({ onOpenTour, forceOpen = false }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const seen = localStorage.getItem(ABOUT_KEY);
        if (!seen) {
            setTimeout(() => setVisible(true), 600);
        }
    }, []);

    useEffect(() => {
        if (forceOpen) setVisible(true);
    }, [forceOpen]);

    const dismiss = () => {
        localStorage.setItem(ABOUT_KEY, '1');
        setVisible(false);
    };

    const handleTour = () => {
        dismiss();
        if (onOpenTour) onOpenTour();
    };

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismiss} />

            {/* Card */}
            <div className="relative z-10 w-full max-w-lg bg-brand-deep border border-brand-gold/25 rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden">

                {/* Header strip */}
                <div className="px-6 pt-6 pb-4 border-b border-white/6 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <BrandMark className="w-10 h-10 shrink-0 rounded-[10px]" />
                        <div>
                            <h2 className="text-white text-base font-bold tracking-wide leading-none">
                                <span className="text-white/90">Eco</span><span className="text-brand-gold">Pulse</span> Ghana
                            </h2>
                            <p className="text-[9px] text-white/30 font-medium mt-1 uppercase tracking-widest">
                                Forest Carbon Monitoring Portal
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={dismiss}
                        className="p-1.5 text-white/20 hover:text-white/60 transition-colors shrink-0"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 flex flex-col gap-5 max-h-[60vh] overflow-y-auto custom-scrollbar">

                    {/* About */}
                    <div>
                        <p className="text-[11px] text-white/55 leading-relaxed">
                            EcoPulse Ghana is a satellite-driven monitoring platform developed to track forest carbon stock and mining-driven carbon loss across Ghana's forest zones. It combines data from multiple Earth observation sources to generate annual estimates at regional and district level.
                        </p>
                    </div>

                    {/* Data coverage */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5">
                            <Database size={9} className="text-brand-gold/50" />
                            <span className="text-[9px] font-semibold text-white/30 uppercase tracking-widest">Data Coverage</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: 'Time Range', value: '2019 – 2024' },
                                { label: 'Resolution', value: '4.77m – 25m' },
                                { label: 'Update Cadence', value: 'Annual' },
                            ].map(item => (
                                <div key={item.label} className="flex flex-col gap-1 p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                                    <span className="text-[8px] font-semibold text-white/25 uppercase tracking-wide">{item.label}</span>
                                    <span className="text-[10px] font-bold text-white/65">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
                        <ShieldAlert size={14} className="text-amber-400/70 shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-amber-400/80 uppercase tracking-wider">Important Disclaimer</span>
                            <p className="text-[10px] text-white/40 leading-relaxed">
                                All figures presented in this portal are <strong className="text-white/55">satellite-derived estimates</strong> produced using computational models. They are intended for research, planning, and policy exploration purposes only. Results may contain errors and <strong className="text-white/55">should not be treated as ground-truth measurements</strong> or cited as empirical facts without independent verification. TerraIQ Collective accepts no liability for decisions made on the basis of this data.
                            </p>
                        </div>
                    </div>

                </div>

                {/* Footer actions */}
                <div className="px-6 py-4 border-t border-white/6 flex items-center justify-between gap-3">
                    <button
                        onClick={handleTour}
                        className="flex items-center gap-1.5 text-[9px] font-semibold text-white/30 hover:text-white/60 transition-colors"
                    >
                        <HelpCircle size={11} />
                        Take a guided tour
                    </button>
                    <button
                        onClick={dismiss}
                        className="px-5 py-2.5 bg-brand-gold text-brand-deep text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
}
