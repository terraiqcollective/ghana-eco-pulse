import React from 'react';
import { MapPin, Calendar, RotateCcw, HelpCircle } from 'lucide-react';

export const TopHeader = ({ selectedYear, selectedRegion, selectedDistrict, onReset, onTour }) => {
    const scopeLabel = selectedDistrict || selectedRegion || null;

    return (
        <header className="absolute top-0 left-0 right-0 z-40 h-16 bg-brand-deep/95 backdrop-blur-md border-b border-brand-gold/20 flex items-center justify-between px-6 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
            {/* Branding */}
            <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded border border-brand-gold/35 bg-brand-deep/40 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[8px] font-bold tracking-[0.22em] text-brand-gold/80 leading-none">GE</span>
                    <span className="text-[7px] font-medium tracking-[0.18em] text-white/45 leading-none mt-1">LAB</span>
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-white text-base font-semibold tracking-[0.08em] uppercase leading-none">
                            Ghana <span className="text-brand-gold">Eco Pulse</span>
                        </h1>
                    </div>
                    <p className="text-[8px] text-white/30 font-medium mt-0.5 tracking-[0.16em] uppercase">
                        Forest Carbon and Mining Analytics
                    </p>
                </div>
            </div>

            {/* Right side — scope pills + reset */}
            <div className="flex items-center gap-2.5">
                {/* Scope pills — hidden on small screens */}
                {(selectedYear || scopeLabel) && (
                    <div className="hidden sm:flex items-center gap-2">
                        {selectedYear && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] border border-white/10 rounded">
                                <Calendar size={11} className="text-white/40" />
                                <span className="text-[10px] font-semibold text-white/70 tabular-nums tracking-widest">
                                    {selectedYear}
                                </span>
                            </div>
                        )}
                        {scopeLabel && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] border border-white/10 rounded max-w-[200px]">
                                <MapPin size={11} className="text-white/40 shrink-0" />
                                <span className="text-[10px] font-semibold text-white/70 tracking-wider truncate">
                                    {scopeLabel}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Help / tour button */}
                {onTour && (
                    <button
                        onClick={onTour}
                        title="Help"
                        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/10 hover:border-white/20 text-white/25 hover:text-white/60 transition-all duration-200"
                    >
                        <HelpCircle size={11} />
                        <span className="text-[9px] font-semibold hidden sm:block">Help</span>
                    </button>
                )}

                {/* Reset button — always visible */}
                {onReset && (
                    <button
                        onClick={onReset}
                        title="Reset to default view"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/10 hover:border-red-500/30 text-white/20 hover:text-red-400 transition-all duration-200 group"
                    >
                        <RotateCcw size={11} className="group-hover:rotate-[-360deg] transition-transform duration-500" />
                        <span className="text-[9px] font-semibold hidden sm:block">Reset</span>
                    </button>
                )}
            </div>
        </header>
    );
};
