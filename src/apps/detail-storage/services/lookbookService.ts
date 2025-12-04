// Lookbook Service - Using Backend API
import {
    generateFaceBatch as apiGenerateFaceBatch,
    generateCandidates as apiGenerateCandidates,
    generateLookbook as apiGenerateLookbook
} from '../../../services/apiClient';

export interface UploadedImage {
    file: File;
    previewUrl: string;
    base64: string;
    mimeType: string;
}

export type ModelGender = 'w' | 'm';
export type ModelAge = '18' | '21' | '25' | '28' | '31' | '35' | '40';
export type ModelEthnicity = 'Korean' | 'Western' | 'East Asian' | 'Black' | 'Mixed';

// ============ Face Generation ============
export const generateFaceBatch = async (
    gender: 'male' | 'female',
    race: string,
    age: string
): Promise<string[]> => {
    return await apiGenerateFaceBatch(gender, race, age);
};

// ============ Candidate Generation ============
export const generateCandidatesStream = async (
    gender: ModelGender,
    age: ModelAge,
    ethnicity: ModelEthnicity,
    targetFaceImage: string,
    onImageGenerated: (imageUrl: string, index: number) => void
): Promise<void> => {
    const candidates = await apiGenerateCandidates(gender, age, ethnicity, targetFaceImage);

    candidates.forEach((imageUrl, index) => {
        onImageGenerated(imageUrl, index);
    });
};

// ============ Final Lookbook Generation ============
export const generateFinalLookbookStream = async (
    candidateImageUrl: string,
    productImages: UploadedImage[],
    bgImage: UploadedImage | null,
    gender: ModelGender,
    useFilter: boolean,
    onImageGenerated: (imageUrl: string, type: 'model' | 'detail', index: number) => void
): Promise<void> => {
    const images = await apiGenerateLookbook(
        candidateImageUrl,
        productImages,
        bgImage,
        gender,
        useFilter
    );

    images.forEach((imageUrl, index) => {
        const type = index < 3 ? 'model' : 'detail';
        const typeIndex = index < 3 ? index : index - 3;
        onImageGenerated(imageUrl, type, typeIndex);
    });
};
