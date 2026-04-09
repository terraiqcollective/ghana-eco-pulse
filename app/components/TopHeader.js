import { MapPin, Calendar, RotateCcw, HelpCircle, Info } from 'lucide-react';
import { BrandMark } from './BrandMark';

export const TopHeader = ({ selectedYear, selectedRegion, selectedDistrict, onReset, onTour, onAbout }) => {
    const scopeLabel = selectedDistrict || selectedRegion || null;

    return (
        <header className="absolute top-0 left-0 right-0 z-40 h-16 bg-brand-deep/95 backdrop-blur-md border-b border-brand-gold/20 flex items-center justify-between px-6 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
            {/* Branding */}
            <div className="flex items-center gap-3.5">
                <BrandMark className="w-10 h-10 shrink-0 rounded-[10px]" />
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-white text-base font-semibold tracking-[0.08em] uppercase leading-none">
                            <span className="text-white/92">Eco</span> <span className="text-brand-gold">Pulse</span>
                        </h1>
                    </div>
                    <p className="text-[8px] text-white/30 font-medium mt-0.5 tracking-[0.16em] uppercase">
                        Forest Carbon Monitoring
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

                {/* Info / About button */}
                {onAbout && (
                    <button
                        onClick={onAbout}
                        title="About this portal"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/10 hover:border-brand-gold/30 text-white/20 hover:text-brand-gold transition-all duration-200"
                    >
                        <Info size={11} />
                        <span className="text-[9px] font-semibold hidden sm:block">About</span>
                    </button>
                )}
            </div>
        </header>
    );
};
