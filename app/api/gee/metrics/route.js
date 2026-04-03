import { NextResponse } from 'next/server';
import { initializeEE, getEE, getConfig } from '@/lib/gee-server';

export async function POST(request) {
    try {
        await initializeEE();
        const ee = getEE();
        const config = getConfig();

        const { year, region, district, years } = await request.json();

        if (!year) {
            return NextResponse.json({ error: 'Year is required' }, { status: 400 });
        }

        // Build filters
        let carbonFilter = ee.Filter.notNull([String(year)]);
        let miningFilter = ee.Filter.notNull([String(year)]);

        if (region) {
            carbonFilter = ee.Filter.and(carbonFilter, ee.Filter.eq('REGIONS', region));
            miningFilter = ee.Filter.and(miningFilter, ee.Filter.eq('REGIONS', region));
        }

        if (district) {
            carbonFilter = ee.Filter.and(carbonFilter, ee.Filter.eq('DISTRICTS', district));
            miningFilter = ee.Filter.and(miningFilter, ee.Filter.eq('DISTRICTS', district));
        }

        const carbonFc = ee.FeatureCollection(config.CARBON_FC).filter(carbonFilter);
        const miningFc = ee.FeatureCollection(config.MINING_FC).filter(miningFilter);

        // Calculate metrics
        const [carbonStock, carbonLoss, trendData] = await Promise.all([
            new Promise((res, rej) => {
                carbonFc.aggregate_sum(String(year)).evaluate((val, err) => {
                    err ? rej(err) : res(val || 0);
                });
            }),
            new Promise((res, rej) => {
                miningFc.aggregate_sum(String(year)).evaluate((val, err) => {
                    err ? rej(err) : res(val || 0);
                });
            }),
            // Trend data - aggregate for both CARBON_FC and MINING_FC by year
            Promise.all((years || []).map(y =>
                new Promise((res, rej) => {
                    let filter = ee.Filter.notNull([String(y)]);
                    if (region) filter = ee.Filter.and(filter, ee.Filter.eq('REGIONS', region));
                    if (district) filter = ee.Filter.and(filter, ee.Filter.eq('DISTRICTS', district));

                    const cFc = ee.FeatureCollection(config.CARBON_FC).filter(filter);
                    const mFc = ee.FeatureCollection(config.MINING_FC).filter(filter);

                    const stockPromise = new Promise(r => cFc.aggregate_sum(String(y)).evaluate(v => r(v || 0)));
                    const lossPromise = new Promise(r => mFc.aggregate_sum(String(y)).evaluate(v => r(v || 0)));

                    Promise.all([stockPromise, lossPromise]).then(([stock, loss]) => {
                        res({ year: y, stock, loss });
                    });
                })
            ))
        ]);

        // Extract previous year's data
        // Ensure comparison works regardless of string/number types
        const prevYear = parseInt(year) - 1;
        const prevData = trendData.find(t => parseInt(t.year) === prevYear) || { stock: carbonStock, loss: carbonLoss };

        return NextResponse.json({
            carbonStock,
            carbonLoss,
            prevCarbonStock: prevData.stock,
            prevCarbonLoss: prevData.loss,
            trend: trendData
        });

    } catch (error) {
        console.error('GEE Metrics Error:', error);
        return NextResponse.json(
            { error: 'Failed to calculate metrics', details: error.message },
            { status: 500 }
        );
    }
}
