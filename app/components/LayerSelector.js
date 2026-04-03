import React, { useState, useRef, useEffect } from 'react';
import { Layers, Check, ChevronDown } from 'lucide-react';

export const LayerSelector = ({ options, selectedIds, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-brand-deep/40 border border-brand-gold/20 rounded px-3 py-2.5 hover:bg-brand-deep/60 transition-all group"
            >
                <div className="flex items-center gap-2">
                    <Layers size={14} className="text-brand-gold" />
                    <span className="text-[11px] font-black text-white uppercase tracking-widest">
                        {selectedIds.length === 0 ? 'Select Layers' : `${selectedIds.length} Layers Active`}
                    </span>
                </div>
                <ChevronDown size={14} className={`text-brand-gold/50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-brand-deep border border-brand-gold/30 rounded shadow-2xl overflow-hidden">
                    {options.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => onChange(option.id)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-brand-gold/10 transition-colors border-b border-brand-gold/10 last:border-none"
                        >
                            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${selectedIds.includes(option.id) ? 'text-brand-gold' : 'text-white/40'}`}>
                                {option.label}
                            </span>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedIds.includes(option.id) ? 'bg-brand-gold border-brand-gold' : 'border-brand-gold/30'}`}>
                                {selectedIds.includes(option.id) && <Check size={10} className="text-brand-deep" />}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
