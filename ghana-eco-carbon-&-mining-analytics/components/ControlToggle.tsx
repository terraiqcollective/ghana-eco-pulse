import React from 'react';

interface ControlToggleProps {
  label: string;
  isActive: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
}

export const ControlToggle: React.FC<ControlToggleProps> = ({ label, isActive, onToggle, icon }) => {
  return (
    <button 
      onClick={onToggle}
      className={`flex items-center justify-between w-full p-2.5 rounded transition-all duration-150 border ${
        isActive 
          ? 'bg-amber-500/10 border-amber-500/40' 
          : 'bg-green-900/20 border-white/5 hover:bg-green-900/40'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`transition-colors ${isActive ? 'text-amber-400' : 'text-amber-100/40'}`}>
          {icon}
        </div>
        <span className={`text-[12px] font-black tracking-tight uppercase ${isActive ? 'text-white' : 'text-amber-100/40'}`}>
          {label}
        </span>
      </div>
      <div className={`w-7 h-3.5 rounded-sm p-0.5 transition-colors duration-150 ${isActive ? 'bg-amber-500' : 'bg-green-800'}`}>
        <div className={`w-2.5 h-2.5 rounded-sm bg-white transition-transform duration-150 ${isActive ? 'translate-x-3.5' : 'translate-x-0'}`} />
      </div>
    </button>
  );
};