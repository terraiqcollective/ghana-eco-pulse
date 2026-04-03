"use client";

// Icons
const FilterIcon = () => (
    <svg className="w-4 h-4 text-dashboard-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
);

const YearSlider = ({ min, max, value, onChange }) => (
    <div className="px-4 py-4 border-t border-dashboard-border">
        <div className="flex justify-between text-white text-xs mb-2 font-mono">
            <span>{min}</span>
            <span className="text-dashboard-accent font-bold text-lg">{value}</span>
            <span>{max}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={onChange}
            className="w-full h-2 bg-dashboard-widget rounded-lg appearance-none cursor-pointer accent-dashboard-accent"
        />
    </div>
);

export default function FiltersSidebar({
    years,
    regions,
    districts,
    selectedYear,
    selectedRegion,
    selectedDistrict,
    onYearChange,
    onRegionChange,
    onDistrictChange,
    loadingDistricts
}) {
    const handleRegionChange = (e) => onRegionChange(e.target.value);
    const handleDistrictChange = (e) => onDistrictChange(e.target.value);
    const handleSliderChange = (e) => onYearChange(parseInt(e.target.value));

    const minYear = years.length > 0 ? parseInt(years[0]) : 2020;
    const maxYear = years.length > 0 ? parseInt(years[years.length - 1]) : 2025;
    const sliderValue = selectedYear || minYear;

    return (
        <div className="h-full flex flex-col text-dashboard-textMuted text-sm">
            {/* Header */}
            <div className="px-6 py-4 flex items-center gap-2 border-b border-dashboard-border">
                <FilterIcon />
                <h2 className="text-white font-semibold tracking-wide uppercase text-xs">Analysis Filters</h2>
            </div>

            <div className="flex-1 p-6 space-y-6">

                {/* Region Filter */}
                <div>
                    <label className="block mb-2 text-dashboard-textMuted uppercase text-xs tracking-wider">Region</label>
                    <div className="relative">
                        <select
                            value={selectedRegion || ''}
                            onChange={handleRegionChange}
                            className="w-full bg-dashboard-widget text-white border border-dashboard-border rounded px-3 py-2 focus:outline-none focus:border-dashboard-accent appearance-none cursor-pointer"
                        >
                            <option value="">Select Region</option>
                            {regions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-dashboard-textMuted">
                            ▼
                        </div>
                    </div>
                </div>

                {/* District Filter */}
                <div>
                    <label className="block mb-2 text-dashboard-textMuted uppercase text-xs tracking-wider">District</label>
                    <div className="relative">
                        <select
                            value={selectedDistrict || ''}
                            onChange={handleDistrictChange}
                            disabled={!selectedRegion || loadingDistricts}
                            className="w-full bg-dashboard-widget text-white border border-dashboard-border rounded px-3 py-2 focus:outline-none focus:border-dashboard-accent appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">
                                {loadingDistricts ? 'Loading...' :
                                    !selectedRegion ? 'Select Region First' :
                                        'All Districts'}
                            </option>
                            {districts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-dashboard-textMuted">
                            ▼
                        </div>
                    </div>
                </div>

            </div>

            {/* Year Slider Footer */}
            <div className="mt-auto">
                <YearSlider
                    min={minYear}
                    max={maxYear}
                    value={sliderValue}
                    onChange={handleSliderChange}
                />
            </div>
        </div>
    );
}
