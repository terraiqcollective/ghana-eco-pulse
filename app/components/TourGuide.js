"use client";

import { useEffect, useState, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

const TOUR_KEY = 'ecopulse_tour_seen';

const STEPS = [
    {
        target: 'tour-map',
        title: 'The Forest Map',
        body: 'The map displays Ghana\'s forest carbon cover and mining loss zones as satellite-derived layers. Click any district boundary directly on the map to zoom in and automatically load its carbon data — no need to use the dropdown.',
        position: 'right',
    },
    {
        target: 'tour-left-panel',
        title: 'Filter & Explore',
        body: 'Select a region first, then narrow down to a specific district. All carbon stock and mining loss calculations are restricted to your selected area. The year slider and layer toggles also live here.',
        position: 'right',
    },
    {
        target: 'tour-year-slider',
        title: 'Year Selection',
        body: 'Drag the slider to move between 2019 and the most recent available year. Every metric, chart, and map layer updates to reflect the selected year. The tick marks show which years have data.',
        position: 'right',
    },
    {
        target: 'tour-map-layers',
        title: 'Map Layers',
        body: 'Toggle the Carbon Stock and Mining Loss satellite layers on or off independently. District and region boundary outlines appear automatically when you make a selection and can be toggled beneath each filter.',
        position: 'right',
    },
    {
        target: 'tour-year-comparison',
        title: 'Year-over-Year Comparison',
        body: 'Switch this on to compare two different years side by side. Choose a second year from the dropdown that appears, and the metrics panel will show the percentage change in carbon stock and mining loss between the two years.',
        position: 'right',
    },
    {
        target: 'tour-right-panel',
        title: 'Carbon Metrics',
        body: 'This panel shows the total Forest Carbon Stock and Mining-Driven Loss figures for your selected area and year. The trend chart tracks annual changes from 2019 onwards. The donut chart shows the proportion of stock lost to mining.',
        position: 'left',
    },
    {
        target: 'tour-reset',
        title: 'Reset to Default',
        body: 'Clears all active filters, resets the year to the latest available, and flies the map back to the full Ghana view. Use this any time you want to start a fresh analysis.',
        position: 'bottom',
    },
];

function getRect(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    return el.getBoundingClientRect();
}

const PAD = 10; // padding around spotlight

export function TourGuide({ autoStart = false }) {
    const [active, setActive] = useState(false);
    const [step, setStep] = useState(0);
    const [rect, setRect] = useState(null);

    // Check localStorage on mount — auto-start if first visit
    useEffect(() => {
        if (typeof window === 'undefined') return;
        // Only run on desktop
        if (window.innerWidth < 768) return;
        const seen = localStorage.getItem(TOUR_KEY);
        if (!seen) {
            // Small delay so the DOM is fully painted
            setTimeout(() => setActive(true), 800);
        }
    }, []);

    // External trigger (from "?" button)
    useEffect(() => {
        if (autoStart) {
            setStep(0);
            setActive(true);
        }
    }, [autoStart]);

    // Update spotlight rect whenever step changes
    useEffect(() => {
        if (!active) return;
        const update = () => {
            const r = getRect(STEPS[step].target);
            setRect(r);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [active, step]);

    const finish = useCallback(() => {
        setActive(false);
        localStorage.setItem(TOUR_KEY, 'true');
    }, []);

    const next = useCallback(() => {
        if (step < STEPS.length - 1) setStep(s => s + 1);
        else finish();
    }, [step, finish]);

    const prev = useCallback(() => {
        if (step > 0) setStep(s => s - 1);
    }, [step]);

    if (!active || !rect) return null;

    const current = STEPS[step];
    const spotlight = {
        top:    rect.top    - PAD,
        left:   rect.left   - PAD,
        width:  rect.width  + PAD * 2,
        height: rect.height + PAD * 2,
    };

    // Tooltip positioning
    let tooltip = {};
    const CARD_W = 320;
    const CARD_OFFSET = 16;

    if (current.position === 'right') {
        tooltip = {
            top:  Math.max(8, spotlight.top),
            left: spotlight.left + spotlight.width + CARD_OFFSET,
        };
    } else if (current.position === 'left') {
        tooltip = {
            top:  Math.max(8, spotlight.top),
            left: spotlight.left - CARD_W - CARD_OFFSET,
        };
    } else if (current.position === 'bottom') {
        tooltip = {
            top:  spotlight.top + spotlight.height + CARD_OFFSET,
            left: Math.max(8, spotlight.left + spotlight.width / 2 - CARD_W / 2),
        };
    }

    // Clamp tooltip inside viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (tooltip.left + CARD_W > vw - 8) tooltip.left = vw - CARD_W - 8;
    if (tooltip.left < 8) tooltip.left = 8;
    if (tooltip.top < 8) tooltip.top = 8;

    return (
        <>
            {/* Full-screen dark overlay with spotlight hole via box-shadow */}
            <div
                className="fixed inset-0 z-[9000] pointer-events-none"
                style={{ background: 'transparent' }}
            >
                {/* The spotlight element */}
                <div
                    className="absolute rounded-lg pointer-events-none"
                    style={{
                        top:    spotlight.top,
                        left:   spotlight.left,
                        width:  spotlight.width,
                        height: spotlight.height,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.72)',
                        transition: 'top 0.35s cubic-bezier(0.4,0,0.2,1), left 0.35s cubic-bezier(0.4,0,0.2,1), width 0.35s cubic-bezier(0.4,0,0.2,1), height 0.35s cubic-bezier(0.4,0,0.2,1)',
                        zIndex: 9001,
                    }}
                />
            </div>

            {/* Clickable overlay to close (outside spotlight) */}
            <div
                className="fixed inset-0 z-[9000]"
                onClick={finish}
            />

            {/* Tooltip card */}
            <div
                className="fixed z-[9100] pointer-events-auto"
                style={{
                    top:      tooltip.top,
                    left:     tooltip.left,
                    width:    CARD_W,
                    transition: 'top 0.35s cubic-bezier(0.4,0,0.2,1), left 0.35s cubic-bezier(0.4,0,0.2,1)',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-brand-deep border border-brand-gold/30 rounded-xl shadow-2xl overflow-hidden">
                    {/* Card header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-brand-gold/10">
                        <div className="flex items-center gap-2.5">
                            {/* Step dots */}
                            <div className="flex gap-1">
                                {STEPS.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`rounded-full transition-all duration-300 ${i === step
                                            ? 'w-4 h-1.5 bg-brand-gold'
                                            : i < step
                                                ? 'w-1.5 h-1.5 bg-brand-gold/40'
                                                : 'w-1.5 h-1.5 bg-white/10'
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="text-[9px] font-semibold text-white/25">
                                {step + 1} of {STEPS.length}
                            </span>
                        </div>
                        <button
                            onClick={finish}
                            className="p-1 rounded hover:bg-white/8 text-white/25 hover:text-white/50 transition-colors"
                        >
                            <X size={13} />
                        </button>
                    </div>

                    {/* Card body */}
                    <div className="px-4 py-4">
                        <h3 className="text-white font-bold text-sm mb-2 leading-snug">
                            {current.title}
                        </h3>
                        <p className="text-white/50 text-[11px] leading-relaxed font-medium">
                            {current.body}
                        </p>
                    </div>

                    {/* Card footer */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                        <button
                            onClick={finish}
                            className="text-[9px] font-semibold text-white/20 hover:text-white/40 transition-colors"
                        >
                            Skip tour
                        </button>
                        <div className="flex items-center gap-2">
                            {step > 0 && (
                                <button
                                    onClick={prev}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded border border-white/10 hover:border-white/20 text-white/40 hover:text-white/60 text-[10px] font-semibold transition-all"
                                >
                                    <ChevronLeft size={12} />
                                    Back
                                </button>
                            )}
                            <button
                                onClick={next}
                                className="flex items-center gap-1 px-4 py-1.5 rounded bg-brand-gold hover:bg-brand-gold/90 text-brand-deep text-[10px] font-black transition-all"
                            >
                                {step === STEPS.length - 1 ? 'Done' : 'Next'}
                                {step < STEPS.length - 1 && <ChevronRight size={12} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
