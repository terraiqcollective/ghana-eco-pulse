"use client";

import { Calendar, MapPin, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Custom tooltip for chart
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        return (
            <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
                <p className="text-slate-400 text-sm font-medium mb-1">{data.payload.year}</p>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                    <span className="text-slate-200 text-sm font-semibold">
                        Carbon Loss (tC) {data.value?.toLocaleString() || 0}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export default function Sidebar({
    years,
    regions,
    districts,
    selectedYear,
    selectedRegion,
    selectedDistrict,
    onYearChange,
    onRegionChange,
    onDistrictChange,
    metricsData,
    loadingDistricts
}) {
    const handleYearChange = (e) => onYearChange(parseInt(e.target.value));
    const handleRegionChange = (e) => onRegionChange(e.target.value);
    const handleDistrictChange = (e) => onDistrictChange(e.target.value);

    const formatNumber = (num) => {
        if (!num) return '0';
        return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    };

    return (
        <div className="w-96 h-full bg-slate-900 border-r border-slate-800 flex flex-col shadow-xl z-20 overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                    <Layers className="w-6 h-6" />
                    CarbonWatch
                </h1>
                <p className="text-slate-400 text-sm mt-1">Deforestation & Carbon Monitor</p>
            </div>

            <div className="p-6 space-y-8 flex-1">
                {/* Filters Section */}
                <div className="space-y-4">
                    <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Filters</h2>

                    {/* Year Filter */}
                    <div className="space-y-1">
                        <label className="text-sm text-slate-300 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-500" /> Year
                        </label>
                        <select
                            value={selectedYear || ''}
                            onChange={handleYearChange}
                            className="w-full bg-slate-800 border-slate-700 text-slate-200 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="" disabled>Select Year</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    {/* Region Filter */}
                    <div className="space-y-1">
                        <label className="text-sm text-slate-300 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-500" /> Region
                        </label>
                        <select
                            value={selectedRegion || ''}
                            onChange={handleRegionChange}
                            className="w-full bg-slate-800 border-slate-700 text-slate-200 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Regions</option>
                            {regions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    {/* District Filter */}
                    <div className="space-y-1">
                        <label className="text-sm text-slate-300 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-yellow-500" /> District
                        </label>
                        <select
                            value={selectedDistrict || ''}
                            onChange={handleDistrictChange}
                            className="w-full bg-slate-800 border-slate-700 text-slate-200 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!selectedRegion || loadingDistricts}
                        >
                            <option value="">
                                {loadingDistricts ? 'Loading districts...' :
                                    !selectedRegion ? 'Select a region first' :
                                        'All Districts'}
                            </option>
                            {districts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {selectedRegion && !loadingDistricts && districts.length === 0 && (
                            <p className="text-xs text-slate-500 mt-1">No districts in this region</p>
                        )}
                    </div>
                </div>

                {/* Metrics Section */}
                <div className="space-y-4">
                    <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Key Metrics</h2>

                    {/* Carbon Stock */}
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <p className="text-slate-400 text-sm">Carbon Stock</p>
                        <p className="text-2xl font-bold text-emerald-400">
                            {formatNumber(metricsData?.carbonStock)} <span className="text-sm font-normal text-slate-500">t C</span>
                        </p>
                    </div>

                    {/* Carbon Loss */}
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <p className="text-slate-400 text-sm">Carbon Loss</p>
                        <p className="text-2xl font-bold text-red-400">
                            {formatNumber(metricsData?.carbonLoss)} <span className="text-sm font-normal text-slate-500">t C</span>
                        </p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="space-y-4">
                    <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Loss Trend</h2>

                    {metricsData?.trend && metricsData.trend.length > 0 ? (
                        <div style={{ height: '192px' }} className="w-full bg-slate-900 rounded-lg p-4 border border-slate-800">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metricsData.trend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="year" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                    <Bar dataKey="loss" fill="#eab308" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="text-slate-500 text-sm">No trend data available</div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-slate-800 text-slate-600 text-xs text-center">
                Powered by Google Earth Engine
            </div>
        </div>
    );
}
