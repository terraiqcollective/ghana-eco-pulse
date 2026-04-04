import ee from '@google/earthengine';
import { GoogleAuth } from 'google-auth-library';

let isInitialized = false;
let initializationPromise = null;

export async function initializeEE() {
    if (isInitialized) return;

    // Deduplicate concurrent initialization calls
    if (initializationPromise) {
        return initializationPromise;
    }

    const privateKey = process.env.PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.SERVICE_EMAIL;
    const projectId = process.env.PROJECT_ID;

    if (!privateKey || !clientEmail || !projectId) {
        throw new Error('Missing GEE credentials in environment variables');
    }

    initializationPromise = new Promise((resolve, reject) => {
        ee.data.authenticateViaPrivateKey(
            {
                client_email: clientEmail,
                private_key: privateKey,
            },
            () => {
                ee.initialize(
                    null,
                    null,
                    () => {
                        isInitialized = true;
                        initializationPromise = null;
                        console.log('Server-side EE initialized successfully');
                        resolve();
                    },
                    (err) => {
                        isInitialized = false;
                        initializationPromise = null;
                        console.error('EE initialization failed:', err);
                        reject(new Error(err));
                    },
                    null,
                    projectId
                );
            },
            (err) => {
                isInitialized = false;
                initializationPromise = null;
                console.error('EE authentication failed:', err);
                reject(new Error(err));
            }
        );
    });

    return initializationPromise;
}

export function getEE() {
    if (!isInitialized) {
        throw new Error('Earth Engine not initialized. Call initializeEE() first.');
    }
    return ee;
}

export function getConfig() {
    return {
        CARBON_FC: process.env.CARBON_FC,
        MINING_FC: process.env.MINING_FC,
        PILOT_AREA: process.env.PILOT_AREA,
        CARBON_VIS: process.env.CARBON_VIS,
        MINING_VIS: process.env.MINING_VIS,
        FULL_DISTRICTS_FC: process.env.FULL_DISTRICTS_FC,
        FULL_REGIONS_FC: process.env.FULL_REGIONS_FC,
    };
}
