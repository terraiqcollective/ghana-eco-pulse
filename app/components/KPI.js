import { ArrowUp, ArrowDown } from 'lucide-react';

export const KPI = ({ label, value, suffix = '', unit = 'tonnes C', trendValue, invertColor = false, icon: Icon }) => {
    const isPositive = trendValue > 0;
    const isNeutral = !trendValue || Math.abs(trendValue) < 0.01;

    const trendColor = isNeutral
        ? 'text-white/20'
        : (isPositive
            ? (invertColor ? 'text-red-400' : 'text-emerald-400')
            : (invertColor ? 'text-emerald-400' : 'text-red-400'));

    const trendBg = isNeutral
        ? ''
        : (isPositive
            ? (invertColor ? 'bg-red-500/8' : 'bg-emerald-500/8')
            : (invertColor ? 'bg-emerald-500/8' : 'bg-red-500/8'));

    return (
        <div className="flex flex-col p-4 bg-brand-deep/50 border border-white/6 rounded-xl hover:border-white/12 transition-all duration-300 group">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-medium text-white/40 leading-tight max-w-[160px]">
                    {label}
                </span>
                {Icon && (
                    <div className={`opacity-40 group-hover:opacity-60 transition-opacity ${invertColor ? 'text-red-400' : 'text-emerald-400'}`}>
                        <Icon size={18} strokeWidth={1.5} />
                    </div>
                )}
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-0.5 mb-0.5">
                <span className="text-4xl font-black tabular-nums tracking-tighter text-white leading-none">
                    {value}
                </span>
                {suffix && (
                    <span className="text-2xl font-black tracking-tighter text-white/60 leading-none ml-0.5">
                        {suffix}
                    </span>
                )}
            </div>

            {/* Unit */}
            <span className="text-[9px] font-medium text-white/25 tracking-wider mb-3">
                {unit}
            </span>

            {/* Trend */}
            {trendValue !== undefined && (
                <div className={`flex items-center gap-1.5 pt-2 border-t border-white/5 ${trendBg} rounded-b-sm -mx-1 px-1`}>
                    <div className={`flex items-center gap-0.5 text-[11px] font-bold ${trendColor}`}>
                        {!isNeutral && (isPositive
                            ? <ArrowUp size={11} strokeWidth={2.5} />
                            : <ArrowDown size={11} strokeWidth={2.5} />
                        )}
                        {isNeutral ? '—' : `${Math.abs(trendValue).toFixed(1)}%`}
                    </div>
                    <span className="text-[9px] font-medium text-white/20">
                        vs previous year
                    </span>
                </div>
            )}
        </div>
    );
};
