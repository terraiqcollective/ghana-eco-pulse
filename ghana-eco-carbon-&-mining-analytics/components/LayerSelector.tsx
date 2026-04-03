import React, { useState, useRef, useEffect } from 'react';
import { Layers, Check, ChevronDown } from 'lucide-react';

interface LayerOption {
  id: string;
  label: string;
}

interface LayerSelectorProps {
  options: LayerOption[];
  selectedIds: string[];
  onChange: (id: string) => void;
}

export const LayerSelector: React.FC<LayerSelectorProps> = ({ options, selectedIds, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
        className="w-full flex items-center justify-between bg-green-900/40 border border-amber-500/20 rounded px-3 py-2.5 hover:bg-green-900/60 transition-all group"
      >
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-amber-400" />
          <span className="text-[11px] font-black text-white uppercase tracking-widest">
            {selectedIds.length === 0 ? 'Select Layers' : `${selectedIds.length} Layers Active`}
          </span>
        </div>
        <ChevronDown size={14} className={`text-amber-400/50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#052e16] border border-amber-500/30 rounded shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-500/10 transition-colors border-b border-amber-500/10 last:border-none"
            >
              <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${selectedIds.includes(option.id) ? 'text-amber-400' : 'text-white/40'}`}>
                {option.label}
              </span>
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedIds.includes(option.id) ? 'bg-amber-500 border-amber-500' : 'border-amber-500/30'}`}>
                {selectedIds.includes(option.id) && <Check size={10} className="text-[#052e16]" />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};