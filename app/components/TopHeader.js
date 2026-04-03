import React from 'react';
import { ShieldCheck, MapPin, Calendar } from 'lucide-react';

export const TopHeader = ({ selectedYear, selectedRegion, selectedDistrict }) => {
    const scopeLabel = selectedDistrict || selectedRegion || null;

    return (
        <header className="absolute top-0 left-0 right-0 z-40 h-16 bg-brand-deep/95 backdrop-blur-md border-b border-brand-gold/30 flex items-center justify-between px-6 shadow-2xl">
            {/* Branding */}
            <div className="flex items-center gap-3.5">
                <div className="bg-brand-gold p-2 rounded shadow-lg shadow-brand-gold/30 ring-1 ring-brand-gold/50 shrink-0">
                    <ShieldCheck className="text-brand-deep w-5 h-5" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-white text-base font-extrabold tracking-tighter uppercase leading-none">
                            EcoPulse <span className="text-brand-gold">Ghana</span>
                        </h1>
                        {/* Live indicator — replaces the generic "Official Portal" badge */}
                        <span className="flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-400/70 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                        </span>
                    </div>
                    <p className="text-[8px] text-white/25 font-medium mt-0.5 tracking-wide">
                        Forest Carbon Monitoring
                    </p>
                </div>
            </div>

            {/* Active scope pills — hidden on small screens */}
            {(selectedYear || scopeLabel) && (
                <div className="hidden sm:flex items-center gap-2.5">
                    {selectedYear && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-gold/8 border border-brand-gold/20 rounded">
                            <Calendar size={11} className="text-brand-gold/60" />
                            <span className="text-[10px] font-bold text-brand-gold tabular-nums tracking-widest">
                                {selectedYear}
                            </span>
                        </div>
                    )}
                    {scopeLabel && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-gold/8 border border-brand-gold/20 rounded max-w-[200px]">
                            <MapPin size={11} className="text-brand-gold/60 shrink-0" />
                            <span className="text-[10px] font-bold text-brand-gold tracking-wider truncate">
                                {scopeLabel}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
};
