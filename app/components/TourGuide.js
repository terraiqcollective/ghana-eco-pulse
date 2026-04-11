"use client";

import { useEffect, useState, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

const TOUR_KEY = 'ecopulse_tour_seen';

const STEPS = [
    {
        target: 'tour-map',
        title: 'The Forest Map',
        body: 'The map updates after you run an analysis. Carbon stock, mining loss, and the selected AOI boundary appear here for the place you chose.',
        position: 'right',
    },
    {
        target: 'tour-left-panel',
        title: 'Set Up Analysis',
        body: 'Choose whether you want a region or district analysis, pick the location, then press Run Analysis. This keeps the workflow deliberate and easy to follow.',
        position: 'right',
    },
    {
        target: 'tour-year-slider',
        title: 'Year Selection',
        body: 'Drag the slider to choose the reporting year before you run analysis. The metrics, comparison, and map layers will all use that year.',
        position: 'right',
    },
    {
        target: 'tour-map-layers',
        title: 'Map Layers',
        body: 'Toggle Carbon Stock and Mining Loss layers on or off independently. AOI boundaries stay tied to the selected analysis area to keep the map focused.',
        position: 'right',
    },
    {
        target: 'tour-year-comparison',
        title: 'Year Comparison',
        body: 'Turn this on only when you want a side-by-side year review. Pick a comparison year and the metrics panel will show the percentage change between the two years.',
        position: 'right',
    },
    {
        target: 'tour-right-panel',
        title: 'Carbon Metrics',
        body: 'This panel shows the total Forest Carbon Stock and Mining-Driven Loss for the selected area and year. It also includes the takeaway and loss trend.',
        position: 'left',
    },
    {
        target: 'tour-reset',
        title: 'Reset',
        body: 'Restore Default View clears the active analysis, resets the year to the latest available, and returns the map to the national view.',
        position: 'right',
    },
];

function getRect(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    return el.getBoundingClientRect();
}

const PAD = 10;

export function TourGuide({ autoStart = false }) {
    const [active, setActive] = useState(false);
    const [step, setStep] = useState(0);
    const [rect, setRect] = useState(null);

    useEffect(() => {
        if (!active) return;
        const update = () => {
            const nextRect = getRect(STEPS[step].target);
            setRect(nextRect);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [active, step]);

    const finish = useCallback(() => {
        setActive(false);
        localStorage.setItem(TOUR_KEY, 'true');
    }, []);

    const startTour = useCallback(() => {
        setStep(0);
        setActive(true);
    }, []);

    const next = useCallback(() => {
        if (step < STEPS.length - 1) setStep(s => s + 1);
        else finish();
    }, [step, finish]);

    const prev = useCallback(() => {
        if (step > 0) setStep(s => s - 1);
    }, [step]);

    useEffect(() => {
        if (autoStart > 0) {
            const timeoutId = setTimeout(() => startTour(), 0);
            return () => clearTimeout(timeoutId);
        }
    }, [autoStart, startTour]);

    if (!active || !rect) return null;

    const current = STEPS[step];
    const spotlight = {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
    };

    let tooltip = {};
    const CARD_W = 320;
    const CARD_OFFSET = 16;

    if (current.position === 'right') {
        tooltip = {
            top: Math.max(8, spotlight.top),
            left: spotlight.left + spotlight.width + CARD_OFFSET,
        };
    } else if (current.position === 'left') {
        tooltip = {
            top: Math.max(8, spotlight.top),
            left: spotlight.left - CARD_W - CARD_OFFSET,
        };
    } else if (current.position === 'bottom') {
        tooltip = {
            top: spotlight.top + spotlight.height + CARD_OFFSET,
            left: Math.max(8, spotlight.left + spotlight.width / 2 - CARD_W / 2),
        };
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const CARD_H = 220;
    if (tooltip.left + CARD_W > vw - 8) tooltip.left = vw - CARD_W - 8;
    if (tooltip.left < 8) tooltip.left = 8;
    if (tooltip.top < 8) tooltip.top = 8;
    if (tooltip.top + CARD_H > vh - 8) tooltip.top = vh - CARD_H - 8;

    return (
        <>
            <div className="fixed inset-0 z-[9000] pointer-events-none" style={{ background: 'transparent' }}>
                <div
                    className="absolute rounded-lg pointer-events-none"
                    style={{
                        top: spotlight.top,
                        left: spotlight.left,
                        width: spotlight.width,
                        height: spotlight.height,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.72)',
                        transition: 'top 0.35s cubic-bezier(0.4,0,0.2,1), left 0.35s cubic-bezier(0.4,0,0.2,1), width 0.35s cubic-bezier(0.4,0,0.2,1), height 0.35s cubic-bezier(0.4,0,0.2,1)',
                        zIndex: 9001,
                    }}
                />
            </div>

            <div className="fixed inset-0 z-[9000]" onClick={finish} />

            <div
                className="fixed z-[9100] pointer-events-auto"
                style={{
                    top: tooltip.top,
                    left: tooltip.left,
                    width: CARD_W,
                    transition: 'top 0.35s cubic-bezier(0.4,0,0.2,1), left 0.35s cubic-bezier(0.4,0,0.2,1)',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="overflow-hidden rounded-xl border border-brand-gold/30 bg-brand-deep shadow-2xl">
                    <div className="flex items-center justify-between border-b border-brand-gold/10 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                            <div className="flex gap-1">
                                {STEPS.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`rounded-full transition-all duration-300 ${i === step ? 'h-1.5 w-4 bg-brand-gold' : i < step ? 'h-1.5 w-1.5 bg-brand-gold/40' : 'h-1.5 w-1.5 bg-white/10'}`}
                                    />
                                ))}
                            </div>
                            <span className="text-[9px] font-semibold text-white/25">
                                {step + 1} of {STEPS.length}
                            </span>
                        </div>
                        <button
                            onClick={finish}
                            className="rounded p-1 text-white/25 transition-colors hover:bg-white/8 hover:text-white/50"
                        >
                            <X size={13} />
                        </button>
                    </div>

                    <div className="px-4 py-4">
                        <h3 className="mb-2 text-sm font-bold leading-snug text-white">
                            {current.title}
                        </h3>
                        <p className="text-[11px] font-medium leading-relaxed text-white/50">
                            {current.body}
                        </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
                        <button
                            onClick={finish}
                            className="text-[9px] font-semibold text-white/20 transition-colors hover:text-white/40"
                        >
                            Skip tour
                        </button>
                        <div className="flex items-center gap-2">
                            {step > 0 && (
                                <button
                                    onClick={prev}
                                    className="flex items-center gap-1 rounded border border-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/40 transition-all hover:border-white/20 hover:text-white/60"
                                >
                                    <ChevronLeft size={12} />
                                    Back
                                </button>
                            )}
                            <button
                                onClick={next}
                                className="flex items-center gap-1 rounded bg-brand-gold px-4 py-1.5 text-[10px] font-black text-brand-deep transition-all hover:bg-brand-gold/90"
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
