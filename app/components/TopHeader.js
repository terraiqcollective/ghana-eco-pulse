import { MapPin, Calendar, HelpCircle, Info } from 'lucide-react';
import { BrandMark } from './BrandMark';

export const TopHeader = ({ selectedYear, selectedRegion, selectedDistrict, onTour, onAbout }) => {
    const scopeLabel = selectedDistrict || selectedRegion || null;

    return (
        <header className="absolute left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-brand-gold/20 bg-brand-deep/95 px-4 shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-md sm:px-6">
            <div className="flex items-center gap-3.5">
                <BrandMark className="h-10 w-10 shrink-0 rounded-[10px]" />
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-base font-semibold uppercase leading-none tracking-[0.08em] text-white">
                            <span className="text-white/92">Eco</span> <span className="text-brand-gold">Pulse</span>
                        </h1>
                    </div>
                    <p className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.16em] text-white/30">
                        Forest Carbon Monitoring
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {(selectedYear || scopeLabel) && (
                    <div className="hidden items-center gap-2 sm:flex">
                        {selectedYear && (
                            <div className="flex items-center gap-1.5 rounded border border-white/10 bg-white/[0.03] px-3 py-1.5">
                                <Calendar size={11} className="text-white/40" />
                                <span className="text-[10px] font-semibold tracking-widest text-white/70 tabular-nums">
                                    {selectedYear}
                                </span>
                            </div>
                        )}
                        {scopeLabel && (
                            <div className="flex max-w-[200px] items-center gap-1.5 rounded border border-white/10 bg-white/[0.03] px-3 py-1.5">
                                <MapPin size={11} className="shrink-0 text-white/40" />
                                <span className="truncate text-[10px] font-semibold tracking-wider text-white/70">
                                    {scopeLabel}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {onTour && (
                    <button
                        onClick={onTour}
                        title="Help"
                        className="hidden items-center gap-1.5 rounded border border-white/10 px-2.5 py-1.5 text-white/25 transition-all duration-200 hover:border-white/20 hover:text-white/60 md:flex md:px-3"
                    >
                        <HelpCircle size={11} />
                        <span className="hidden text-[9px] font-semibold sm:block">Help</span>
                    </button>
                )}

                {onAbout && (
                    <button
                        onClick={onAbout}
                        title="About this portal"
                        className="flex items-center gap-1.5 rounded border border-white/10 px-2.5 py-1.5 text-white/20 transition-all duration-200 hover:border-brand-gold/30 hover:text-brand-gold sm:px-3"
                    >
                        <Info size={11} />
                        <span className="hidden text-[9px] font-semibold sm:block">About</span>
                    </button>
                )}
            </div>
        </header>
    );
};
