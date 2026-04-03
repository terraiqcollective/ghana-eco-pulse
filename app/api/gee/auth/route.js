import { NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

export async function GET() {
    try {
        const privateKey = process.env.PRIVATE_KEY?.replace(/\\n/g, '\n');
        const clientEmail = process.env.SERVICE_EMAIL;
        const projectId = process.env.PROJECT_ID;

        if (!privateKey || !clientEmail) {
            return NextResponse.json(
                { error: 'Missing service account credentials' },
                { status: 500 }
            );
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

        return NextResponse.json({
            token: accessToken.token,
            project_id: projectId,
            config: {
                CARBON_FC: process.env.CARBON_FC,
                MINING_FC: process.env.MINING_FC,
                PILOT_AREA: process.env.PILOT_AREA,
                CARBON_VIS: process.env.CARBON_VIS,
                MINING_VIS: process.env.MINING_VIS,
            }
        });
    } catch (error) {
        console.error('GEE Auth Error:', error);
        return NextResponse.json(
            { error: 'Failed to authenticate with GEE' },
            { status: 500 }
        );
    }
}
