import { ArrowUp, ArrowDown } from 'lucide-react';

export const KPI = ({ label, value, unit, colorClass = "text-white", trendValue, trendLabel, invertColor = false, icon: Icon }) => {
    const isPositive = trendValue > 0;
    const isNeutral = Math.abs(trendValue) < 0.01;

    // Determine trend color based on metric type (Standard vs Inverted)
    const trendColor = isNeutral
        ? 'text-brand-faded/40'
        : (isPositive ? (invertColor ? 'text-red-500' : 'text-emerald-500') : (invertColor ? 'text-emerald-500' : 'text-red-500'));

    return (
        <div className="flex flex-col p-5 bg-brand-deep/60 border border-brand-gold/10 rounded-xl relative group hover:border-brand-gold/20 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-brand-faded/60 uppercase tracking-[0.2em] leading-tight max-w-[140px]">
                    {label}
                </span>
                {Icon && (
                    <div className={`${invertColor ? 'text-red-500/60' : 'text-emerald-500/60'}`}>
                        <Icon size={22} strokeWidth={1.5} />
                    </div>
                )}
            </div>

            <div className="flex items-baseline mb-1">
                <span className={`text-5xl font-black tabular-nums tracking-tighter ${colorClass}`}>
                    {value}
                </span>
                <span className={`text-3xl font-black tracking-tighter ${colorClass}`}>
                    {unit.startsWith('M') ? 'M' : unit.startsWith('k') ? 'k' : ''}
                </span>
            </div>

            {trendValue !== undefined && (
                <div className="flex flex-col gap-0.5 mt-1">
                    <div className="flex items-center gap-1.5 leading-none">
                        <div className={`flex items-center gap-1 text-[13px] font-bold ${trendColor}`}>
                            {trendValue > 0 ? <ArrowUp size={14} strokeWidth={3} /> : trendValue < 0 ? <ArrowDown size={14} strokeWidth={3} /> : null}
                            {Math.abs(trendValue).toFixed(1)}%
                        </div>
                        <span className="text-[13px] font-medium text-brand-faded/60 leading-none">{trendLabel}</span>
                    </div>
                    <span className="text-[11px] font-medium text-brand-faded/30 mt-1 leading-none">
                        vs. previous year
                    </span>
                </div>
            )}
        </div>
    );
};
