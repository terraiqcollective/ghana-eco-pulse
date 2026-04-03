import { NextResponse } from 'next/server';
import { initializeEE, getEE, getConfig } from '@/lib/gee-server';

export async function GET() {
    try {
        await initializeEE();
        const ee = getEE();
        const config = getConfig();

        const carbonFc = ee.FeatureCollection(config.CARBON_FC);
        const miningFc = ee.FeatureCollection(config.MINING_FC);

        // Get metadata
        const [yearProps, regions] = await Promise.all([
            new Promise((res, rej) => {
                carbonFc.first().propertyNames().evaluate((props, err) => {
                    if (err) return rej(err);
                    const years = props.filter(p => /^(20)\d{2}$/.test(p)).sort();
                    res(years);
                });
            }),
            new Promise((res, rej) => {
                carbonFc.aggregate_array('REGIONS').distinct().sort().evaluate((data, err) => {
                    err ? rej(err) : res(data || []);
                });
            })
        ]);

        return NextResponse.json({
            years: yearProps,
            regions
        });

    } catch (error) {
        console.error('GEE Metadata Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch metadata', details: error.message },
            { status: 500 }
        );
    }
}
