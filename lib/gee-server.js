import ee from '@google/earthengine';
import { GoogleAuth } from 'google-auth-library';

let isInitialized = false;

export async function initializeEE() {
    if (isInitialized) return;

    const privateKey = process.env.PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.SERVICE_EMAIL;
    const projectId = process.env.PROJECT_ID;

    if (!privateKey || !clientEmail || !projectId) {
        throw new Error('Missing GEE credentials in environment variables');
    }

    const auth = new GoogleAuth({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey,
            project_id: projectId,
        },
        scopes: [
            'https://www.googleapis.com/auth/earthengine',
            'https://www.googleapis.com/auth/cloud-platform'
        ],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    return new Promise((resolve, reject) => {
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
                        console.log('Server-side EE initialized successfully');
                        resolve();
                    },
                    (err) => {
                        console.error('EE initialization failed:', err);
                        reject(err);
                    },
                    null,
                    projectId
                );
            },
            (err) => {
                console.error('EE authentication failed:', err);
                reject(err);
            }
        );
    });
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
    };
}
