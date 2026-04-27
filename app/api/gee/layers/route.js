import { NextResponse } from 'next/server';
import { initializeEE, getEE, getConfig } from '@/lib/gee-server';

export async function POST(request) {
    try {
        await initializeEE();
        const ee = getEE();
        const config = getConfig();

        let payload;
        try {
            payload = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
        }

        const { year, region, district } = payload;

        if (!year) {
            return NextResponse.json({ error: 'Year is required' }, { status: 400 });
        }

        const carbonImg = ee.ImageCollection(config.CARBON_VIS)
            .filter(ee.Filter.eq('YEAR', year))
            .mosaic();

        const miningImg = ee.ImageCollection(config.MINING_VIS)
            .filter(ee.Filter.eq('YEAR', year))
            .mosaic();

        // National view — no region selected, skip boundaries and hover GeoJSON
        if (!region) {
            const pilotArea = ee.FeatureCollection(config.PILOT_AREA);
            const [carbonMapId, miningMapId, nationalBounds] = await Promise.all([
                new Promise((res, rej) => carbonImg.getMapId({ min: 1, max: 8, palette: ['black', 'green'] }, (id, err) => err ? rej(err) : res(id))),
                new Promise((res, rej) => miningImg.getMapId({ min: 0, max: 7, palette: ['black', 'red'] }, (id, err) => err ? rej(err) : res(id))),
                new Promise((res, rej) => pilotArea.geometry().bounds().getInfo((geo, err) => {
                    if (err) return rej(err);
                    if (!geo || !geo.coordinates) return res(null);
                    const coords = geo.coordinates[0];
                    const lats = coords.map(c => c[1]);
                    const lngs = coords.map(c => c[0]);
                    res([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]]);
                })),
            ]);
            return NextResponse.json({
                layers: { carbon: carbonMapId.urlFormat, mining: miningMapId.urlFormat, region: null, district: null },
                bounds: nationalBounds,
                hoverGeoJSON: null,
            });
        }

        // Regional / district view
        let areaOfInterest = ee.FeatureCollection(config.PILOT_AREA);
        let boundsGeometry = areaOfInterest.geometry();

        if (district) {
            const dFeature = ee.FeatureCollection(config.MINING_FC)
                .filter(ee.Filter.eq('DISTRICTS', district));
            areaOfInterest = dFeature;
            boundsGeometry = dFeature.geometry();
        } else {
            const rFeature = ee.FeatureCollection(config.CARBON_FC)
                .filter(ee.Filter.eq('REGIONS', region));
            areaOfInterest = rFeature;
            boundsGeometry = rFeature.geometry();
        }

        const regionFC = ee.FeatureCollection(config.CARBON_FC)
            .filter(ee.Filter.eq('REGIONS', region));
        const regionBoundaryImg = ee.Image().paint(regionFC, 0, 1.5);

        let districtFC = district
            ? ee.FeatureCollection(config.MINING_FC).filter(ee.Filter.eq('DISTRICTS', district))
            : ee.FeatureCollection([]);
        const districtBoundaryImg = ee.Image().paint(districtFC, 0, 2);

        // District GeoJSON for hover tooltips — simplified to 500m to keep response small
        const hoverFC = ee.FeatureCollection(config.MINING_FC).filter(ee.Filter.eq('REGIONS', region));
        const simplifiedHoverFC = hoverFC.map(f => f.simplify(500));

        const [carbonMapId, miningMapId, regionMapId, districtMapId, bounds, hoverGeoJSON] = await Promise.all([
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
                res([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]]);
            })),
            new Promise((res, rej) => simplifiedHoverFC.getInfo((data, err) => err ? rej(err) : res(data))),
        ]);

        return NextResponse.json({
            layers: {
                carbon: carbonMapId.urlFormat,
                mining: miningMapId.urlFormat,
                region: regionMapId.urlFormat,
                district: districtMapId.urlFormat,
            },
            bounds,
            hoverGeoJSON,
        });

    } catch (error) {
        console.error('GEE Layers Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate map layers', details: error.message },
            { status: 500 }
        );
    }
}
