// Tutorial: Regression with Satellite Embedding - 
// Estimating Above-Ground Biomass (AGB)Mapping Mangroves
// ****************************************************

// Use the satellite basemap
Map.setOptions('SATELLITE');

// Select a region
// ****************************************************
var geometry = ee.FeatureCollection('projects/ee-cersgisrsteams/assets/Gala_ancilliary_data/gala_districts')

// Draw a polygon to define the region
// Save it as the variable 'geometry'
Map.centerObject(geometry);

// Wait for the export to complete and continue with
// the exported mosaic from here onwards.
// Use the exported asset
var Fyear = 2024 || '2024'
var stackedResampled = ee.ImageCollection('projects/carbon-monitoring-471820/assets/gedi_mosaic_v2')
    .filter(ee.Filter.eq('YEAR', Fyear))
    .mosaic();
// Extract Training Features
// ****************************************************
var gridScale = 30
var predictors = stackedResampled/*embeddingsImage*/.bandNames().filter(ee.Filter.stringStartsWith('item', 'A'));
var predicted = 'agbd';
// print('predictors', predictors);
// print('predicted', predicted);

var predictorImage = stackedResampled.select(predictors);
var predictedImage = stackedResampled.select([predicted]);

// Our GEDI image is mostly masked and contain values
// at only a small subset of pixels
// If we used sample() it will return mostly empty values
// To overcome this, we create a class-band from the GEDI
// mask and use stratifiedSampling() to ensure we sample from
// the non-masked areas.

var classMask = predictedImage.mask().toInt().rename('class');

var numSamples = 1000;

// We set classPoints to [0, numSamples]
// This will give us 0 points for class 0 (masked areas)
// and numSample points for class 1 (non-masked areas)
var training = stackedResampled.addBands(classMask)
    .stratifiedSample({
        numPoints: numSamples,
        classBand: 'class',
        region: geometry,
        scale: gridScale,
        classValues: [0, 1],
        classPoints: [0, numSamples],
        dropNulls: true,
        // tileScale: 4,
    });

// print('Number of Features Extracted', training.size());
// print('Sample Training Feature', training.first());

// --- Outlier Removal Step ---

// Calculate descriptive statistics for the biomass band.
var stats = training.reduceColumns({
    reducer: ee.Reducer.mean().combine({
        reducer2: ee.Reducer.stdDev(),
        sharedInputs: true
    }),
    selectors: ['agbd'] // Replace 'biomass' with the name of your biomass band.
});

// Get the mean and standard deviation from the statistics.
var mean = ee.Number(stats.get('mean'));
var stdDev = ee.Number(stats.get('stdDev'));
print('mean', mean)
print('std', stdDev)
// Define outlier thresholds (e.g., +/- 2 standard deviations).
// Adjust the multiplier (2 in this case) as needed for your data.
var minThreshold = mean.subtract(stdDev.multiply(2));
var maxThreshold = mean.add(stdDev.multiply(2));

// Filter the training data to remove outliers.
training = training.filter(ee.Filter.and(
    ee.Filter.gt('agbd', minThreshold),
    ee.Filter.lt('agbd', maxThreshold)
));

print('Filtered outlier', training.size());

// Train a Regression Model
// ****************************************************

// Use the RandomForest classifier and set the 
// output mode to REGRESSION
var model = ee.Classifier.smileRandomForest({
    numberOfTrees: 90,
    variablesPerSplit: 28,      // Number of variables to consider at each split
    minLeafPopulation: 3,      // Minimum samples in a leaf node
    bagFraction: 0.6,          // Fraction of data for each tree
    maxNodes: null,            // No limit on max number of leaf nodes
    // seed: 0                    // A seed for reproducibility
})
    .setOutputMode('REGRESSION')
    .train({
        features: training,
        classProperty: predicted,
        inputProperties: predictors
    });

// Get model's predictions for training samples
var predicted = training.classify({
    classifier: model,
    outputName: 'agbd_predicted'
});

// Calculate RMSE
var calculateRmse = function (input) {
    var observed = ee.Array(
        input.aggregate_array('agbd'));
    var predicted = ee.Array(
        input.aggregate_array('agbd_predicted'));
    var rmse = observed.subtract(predicted).pow(2)
        .reduce('mean', [0]).sqrt().get([0]);
    return rmse;
};
var rmse = calculateRmse(predicted);
print('RMSE', rmse);

var rrmse_mean = training.reduceColumns({
    reducer: ee.Reducer.mean(),
    selectors: ['agbd']
}).get('mean')

print('Relative rmse', rmse.divide(rrmse_mean))


// Create a plot of observed vs. predicted values
var chart = ui.Chart.feature.byFeature({
    features: predicted.select(['agbd', 'agbd_predicted']),
    xProperty: 'agbd',
    yProperties: ['agbd_predicted'],
}).setChartType('ScatterChart')
    .setOptions({
        title: 'Aboveground Biomass Density (Mg/Ha)',
        dataOpacity: 0.8,
        hAxis: { 'title': 'Observed' },
        vAxis: { 'title': 'Predicted' },
        legend: { position: 'right' },
        series: {
            0: {
                visibleInLegend: false,
                color: '#525252',
                pointSize: 3,
                pointShape: 'triangle',
            },
        },
        trendlines: {
            0: {
                type: 'linear',
                color: 'black',
                lineWidth: 1,
                pointSize: 0,
                labelInLegend: 'Linear Fit',
                visibleInLegend: true,
                showR2: true
            }
        },
        // chartArea: {left: 100, bottom:100},

    });
print(chart);

// Generate Predictions for Unknown Values
// ****************************************************

// Once the model is trained, we can use .classify()
// to run the model against all pixels of the image

// We set the band name of the output image as 'agbd'
var predictedImage = stackedResampled.classify({
    classifier: model,
    outputName: 'agbd'
});


// Export the image with predicted values
// ****************************************************

// Replace this with your asset folder
// The folder must exist before exporting

function clipped(name, letter) {
    var exportFolder = 'projects/carbon-monitoring-471820/assets/predicted_agb_v2/';
    var predictedExportImage = 'predicted' + letter;
    var predictedExportImagePath = exportFolder + predictedExportImage + Fyear;

    var named = geometry.filter(ee.Filter.eq('REGION', name))
    var cutted = predictedImage.clip(named)
    Export.image.toAsset({
        image: cutted.set('YEAR', Fyear),
        description: predictedExportImage + Fyear,
        assetId: predictedExportImagePath,
        region: named,
        scale: gridScale,
        maxPixels: 1e10
    });
    Map.addLayer(cutted)
}

clipped('ASHANTI', 'a')
clipped('CENTRAL', 'b')
clipped('EASTERN', 'c')
clipped('BRONG AHAFO', 'd')
clipped('WESTERN', 'e')