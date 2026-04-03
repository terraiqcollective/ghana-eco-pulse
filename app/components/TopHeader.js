import React from 'react';
import { ShieldCheck, MapPin, Calendar } from 'lucide-react';

export const TopHeader = ({ selectedYear, selectedRegion, selectedDistrict }) => {
    const scopeLabel = selectedDistrict || selectedRegion || null;

    return (
        <header className="absolute top-0 left-0 right-0 z-40 h-16 bg-brand-deep/95 backdrop-blur-md border-b border-brand-gold/30 flex items-center justify-between px-6 shadow-2xl">
            {/* Branding */}
            <div className="flex items-center gap-4">
                <div className="bg-brand-gold p-2 rounded shadow-lg shadow-brand-gold/30 ring-1 ring-brand-gold/50 shrink-0">
                    <ShieldCheck className="text-brand-deep w-5 h-5" />
                </div>
                <div>
                    <div className="flex items-baseline gap-2">
                        <h1 className="text-white text-base font-extrabold tracking-tighter uppercase leading-none">
                            EcoPulse <span className="text-brand-gold">Ghana</span>
                        </h1>
                        <span className="text-[8px] px-1.5 py-0.5 rounded border border-brand-gold/30 text-brand-gold font-black uppercase tracking-tighter">
                            Official Portal
                        </span>
                    </div>
                </div>
            </div>

            {/* Current scope indicator */}
            {(selectedYear || scopeLabel) && (
                <div className="flex items-center gap-3">
                    {selectedYear && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-gold/8 border border-brand-gold/20 rounded">
                            <Calendar size={11} className="text-brand-gold/60" />
                            <span className="text-[10px] font-black text-brand-gold tabular-nums tracking-widest">
                                {selectedYear}
                            </span>
                        </div>
                    )}
                    {scopeLabel && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-gold/8 border border-brand-gold/20 rounded max-w-[200px]">
                            <MapPin size={11} className="text-brand-gold/60 shrink-0" />
                            <span className="text-[10px] font-black text-brand-gold tracking-wider truncate">
                                {scopeLabel}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
};
