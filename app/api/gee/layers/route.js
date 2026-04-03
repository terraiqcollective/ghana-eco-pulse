import { NextResponse } from 'next/server';
import { initializeEE, getEE, getConfig } from '@/lib/gee-server';

export async function POST(request) {
    try {
        await initializeEE();
        const ee = getEE();
        const config = getConfig();

        const { year, region, district } = await request.json();

        if (!year) {
            return NextResponse.json({ error: 'Year is required' }, { status: 400 });
        }

        // Get Carbon and Mining Images
        const carbonImg = ee.ImageCollection(config.CARBON_VIS)
            .filter(ee.Filter.eq('YEAR', year))
            .mosaic();

        const miningImg = ee.ImageCollection(config.MINING_VIS)
            .filter(ee.Filter.eq('YEAR', year))
            .mosaic();

        // Determine boundary
        let areaOfInterest = ee.FeatureCollection(config.PILOT_AREA);
        let boundaryColor = 'white';
        let boundsGeometry = areaOfInterest.geometry();

        if (district) {
            const dFeature = ee.FeatureCollection(config.MINING_FC)
                .filter(ee.Filter.eq('DISTRICTS', district));
            areaOfInterest = dFeature;
            boundsGeometry = dFeature.geometry();
            boundaryColor = 'yellow';
        } else if (region) {
            const rFeature = ee.FeatureCollection(config.CARBON_FC)
                .filter(ee.Filter.eq('REGIONS', region));
            areaOfInterest = rFeature;
            boundsGeometry = rFeature.geometry();
            boundaryColor = 'white';
        }

        // Create boundary layers - filtered by selection
        let regionFC = ee.FeatureCollection(config.CARBON_FC);
        if (region) {
            regionFC = regionFC.filter(ee.Filter.eq('REGIONS', region));
        }
        const regionBoundaryImg = ee.Image().paint(regionFC, 0, 1.5);

        // Only show yellow boundary for the SPECIFIC focus district
        let districtFC = ee.FeatureCollection(config.MINING_FC);
        if (district) {
            districtFC = districtFC.filter(ee.Filter.eq('DISTRICTS', district));
        } else {
            // If no district selected, don't show any yellow boundaries
            districtFC = ee.FeatureCollection([]);
        }
        const districtBoundaryImg = ee.Image().paint(districtFC, 0, 2); // Slightly thicker for focus area

        // Get Map IDs
        const [carbonMapId, miningMapId, regionMapId, districtMapId, bounds] = await Promise.all([
            new Promise((res, rej) => carbonImg.getMapId({ min: 1, max: 8, palette: ['black', 'green'] }, (id, err) => err ? rej(err) : res(id))),
            new Promise((res, rej) => miningImg.getMapId({ min: 0, max: 7, palette: ['black', 'red'] }, (id, err) => err ? rej(err) : res(id))),
            new Promise((res, rej) => regionBoundaryImg.getMapId({ palette: 'white' }, (id, err) => err ? rej(err) : res(id))),
            new Promise((res, rej) => districtBoundaryImg.getMapId({ palette: 'yellow' }, (id, err) => err ? rej(err) : res(id))),
            new Promise((res, rej) => boundsGeometry.bounds().getInfo((geo, err) => {
                if (err) return rej(err);
                if (!geo || !geo.coordinates) return res(null);

                const coords = geo.coordinates[0];
                const lats = coords.map(c => c[1]);
                const lngs = coords.map(c => c[0]);
                res([
                    [Math.min(...lats), Math.min(...lngs)],
                    [Math.max(...lats), Math.max(...lngs)]
                ]);
            }))
        ]);

        return NextResponse.json({
            layers: {
                carbon: carbonMapId.urlFormat,
                mining: miningMapId.urlFormat,
                region: regionMapId.urlFormat,
                district: districtMapId.urlFormat,
            },
            bounds
        });

    } catch (error) {
        console.error('GEE Layers Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate map layers', details: error.message },
            { status: 500 }
        );
    }
}
