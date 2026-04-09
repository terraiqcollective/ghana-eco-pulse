import {
    AreaChart, Area, XAxis, YAxis, Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Loader2 } from 'lucide-react';

const fmt = (v) => {
    if (typeof v !== 'number') return v;
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
    return v.toFixed(0);
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-brand-deep border border-brand-gold/30 rounded px-3 py-2 shadow-xl">
            <p className="text-[9px] font-bold text-brand-gold/60 mb-1.5">{label}</p>
            {payload.map((entry) => (
                <div key={entry.dataKey} className="flex items-center gap-2 mb-0.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
                    <span className="text-[10px] font-semibold text-white/60">
                        {entry.dataKey === 'stock' ? 'Stock' : 'Loss'}:
                    </span>
                    <span className="text-[10px] font-black text-white tabular-nums">
                        {fmt(entry.value)}
                    </span>
                </div>
            ))}
        </div>
    );
};

export const LossChart = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="h-36 w-full flex items-center justify-center">
                <Loader2 size={16} className="animate-spin text-brand-gold/30" />
            </div>
        );
    }

    const chartData = (data || [])
        .filter(d => parseInt(d.year) >= 2019)
        .sort((a, b) => parseInt(a.year) - parseInt(b.year));

    if (chartData.length === 0) {
        return (
            <div className="h-36 w-full flex items-center justify-center text-[9px] font-semibold text-brand-faded/20 tracking-widest">
                No trend data available
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Legend */}
            <div className="flex items-center gap-4 mb-2 px-1">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-0.5 bg-emerald-400" />
                    <span className="text-[8px] font-semibold text-emerald-400/70">Stock</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-0.5 bg-brand-gold" />
                    <span className="text-[8px] font-semibold text-brand-gold/70">Loss</span>
                </div>
            </div>

            <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 4, right: 28, bottom: 0, left: 28 }}
                    >
                        <defs>
                            <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <XAxis
                            dataKey="year"
                            type="category"
                            tick={{ fill: 'rgba(254,243,199,0.3)', fontSize: 8, fontWeight: 600 }}
                            tickLine={false}
                            axisLine={false}
                            interval={0}
                            tickFormatter={(val) => String(val)}
                        />

                        {/* Left Y-axis — stock */}
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            hide={false}
                            tick={{ fill: 'rgba(52,211,153,0.4)', fontSize: 7, fontWeight: 600 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={fmt}
                            width={26}
                        />

                        {/* Right Y-axis — loss, independent scale */}
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            hide={false}
                            tick={{ fill: 'rgba(251,191,36,0.4)', fontSize: 7, fontWeight: 600 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={fmt}
                            width={26}
                        />

                        <Tooltip content={<CustomTooltip />} />

                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="stock"
                            stroke="#34d399"
                            strokeWidth={1.5}
                            fillOpacity={1}
                            fill="url(#colorStock)"
                            dot={false}
                            activeDot={{ r: 3, fill: '#34d399', strokeWidth: 0 }}
                        />
                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="loss"
                            stroke="#fbbf24"
                            strokeWidth={1.5}
                            fillOpacity={1}
                            fill="url(#colorLoss)"
                            dot={false}
                            activeDot={{ r: 3, fill: '#fbbf24', strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
