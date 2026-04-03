import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value, percent } = payload[0].payload;
    return (
        <div className="bg-brand-deep border border-brand-gold/30 rounded px-3 py-2 shadow-xl">
            <p className="text-[9px] font-black uppercase tracking-widest text-brand-gold/60 mb-1">{name}</p>
            <p className="text-[11px] font-black text-white tabular-nums">
                {value >= 1e6
                    ? `${(value / 1e6).toFixed(2)}M`
                    : value >= 1e3
                        ? `${(value / 1e3).toFixed(1)}k`
                        : value.toFixed(0)} <span className="text-white/40 font-bold">tonnes C</span>
            </p>
            <p className="text-[9px] font-bold text-white/40 mt-0.5">
                {(percent * 100).toFixed(1)}% of total
            </p>
        </div>
    );
};

export const CarbonBalanceChart = ({ carbonStock = 0, carbonLoss = 0, loading }) => {
    if (loading) {
        return (
            <div className="h-28 w-full flex items-center justify-center">
                <Loader2 size={16} className="animate-spin text-brand-gold/30" />
            </div>
        );
    }

    const total = carbonStock + carbonLoss;

    if (total === 0) {
        return (
            <div className="h-28 w-full flex items-center justify-center text-[9px] uppercase font-black text-brand-faded/20 tracking-widest">
                No data
            </div>
        );
    }

    const data = [
        { name: 'Carbon Stock', value: carbonStock, color: '#34d399' },
        { name: 'Carbon Loss', value: carbonLoss, color: '#fbbf24' },
    ];

    const lossPercent = ((carbonLoss / total) * 100).toFixed(1);

    return (
        <div className="flex items-center gap-4">
            {/* Donut */}
            <div className="h-20 w-20 shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip content={<CustomTooltip />} />
                        <Pie
                            data={data}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={24}
                            outerRadius={36}
                            stroke="none"
                            startAngle={90}
                            endAngle={-270}
                            animationBegin={0}
                            animationDuration={800}
                        >
                            {data.map((entry, i) => (
                                <Cell key={i} fill={entry.color} opacity={0.9} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                {/* Centre label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black text-brand-gold tabular-nums leading-none">
                        {lossPercent}%
                    </span>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-3 flex-1 min-w-0">
                {data.map((item) => (
                    <div key={item.name} className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                            <span className="text-[9px] font-black uppercase tracking-widest truncate" style={{ color: item.color }}>
                                {item.name}
                            </span>
                        </div>
                        <span className="text-[10px] font-black text-white/60 tabular-nums pl-3.5">
                            {item.value >= 1e6
                                ? `${(item.value / 1e6).toFixed(2)}M`
                                : item.value >= 1e3
                                    ? `${(item.value / 1e3).toFixed(1)}k`
                                    : item.value.toFixed(0)}{' '}
                            <span className="text-white/25 font-bold text-[8px]">t C</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
