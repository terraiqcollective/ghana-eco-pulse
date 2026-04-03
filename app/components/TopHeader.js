import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const TopHeader = () => {
    return (
        <header className="absolute top-0 left-0 right-0 z-40 h-16 bg-brand-deep/95 backdrop-blur-md border-b border-brand-gold/30 flex items-center justify-between px-6 pointer-events-auto shadow-2xl">
            <div className="flex items-center gap-5">
                <div className="bg-brand-gold p-2 rounded shadow-lg shadow-brand-gold/30 ring-1 ring-brand-gold/50">
                    <ShieldCheck className="text-brand-deep w-6 h-6" />
                </div>
                <div>
                    <div className="flex items-baseline gap-2">
                        <h1 className="text-white text-lg font-extrabold tracking-tighter uppercase leading-none">
                            EcoPulse <span className="text-brand-gold">Ghana</span>
                        </h1>
                        <span className="text-[9px] px-1.5 py-0.5 rounded border border-brand-gold/30 text-brand-gold font-bold uppercase tracking-tighter">Official Portal</span>
                    </div>
                    <p className="text-brand-faded/70 text-[10px] font-bold tracking-[0.2em] uppercase mt-1">
                        National Environmental Agency • Monitoring System
                    </p>
                </div>
            </div>

            {/* Removed search and utility icons */}
        </header>
    );
};
