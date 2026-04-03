import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const SUNBURST_PARENT_DATA = [
    { name: 'Forest', value: 60, color: '#10b981' }, // emerald-500
    { name: 'Mining', value: 30, color: '#f87171' }, // red-400
    { name: 'Water', value: 10, color: '#60a5fa' }, // blue-400
];

const SUNBURST_CHILD_DATA = [
    { name: 'Primary Forest', value: 40, color: '#047857' }, // emerald-700
    { name: 'Degraded Forest', value: 20, color: '#34d399' }, // emerald-400
    { name: 'Industrial Mining', value: 10, color: '#b91c1c' }, // red-700
    { name: 'Artisanal Mining', value: 20, color: '#fbbf24' }, // amber-400
    { name: 'River', value: 6, color: '#1d4ed8' }, // blue-700
    { name: 'Lake', value: 4, color: '#93c5fd' }, // blue-300
];

export const SunburstChart = () => {
    return (
        <div className="w-full flex flex-col items-center">
            <div className="h-56 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#052e16',
                                borderColor: 'rgba(251, 191, 36, 0.4)',
                                fontSize: '11px',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                color: '#fff'
                            }}
                        />
                        {/* Inner Pie: Parent Categories */}
                        <Pie
                            data={SUNBURST_PARENT_DATA}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={50}
                            stroke="none"
                            animationBegin={0}
                            animationDuration={1500}
                        >
                            {SUNBURST_PARENT_DATA.map((entry, index) => (
                                <Cell key={`cell-parent-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        {/* Outer Pie: Child Categories */}
                        <Pie
                            data={SUNBURST_CHILD_DATA}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={65}
                            stroke="none"
                            animationBegin={200}
                            animationDuration={1500}
                        >
                            {SUNBURST_CHILD_DATA.map((entry, index) => (
                                <Cell key={`cell-child-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Custom Sunburst Legend */}
            <div className="mt-2 w-full grid grid-cols-2 gap-x-3 gap-y-2 px-1">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-[9px] font-black text-white/80 uppercase tracking-tighter truncate">
                        Forest (60%)
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                    <span className="text-[9px] font-black text-white/80 uppercase tracking-tighter truncate">
                        Mining (30%)
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                    <span className="text-[9px] font-black text-white/80 uppercase tracking-tighter truncate">
                        Water (10%)
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-[9px] font-black text-white/80 uppercase tracking-tighter truncate">
                        Artisanal
                    </span>
                </div>
            </div>
        </div>
    );
};
