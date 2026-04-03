import { ArrowUp, ArrowDown } from 'lucide-react';

export const KPI = ({ label, value, suffix = '', unit = 'tonnes C', trendValue, invertColor = false, icon: Icon }) => {
    const isPositive = trendValue > 0;
    const isNeutral = !trendValue || Math.abs(trendValue) < 0.01;

    const trendColor = isNeutral
        ? 'text-brand-faded/30'
        : (isPositive
            ? (invertColor ? 'text-red-400' : 'text-emerald-400')
            : (invertColor ? 'text-emerald-400' : 'text-red-400'));

    return (
        <div className="flex flex-col p-4 bg-brand-deep/60 border border-brand-gold/10 rounded-xl hover:border-brand-gold/25 transition-all duration-300">
            {/* Header row */}
            <div className="flex justify-between items-start mb-3">
                <span className="text-[9px] font-black text-brand-faded/50 uppercase tracking-[0.2em] leading-tight max-w-[160px]">
                    {label}
                </span>
                {Icon && (
                    <div className={`${invertColor ? 'text-red-500/50' : 'text-emerald-500/50'}`}>
                        <Icon size={20} strokeWidth={1.5} />
                    </div>
                )}
            </div>

            {/* Value row */}
            <div className="flex items-baseline gap-0.5 mb-0.5">
                <span className="text-4xl font-black tabular-nums tracking-tighter text-white leading-none">
                    {value}
                </span>
                {suffix && (
                    <span className="text-2xl font-black tracking-tighter text-white/70 leading-none ml-0.5">
                        {suffix}
                    </span>
                )}
            </div>

            {/* Unit label */}
            <span className="text-[9px] font-bold text-brand-faded/35 uppercase tracking-widest mb-3">
                {unit}
            </span>

            {/* Trend row */}
            {trendValue !== undefined && (
                <div className="flex items-center gap-1.5 pt-2 border-t border-brand-gold/8">
                    <div className={`flex items-center gap-0.5 text-[11px] font-black ${trendColor}`}>
                        {!isNeutral && (isPositive
                            ? <ArrowUp size={11} strokeWidth={3} />
                            : <ArrowDown size={11} strokeWidth={3} />
                        )}
                        {isNeutral ? '—' : `${Math.abs(trendValue).toFixed(1)}%`}
                    </div>
                    <span className="text-[9px] font-medium text-brand-faded/30">
                        vs. previous year
                    </span>
                </div>
            )}
        </div>
    );
};
