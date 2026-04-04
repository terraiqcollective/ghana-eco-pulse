import { NextResponse } from 'next/server';
import { initializeEE, getEE, getConfig } from '@/lib/gee-server';

export async function GET() {
    try {
        await initializeEE();
        const ee = getEE();
        const config = getConfig();

        if (!config.FULL_DISTRICTS_FC || !config.FULL_REGIONS_FC) {
            return NextResponse.json(
                { error: 'Boundary assets not configured' },
                { status: 500 }
            );
        }

        const [districts, regions] = await Promise.all([
            new Promise((resolve, reject) => {
                ee.FeatureCollection(config.FULL_DISTRICTS_FC)
                    .map(f => f.simplify({ maxError: 500 }))
                    .evaluate((data, err) => {
                        if (err) return reject(new Error(err));
                        resolve(data);
                    });
            }),
            new Promise((resolve, reject) => {
                ee.FeatureCollection(config.FULL_REGIONS_FC)
                    .map(f => f.simplify({ maxError: 500 }))
                    .evaluate((data, err) => {
                        if (err) return reject(new Error(err));
                        resolve(data);
                    });
            }),
        ]);

        return NextResponse.json({ districts, regions });

    } catch (error) {
        console.error('GEE Boundaries Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch boundaries', details: error.message },
            { status: 500 }
        );
    }
}
