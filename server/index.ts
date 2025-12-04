import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Storage } from '@google-cloud/storage';
import { GoogleAuth } from 'google-auth-library';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 환경 변수 로드
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --------------------------------------------------------
// 1. Google Cloud Storage (얼굴 라이브러리용) 설정
// --------------------------------------------------------
const storageKeyPath = path.resolve(process.cwd(), process.env.GCS_KEY_FILE || '');
let storage;

if (fs.existsSync(storageKeyPath)) {
    storage = new Storage({
        keyFilename: storageKeyPath,
        projectId: process.env.GCS_PROJECT_ID,
    });
    console.log('📦 GCS Storage Initialized');
} else {
    console.warn(`⚠️ GCS Key file not found at: ${storageKeyPath}`);
}

// --------------------------------------------------------
// 2. Vertex AI (이미지 생성용) 설정 - REST API 사용
// --------------------------------------------------------
// .env에서 설정한 service-account-key.json 경로를 가져옵니다.
const vertexKeyPath = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS || 'server/keys/service-account-key.json');
let authClient: GoogleAuth | null = null;

if (fs.existsSync(vertexKeyPath)) {
    console.log(`🔑 Vertex AI Auth: Found key file at ${vertexKeyPath}`);

    authClient = new GoogleAuth({
        keyFile: vertexKeyPath,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    console.log('🚀 Vertex AI Auth Initialized');

} else {
    console.error(`❌ Vertex AI Error: Key file missing at ${vertexKeyPath}`);
    console.error('👉 server/keys/service-account-key.json 파일이 있는지 확인해주세요.');
}

// --------------------------------------------------------
// API 라우트
// --------------------------------------------------------

// 상태 확인
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// 이미지 생성 API (프론트엔드에서 호출)
app.post('/api/generate-image', async (req, res) => {
    if (!authClient) {
        return res.status(500).json({ error: 'Vertex AI is not configured (Key file missing)' });
    }

    try {
        const { prompt } = req.body;
        console.log(`🎨 Generating image for: "${prompt}"`);

        const client = await authClient.getClient();
        const projectId = await authClient.getProjectId();
        const accessToken = await client.getAccessToken();

        if (!accessToken.token) {
            throw new Error('Failed to get access token');
        }

        const location = process.env.GCP_LOCATION || 'us-central1';
        const modelId = 'imagegeneration@006'; // Imagen 2
        const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
                instances: [{ prompt: prompt }],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "1:1"
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Vertex AI API Error:', errorText);
            throw new Error(`Vertex AI API Error: ${errorText}`);
        }

        const data = await response.json();

        // 결과 이미지 (Base64) 추출
        if (data.predictions && data.predictions.length > 0) {
            const base64Image = data.predictions[0].bytesBase64Encoded;
            res.json({ image: `data:image/png;base64,${base64Image}` });
        } else {
            console.error('❌ No predictions in Vertex AI response:', JSON.stringify(data, null, 2));
            res.status(500).json({
                error: 'No image generated',
                details: data
            });
        }

    } catch (error: any) {
        console.error('Generating Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`   - Vertex AI Key: ${path.basename(vertexKeyPath)}`);
});
