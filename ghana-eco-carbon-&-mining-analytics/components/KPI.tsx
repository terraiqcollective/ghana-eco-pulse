import React from 'react';

interface KPIProps {
  label: string;
  value: string;
  unit: string;
  colorClass?: string;
}

export const KPI: React.FC<KPIProps> = ({ label, value, unit, colorClass = "text-white" }) => {
  return (
    <div className="flex flex-col p-3 bg-green-900/40 border border-amber-500/10 rounded">
      <span className="text-[11px] font-black text-amber-100/50 uppercase tracking-[0.15em] mb-1">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-black tabular-nums tracking-tighter ${colorClass}`}>
          {value}
        </span>
        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
          {unit}
        </span>
      </div>
    </div>
  );
};