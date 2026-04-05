import { ArrowUp, ArrowDown } from 'lucide-react';

// Format an absolute delta value to a compact string like "+1.1M" or "-340K"
function fmtDelta(raw) {
    if (raw === null || raw === undefined || isNaN(raw)) return null;
    const sign = raw >= 0 ? '+' : '−';
    const abs = Math.abs(raw);
    if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000)     return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000)         return `${sign}${(abs / 1_000).toFixed(0)}K`;
    return `${sign}${abs.toFixed(0)}`;
}

// Severity band based on absolute percentage magnitude
function getSeverity(pct) {
    const abs = Math.abs(pct);
    if (abs < 2)  return { label: 'Stable',      color: 'text-white/30',    bg: '' };
    if (abs < 8)  return { label: 'Moderate',     color: 'text-amber-400',   bg: 'bg-amber-500/8' };
    if (abs < 20) return { label: 'Significant',  color: 'text-orange-400',  bg: 'bg-orange-500/8' };
    return           { label: 'Critical',      color: 'text-red-400',     bg: 'bg-red-500/10' };
}

export const KPI = ({
    label,
    value,
    suffix = '',
    unit = 'tonnes C',
    trendValue,
    absoluteDelta = null,
    prevYear = null,
    invertColor = false,
    icon: Icon,
}) => {
    const isPositive = trendValue > 0;
    const isNeutral  = !trendValue || Math.abs(trendValue) < 0.01;

    const directionColor = isNeutral
        ? 'text-white/20'
        : (isPositive
            ? (invertColor ? 'text-red-400' : 'text-emerald-400')
            : (invertColor ? 'text-emerald-400' : 'text-red-400'));

    const severity = isNeutral ? null : getSeverity(trendValue);

    const deltaStr    = fmtDelta(absoluteDelta);
    const yearLabel   = prevYear ? `vs ${prevYear}` : 'vs prev. year';

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

            {/* Trend row */}
            {trendValue !== undefined && (
                <div className={`pt-2 border-t border-white/5 rounded-b-sm -mx-1 px-1 ${severity?.bg ?? ''}`}>
                    {/* Top line: arrow + % + severity label */}
                    <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-0.5 text-[11px] font-bold ${directionColor}`}>
                            {!isNeutral && (isPositive
                                ? <ArrowUp size={11} strokeWidth={2.5} />
                                : <ArrowDown size={11} strokeWidth={2.5} />
                            )}
                            {isNeutral ? '—' : `${Math.abs(trendValue).toFixed(1)}%`}
                        </div>
                        {severity && (
                            <span className={`text-[8px] font-bold uppercase tracking-wider ${severity.color}`}>
                                {severity.label}
                            </span>
                        )}
                    </div>
                    {/* Bottom line: absolute delta + year */}
                    <div className="flex items-center justify-between mt-0.5">
                        {deltaStr ? (
                            <span className={`text-[9px] font-bold tabular-nums ${directionColor} opacity-70`}>
                                {deltaStr} tonnes C
                            </span>
                        ) : (
                            <span />
                        )}
                        <span className="text-[9px] font-medium text-white/20">
                            {yearLabel}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
