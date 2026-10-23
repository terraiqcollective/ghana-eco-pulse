// Tutorial: Regression with Satellite Embedding - 
// Estimating Above-Ground Biomass (AGB)Mapping Mangroves
// ****************************************************

// Use the satellite basemap
Map.setOptions('SATELLITE');

// Select a region
// ****************************************************
var Sarea = ee.FeatureCollection('projects/ee-cersgisrsteams/assets/Gala_ancilliary_data/gala_districts')

var regs = Sarea.aggregate_array('REGION').distinct()

var year = 2024 || '2024'
// Map.centerObject(geometry);
function gedi_mosaic(region, letter) {
    // Select a time-period
    // ****************************************************
    var geometry = Sarea.filter(ee.Filter.eq('REGION', region))
    var startDate = ee.Date.fromYMD(year, 1, 1);
    var endDate = startDate.advance(1, 'year');

    // Prepare the Satellite Embedding dataset
    // ****************************************************

    var embeddings = ee.ImageCollection('GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL');

    var embeddingsFiltered = embeddings
        .filter(ee.Filter.date(startDate, endDate))
        .filter(ee.Filter.bounds(geometry));

    // Extract the projection of the first band of the first image
    var embeddingsProjection = ee.Image(embeddingsFiltered.first()).select(0).projection();

    // Set the projection of the mosaic to the extracted projection
    var embeddingsImage = embeddingsFiltered.mosaic()
        .setDefaultProjection(embeddingsProjection);


    // Prepare the GEDI L4A Mosaic
    // ****************************************************

    // GEDI L4A Raster Aboveground Biomass Density
    // These are point observations that will be used as ground-truth
    // and the predicted variable in the regression model
    var gedi = ee.ImageCollection('LARSE/GEDI/GEDI04_A_002_MONTHLY');
    // Function to select the highest quality GEDI data
    var qualityMask = function (image) {
        return image.updateMask(image.select('l4_quality_flag').eq(1))
            .updateMask(image.select('degrade_flag').eq(0));
    };

    // Function to mask unreliable GEDI measurements
    // with a relative standard error > 50% 
    // agbd_se / agbd > 0.5
    var errorMask = function (image) {
        var relative_se = image.select('agbd_se')
            .divide(image.select('agbd'));
        return image.updateMask(relative_se.lte(0.5));
    };

    // Function to mask GEDI measurements on slopes > 30%

    var slopeMask = function (image) {
        // Use Copernicus GLO-30 DEM for calculating slope
        var glo30 = ee.ImageCollection('COPERNICUS/DEM/GLO30');

        var glo30Filtered = glo30
            .filter(ee.Filter.bounds(geometry))
            .select('DEM');

        // Extract the projection
        var demProj = glo30Filtered.first().select(0).projection();

        // The dataset consists of individual images
        // Create a mosaic and set the projection
        var elevation = glo30Filtered.mosaic().rename('dem')
            .setDefaultProjection(demProj);

        // Compute the slope
        var slope = ee.Terrain.slope(elevation);

        return image.updateMask(slope.lt(30));
    };

    var gediFiltered = gedi
        .filter(ee.Filter.date(startDate, endDate))
        .filter(ee.Filter.bounds(geometry));

    var gediProjection = ee.Image(gediFiltered.first())
        .select('agbd').projection();

    var gediProcessed = gediFiltered
        .map(qualityMask)
        .map(errorMask)
        .map(slopeMask);

    var gediMosaic = gediProcessed.mosaic()
        .select('agbd').setDefaultProjection(gediProjection);


    // Visualize the GEDI Mosaic
    var gediVis = {
        min: 0,
        max: 200,
        palette: ['#edf8fb', '#b2e2e2', '#66c2a4', '#2ca25f', '#006d2c'],
        bands: ['agbd']
    };

    // Map.addLayer(gediMosaic, gediVis, 'GEDI L4A (Filtered)', false);

    // Prepare mask Image which will be used to take out non vegetative
    // areas from gedi and embeddings
    var gala = ee.ImageCollection('projects/ee-cersgisrsteams/assets/MINING_FOOTPRINT/Footprint_Collection')
        .filter(ee.Filter.eq('Year', year))
        .mosaic()
        .clip(geometry)

    var cover = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1')
        .filter(ee.Filter.bounds(geometry))
        .filterDate(startDate, endDate)
        .map(function (i) { return i.select('label') }).mosaic()
        .clip(geometry)
        .remap([0, 1, 2, 3, 4, 5, 6, 7, 8], [1, 0, 1, 0, 0, 0, 1, 1, 1])
        .selfMask()

    var masks = cover.blend(gala)
    // var distanceImage = masks.unmask().distance(ee.Kernel.euclidean(50, 'meters'))//.unmask(1).selfMask().clip(geometry).rename('mask')
    var distanceImage = masks.unmask().distance(ee.Kernel.euclidean(35, 'meters'))//.gt(0)//.unmask(1).selfMask()//.not().selfMask();

    distanceImage = distanceImage.where(distanceImage.eq(0), 0)
        .where(distanceImage.gt(0), 0)
        .unmask(1)
        .selfMask()
        .clip(geometry)

    // Resample and Aggregate Inputs
    // ****************************************************

    // GEDI measurements have horizontal accuracy of +/- 9 m
    // This is problematic when matching the GEDI AGB values
    // to satellite embedding pixels.
    // To overcome this, we resample and aggregate all input
    // images to a larger pixel-grid.

    // Choose the grid size and projection
    var gridScale = 30;
    var gridProjection = ee.Projection('EPSG:3857')
        .atScale(gridScale);

    // Create a stacked image with predictor and predicted variables
    var stacked = embeddingsImage.mask(distanceImage).addBands(gediMosaic.mask(distanceImage).selfMask());

    //  Set the resampling mode
    var stacked = stacked.resample('bilinear');

    // Aggregate pixels with 'mean' statistics
    var stackedResampled = stacked
        .reduceResolution({
            reducer: ee.Reducer.mean(),
            // maxPixels: 1024
        })
        .reproject({
            crs: gridProjection
        });

    // As larger GEDI pixels contain masked original
    // pixels, it has a transparency mask.
    // We update the mask to remove the transparency

    // var mask = stackedResampled.select('mask')
    // stackedResampled = stackedResampled.updateMask(mask)
    var stackedResampled = stackedResampled
        .updateMask(stackedResampled.mask().gt(0))
        .set({ 'YEAR': year });
    // print(stackedResampled)
    // Map.addLayer(stackedResampled.clip(geometry).select('A.*'))
    // Replace this with your asset folder
    // The folder must exist before exporting
    var exportFolder = 'projects/carbon-monitoring-471820/assets/gedi_mosaic_v2/';
    var mosaicExportImage = 'gedi_mosaic' + letter + year;
    var mosaicExportImagePath = exportFolder + mosaicExportImage;

    Export.image.toAsset({
        image: stackedResampled.clip(geometry),
        description: 'GEDI_Mosaic' + year + region,
        assetId: mosaicExportImagePath,
        region: geometry,
        scale: gridScale,
        maxPixels: 1e13
    });
}

gedi_mosaic('ASHANTI', 'a')
gedi_mosaic('CENTRAL', 'b')
gedi_mosaic('EASTERN', 'c')
gedi_mosaic('BRONG AHAFO', 'd')
gedi_mosaic('WESTERN', 'e')