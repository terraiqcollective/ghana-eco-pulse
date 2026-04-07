import { NextResponse } from 'next/server';
import { initializeEE, getEE, getConfig } from '@/lib/gee-server';

function evaluatePromise(eeObj) {
    return new Promise((resolve, reject) => {
        eeObj.evaluate((val, err) => {
            if (err) return reject(new Error(err));
            resolve(val ?? 0);
        });
    });
}

export async function POST(request) {
    try {
        await initializeEE();
        const ee = getEE();
        const config = getConfig();

        const { year, region, district, years } = await request.json();
        const requestedYear = parseInt(year, 10);

        if (!requestedYear) {
            return NextResponse.json({ error: 'Year is required' }, { status: 400 });
        }

        const metadataYears = await new Promise((resolve, reject) => {
            ee.FeatureCollection(config.CARBON_FC)
                .first()
                .propertyNames()
                .evaluate((props, err) => {
                    if (err) return reject(new Error(err));
                    const availableYears = (props || [])
                        .filter(p => /^(20)\d{2}$/.test(p))
                        .map(p => parseInt(p, 10))
                        .sort((a, b) => a - b);
                    resolve(availableYears);
                });
        });

        if (!metadataYears.includes(requestedYear)) {
            return NextResponse.json({ error: 'Invalid year requested' }, { status: 400 });
        }

        const validTrendYears = Array.isArray(years)
            ? years
                .map(y => parseInt(y, 10))
                .filter(y => metadataYears.includes(y))
            : metadataYears;

        const trendYears = validTrendYears.slice(0, metadataYears.length);

        function buildFilter(y) {
            let filter = ee.Filter.notNull([String(y)]);
            if (region) filter = ee.Filter.and(filter, ee.Filter.eq('REGIONS', region));
            if (district) filter = ee.Filter.and(filter, ee.Filter.eq('DISTRICTS', district));
            return filter;
        }

        const carbonFc = ee.FeatureCollection(config.CARBON_FC).filter(buildFilter(requestedYear));
        const miningFc = ee.FeatureCollection(config.MINING_FC).filter(buildFilter(requestedYear));

        const [carbonStock, carbonLoss, trendData] = await Promise.all([
            evaluatePromise(carbonFc.aggregate_sum(String(requestedYear))),
            evaluatePromise(miningFc.aggregate_sum(String(requestedYear))),
            Promise.all(trendYears.map(async (y) => {
                const filter = buildFilter(y);
                const [stock, loss] = await Promise.all([
                    evaluatePromise(
                        ee.FeatureCollection(config.CARBON_FC).filter(filter).aggregate_sum(String(y))
                    ),
                    evaluatePromise(
                        ee.FeatureCollection(config.MINING_FC).filter(filter).aggregate_sum(String(y))
                    ),
                ]);
                return { year: y, stock, loss };
            }))
        ]);

        const prevYear = requestedYear - 1;
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
