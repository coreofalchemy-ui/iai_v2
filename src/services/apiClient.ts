// API Client for backend server
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface UploadedImage {
    file: File;
    previewUrl: string;
    base64: string;
    mimeType: string;
}

// ============ Product Info Extraction ============
export async function extractProductInfoFromImages(images: UploadedImage[], prompt: string) {
    const response = await fetch(`${API_BASE}/api/gemini/extract-product-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images, prompt })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API 호출 실패');
    }

    const result = await response.json();
    return result.data;
}

// ============ Face Generation ============
export async function generateFaceBatch(gender: string, race: string, age: string): Promise<string[]> {
    const response = await fetch(`${API_BASE}/api/gemini/generate-faces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender, race, age })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '얼굴 생성 실패');
    }

    const result = await response.json();
    return result.faces;
}

// ============ Candidate Generation ============
export async function generateCandidates(
    gender: string,
    age: string,
    ethnicity: string,
    faceImage: string
): Promise<string[]> {
    const response = await fetch(`${API_BASE}/api/gemini/generate-candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender, age, ethnicity, faceImage })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '후보 생성 실패');
    }

    const result = await response.json();
    return result.candidates;
}

// ============ Lookbook Generation ============
export async function generateLookbook(
    candidateImage: string,
    productImages: UploadedImage[],
    bgImage: UploadedImage | null,
    gender: string,
    useFilter: boolean
): Promise<string[]> {
    const response = await fetch(`${API_BASE}/api/gemini/generate-lookbook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            candidateImage,
            productImages,
            bgImage,
            gender,
            useFilter
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '룩북 생성 실패');
    }

    const result = await response.json();
    return result.images;
}
