# GCP Cloud Storage Integration - Server Setup

This guide explains how to run the Face Library API server.

## Prerequisites

- Node.js 18+ installed
- GCP service account key file at `server/keys/face-library-key.json`
- `.env` file configured (see `.env.example`)

## Environment Variables

Create a `.env` file with:

```env
# Gemini API
VITE_GEMINI_API_KEY=your_api_key_here

# GCP Cloud Storage
GCS_BUCKET_NAME=coa-lookbook-assets
PORT=3001
```

## Running the Server

### Option 1: Run Client and Server Separately

```bash
# Terminal 1 - Frontend (Vite)
npm run dev:client

# Terminal 2 - Backend (Express)
npm run dev:server
```

### Option 2: Run Both concurrently

```bash
npm run dev:full
```

This will start:
- **Frontend**: http://localhost:5173
- **API Server**: http://localhost:3001

## API Endpoints

### GET /api/faces?gender=m|w

Get all face images for a specific gender.

**Example:**
```bash
curl http://localhost:3001/api/faces?gender=w
```

**Response:**
```json
[
  {
    "filename": "face001.jpg",
    "publicUrl": "https://storage.googleapis.com/coa-lookbook-assets/facesw/face001.jpg",
    "gender": "w"
  }
]
```

### GET /api/faces/random?gender=m|w&wanted=5

Get random selection of face images.

**Example:**
```bash
curl "http://localhost:3001/api/faces/random?gender=w&wanted=5"
```

### GET /api/status

Check API server and GCS connection status.

**Example:**
```bash
curl http://localhost:3001/api/status
```

## GCS Bucket Structure

```
coa-lookbook-assets/
├── facesm/           # Male face images
│   ├── face001.jpg
│   ├── face002.jpg
│   └── ...
└── facesw/           # Female face images
    ├── face001.jpg
    ├── face002.jpg
    └── ...
```

## Using in Model Generator

1. Navigate to http://localhost:5173/model-generator
2. In the "02. 모델 얼굴" section
3. Click "추천 얼굴 라이브러리" button
4. Select a face from the modal
5. Use it in your campaign generation

## Troubleshooting

### Server won't start

- Check that `server/keys/face-library-key.json` exists
- Verify PORT is not already in use
- Check `.env` file is configured

### API returns 500 error

- Verify service account has Storage Object Viewer permission
- Check bucket name is correct in `.env`
- Check bucket exists and is accessible

### CORS errors

- Frontend must be on http://localhost:5173
- Server must be on http://localhost:3001
- Check Vite proxy configuration in `vite.config.ts`

## Production Deployment

For production:
1. Deploy Express server separately (e.g., Cloud Run, App Engine)
2. Update `VITE_API_BASE_URL` to point to production API
3. Configure CORS to allow production frontend domain
4. Use environment variables for all sensitive data
