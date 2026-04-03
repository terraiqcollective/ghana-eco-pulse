import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts';
import { Loader2 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-brand-deep border border-brand-gold/30 rounded px-3 py-2 shadow-xl">
            <p className="text-[9px] font-black text-brand-gold/60 uppercase tracking-widest mb-1.5">{label}</p>
            {payload.map((entry) => (
                <div key={entry.dataKey} className="flex items-center gap-2 mb-0.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                        {entry.dataKey === 'stock' ? 'Stock' : 'Loss'}:
                    </span>
                    <span className="text-[10px] font-black text-white tabular-nums">
                        {typeof entry.value === 'number'
                            ? entry.value >= 1e6
                                ? `${(entry.value / 1e6).toFixed(1)}M`
                                : entry.value >= 1e3
                                    ? `${(entry.value / 1e3).toFixed(1)}k`
                                    : entry.value.toFixed(0)
                            : entry.value}
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

    // Filter to 2019 onwards and sort by year
    const chartData = (data || [])
        .filter(d => parseInt(d.year) >= 2019)
        .sort((a, b) => parseInt(a.year) - parseInt(b.year));

    if (chartData.length === 0) {
        return (
            <div className="h-36 w-full flex items-center justify-center text-[9px] uppercase font-black text-brand-faded/20 tracking-widest">
                No trend data available
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Chart legend */}
            <div className="flex items-center gap-4 mb-2 px-1">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-0.5 bg-emerald-400" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400/70">Stock</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-0.5 bg-brand-gold" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-brand-gold/70">Loss</span>
                </div>
            </div>

            <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
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
                            tick={{ fill: 'rgba(254,243,199,0.3)', fontSize: 8, fontWeight: 700 }}
                            tickLine={false}
                            axisLine={false}
                            interval={0}
                            tickFormatter={(val) => String(val)}
                        />
                        <YAxis hide />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
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
