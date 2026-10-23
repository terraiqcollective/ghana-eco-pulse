// Tutorial: Regression with Satellite Embedding - 
// Estimating Above-Ground Biomass (AGB)Mapping Mangroves
// ****************************************************

// Use the satellite basemap
Map.setOptions('SATELLITE');

// Select a region
// ****************************************************

// Draw a polygon to define the region
// Save it as the variable 'geometry'
// Map.centerObject(geometry);
var geometry = ee.FeatureCollection('projects/ee-cersgisrsteams/assets/Gala_ancilliary_data/gala_districts')
    .select(['DISTRICT', 'Region_19'], ['DISTRICTS', 'REGIONS'])

// Wait for the export to complete.
// Visualize the exported image.
var Fyear = 2024 || '2024'
var label = Fyear + 1
var predictedImage = ee.ImageCollection('projects/carbon-monitoring-471820/assets/predicted_agb_v2')
    .filter(ee.Filter.eq('YEAR', Fyear)).mosaic();
// Visualize the image
var gediVis = {
    min: 0,
    max: 200,
    palette: ['#edf8fb', '#b2e2e2', '#66c2a4', '#2ca25f', '#006d2c'],
    bands: ['agbd']
};

Map.addLayer(predictedImage, gediVis, 'Predicted AGBD');


// // Calculate Total AGB
// // ****************************************************

// // The units of GEDI AGBD values is Megagrams/Hectares
// // To get the Total AGB, we multiply each pixel with its
// // area in Hectares
var pixelAreaHa = ee.Image.pixelArea().divide(10000);
var predictedAgb = predictedImage.multiply(pixelAreaHa)
var carbon = predictedAgb.multiply(0.5).set({ YEAR: label });
// Map.addLayer(Tcarbon, {min: 0, max: 30})
// print('check', Tcarbon)

var mining = ee.ImageCollection('projects/ee-cersgisrsteams/assets/MINING_FOOTPRINT/Footprint_Collection')
    .filter(ee.Filter.eq('Year', label))
    .mosaic()
    .lt(3)
    .selfMask()
    .distance(ee.Kernel.euclidean(35, 'meters'))
    .remap([0], [1])
// .set({YEAR: label})


var miningCarbon = carbon.updateMask(mining).set({ YEAR: label })
Map.addLayer(miningCarbon)

var carbon_FC = carbon.reduceRegions({
    collection: geometry,
    reducer: ee.Reducer.sum(),
    scale: 30
}).map(function (feat) { return feat.select(['DISTRICTS', 'sum'], ['DISTRICTS', label.toString()]) });

var miningCarbon_FC = miningCarbon.reduceRegions({
    collection: geometry,
    reducer: ee.Reducer.sum(),
    scale: 30
}).map(function (feat) { return feat.select(['DISTRICTS', 'sum'], ['DISTRICTS', label.toString()]) });

// MERGE RESULT OF FEATURE COLLECTION INTO EXISTING TABLE

C_FC = C_FC.map(function (place) {
    var name = place.get('DISTRICTS')
    var filtered = ee.Feature(carbon_FC.filter(ee.Filter.eq('DISTRICTS', name)).first())
    return place.set(label.toString(), filtered.get(label.toString()))
})

Min_FC = Min_FC.map(function (place) {
    var name = place.get('DISTRICTS')
    var filtered = ee.Feature(miningCarbon_FC.filter(ee.Filter.eq('DISTRICTS', name)).first())
    return place.set(label.toString(), filtered.get(label.toString()))
})

print('miningCarbon_FC', Min_FC)
print('carbon_FC', C_FC)
print('carbon', carbon)
print('miningCarbon', miningCarbon)

Export.table.toAsset({
    collection: C_FC,
    assetId: 'projects/carbon-monitoring-471820/assets/Carbon_FC_i',
    description: 'Carbon_FC' + label
})

Export.table.toAsset({
    collection: Min_FC,
    assetId: 'projects/carbon-monitoring-471820/assets/MiningCarbon_FC_i',
    description: 'MiningCarbon_FC' + label
})

function clipped(img, path, name, which) {
    var named = geometry.filter(ee.Filter.eq('REGIONS', name))
    var cutted = img.clip(named)
    Export.image.toAsset({
        image: cutted,
        description: name + label + which,
        assetId: path + name + label,
        region: named,
        scale: 30,
        maxPixels: 1e10
    });
    // Map.addLayer(cutted)
}

//CARBON EXPORTS
// clipped(carbon, 'projects/carbon-monitoring-471820/assets/District_Carbon/', 'ASHANTI', 'carbon')
// clipped(carbon, 'projects/carbon-monitoring-471820/assets/District_Carbon/','CENTRAL', 'carbon')
// clipped(carbon, 'projects/carbon-monitoring-471820/assets/District_Carbon/','EASTERN', 'carbon')
// clipped(carbon, 'projects/carbon-monitoring-471820/assets/District_Carbon/','AHAFO', 'carbon')
// clipped(carbon, 'projects/carbon-monitoring-471820/assets/District_Carbon/','WESTERN', 'carbon')
// clipped(carbon, 'projects/carbon-monitoring-471820/assets/District_Carbon/','BONO', 'carbon')
// clipped(carbon, 'projects/carbon-monitoring-471820/assets/District_Carbon/','WESTERN NORTH', 'carbon')

//MINING CARBON EXPORTS
// clipped(miningCarbon, 'projects/carbon-monitoring-471820/assets/Mining_Carbon/', 'ASHANTI', 'miningCarbon')
// clipped(miningCarbon, 'projects/carbon-monitoring-471820/assets/Mining_Carbon/', 'CENTRAL', 'miningCarbon')
// clipped(miningCarbon, 'projects/carbon-monitoring-471820/assets/Mining_Carbon/', 'EASTERN', 'miningCarbon')
// clipped(miningCarbon, 'projects/carbon-monitoring-471820/assets/Mining_Carbon/', 'AHAFO', 'miningCarbon')
// clipped(miningCarbon, 'projects/carbon-monitoring-471820/assets/Mining_Carbon/', 'WESTERN', 'miningCarbon')
// clipped(miningCarbon, 'projects/carbon-monitoring-471820/assets/Mining_Carbon/','BONO', 'miningCarbon')
// clipped(miningCarbon, 'projects/carbon-monitoring-471820/assets/Mining_Carbon/','WESTERN NORTH', 'miningCarbon')
