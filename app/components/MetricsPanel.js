"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// Summary Widget Component
const StatCard = ({ label, value, unit }) => (
    <div className="flex-1 bg-dashboard-widget flex flex-col items-center py-4 mx-1 first:ml-0 last:mr-0 rounded border-l-4 border-dashboard-accent shadow-sm">
        <span className="text-dashboard-textMuted text-[10px] uppercase tracking-wider mb-1">{label}</span>
        <span className="text-white text-xl font-bold">{value}</span>
        <span className="text-dashboard-accent text-xs mt-1">{unit}</span>
    </div>
);

// Chart Container Component
const ChartWrapper = ({ title, children, className }) => (
    <div className={`flex flex-col bg-dashboard-panel border-b-2 border-r-2 border-l-0 border-dashboard-border m-2 p-3 ${className}`}>
        <h3 className="text-white text-xs font-semibold tracking-wide border-b border-dashboard-border mb-3 pb-2 uppercase">
            {title}
        </h3>
        <div className="flex-1 relative min-h-0 w-full">
            {children}
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-dashboard-bg border border-dashboard-border p-2 rounded shadow-xl">
                <p className="text-dashboard-textMuted text-xs mb-1">{label}</p>
                <p className="text-white font-bold text-sm">
                    {payload[0].value?.toLocaleString()} <span className="text-dashboard-accent text-xs">tC</span>
                </p>
            </div>
        );
    }
    return null;
};

// Dummy Data for Pie Chart
const IMPACT_DATA = [
    { name: 'Stable', value: 65, color: '#10b981' },
    { name: 'Loss', value: 25, color: '#961E1E' },
    { name: 'Gain', value: 10, color: '#E39218' },
];

export default function MetricsPanel({ metricsData }) {

    const formatNumber = (num) => {
        if (!num && num !== 0) return 'Loading...';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toLocaleString();
    };

    return (
        <div className="h-full flex flex-col p-2 space-y-2 overflow-hidden">

            {/* Top: Stat Cards */}
            <div className="flex flex-row justify-between shrink-0 h-24">
                <StatCard
                    label="Carbon Stock"
                    value={formatNumber(metricsData?.carbonStock)}
                    unit="t C"
                />
                <StatCard
                    label="Carbon Loss"
                    value={formatNumber(metricsData?.carbonLoss)}
                    unit="t C"
                />
            </div>

            {/* Middle: Trend Chart */}
            <ChartWrapper title="Emissions Trend" className="flex-[3]">
                {metricsData?.trend && metricsData.trend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metricsData.trend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#22394B" vertical={false} />
                            <XAxis
                                dataKey="year"
                                stroke="#637684"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                dy={5}
                            />
                            <YAxis
                                stroke="#637684"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                            <Bar
                                dataKey="loss"
                                fill="#B3760D"
                                radius={[2, 2, 0, 0]}
                                barSize={16}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-dashboard-textMuted text-xs">
                        Loading Trend Data...
                    </div>
                )}
            </ChartWrapper>

            {/* Bottom: Impact Chart */}
            <ChartWrapper title="Ecological Impact" className="flex-[2]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={IMPACT_DATA}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {IMPACT_DATA.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Legend
                            verticalAlign="middle"
                            align="right"
                            layout="vertical"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '10px', color: '#B0B0B0' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </ChartWrapper>

        </div>
    );
}
