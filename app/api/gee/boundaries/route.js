import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { initializeEE, getEE, getConfig } from '@/lib/gee-server';

export const revalidate = 21600;

const getCachedBoundaries = unstable_cache(
    async () => {
        await initializeEE();
        const ee = getEE();
        const config = getConfig();

        if (!config.FULL_DISTRICTS_FC || !config.FULL_REGIONS_FC) {
            throw new Error('Boundary assets not configured');
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

        return { districts, regions };
    },
    ['gee-boundaries'],
    { revalidate: 21600 }
);

export async function GET() {
    try {
        const data = await getCachedBoundaries();
        return NextResponse.json(data);

    } catch (error) {
        console.error('GEE Boundaries Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch boundaries', details: error.message },
            { status: 500 }
        );
    }
}
