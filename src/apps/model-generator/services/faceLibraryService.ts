/**
 * Face Library Service
 * API client for fetching face images from GCS
 */

export interface FaceImage {
    filename: string;
    publicUrl: string;
    gender: 'm' | 'w';
}

const API_BASE = '/api/faces';

/**
 * Fetch all face images for a specific gender
 */
export async function fetchAllFaces(gender: 'm' | 'w'): Promise<FaceImage[]> {
    try {
        const response = await fetch(`${API_BASE}?gender=${gender}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching faces:', error);
        throw error;
    }
}

/**
 * Fetch random face images for a specific gender
 */
export async function fetchRandomFaces(
    gender: 'm' | 'w',
    count: number = 5
): Promise<FaceImage[]> {
    try {
        const response = await fetch(`${API_BASE}/random?gender=${gender}&wanted=${count}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching random faces:', error);
        throw error;
    }
}

/**
 * Check API server status
 */
export async function checkApiStatus(): Promise<{ gcs: string; bucket: string }> {
    try {
        const response = await fetch('/api/status');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error checking API status:', error);
        throw error;
    }
}
