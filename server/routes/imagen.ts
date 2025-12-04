import express from 'express';
import { GoogleAuth } from 'google-auth-library';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Key file path - relative to CWD (root of project where server is started)
const KEY_FILE_PATH = 'server/keys/gen-lang-client-0683067307-b48d2e920ae0.json';
const KEY_FILE = path.resolve(process.cwd(), KEY_FILE_PATH);

console.log(`🔑 Imagen Route: Looking for key file at ${KEY_FILE}`);

if (!fs.existsSync(KEY_FILE)) {
    console.error(`❌ Key file NOT FOUND at ${KEY_FILE}`);
}

// Initialize Google Auth
const auth = new GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

router.post('/generate', async (req, res) => {
    try {
        console.log('🚀 Proxying request to Vertex AI...');

        const client = await auth.getClient();
        const projectId = await auth.getProjectId();
        const accessToken = await client.getAccessToken();

        if (!accessToken.token) {
            throw new Error('Failed to get access token');
        }

        console.log(`✅ Authenticated as Project: ${projectId}`);

        const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagegeneration:predict`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Vertex AI Error:', errorText);
            return res.status(response.status).send(errorText);
        }

        const data = await response.json();
        console.log('✨ Vertex AI Success');
        res.json(data);

    } catch (error) {
        console.error('❌ Proxy Error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

export default router;
