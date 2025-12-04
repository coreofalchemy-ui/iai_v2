/**
 * Content Generator Service - AI Campaign Image Generation
 * 
 * Gemini 3.0 Pro Image Preview 모델을 사용한 고정밀 이미지 합성
 * - 신발 교체 (Virtual Try-On)
 * - 의상 색상 변경
 * - 1:1 아웃페인팅 (배경 확장)
 */

import { GoogleGenAI } from '@google/genai';

export interface ColorSettings {
    outer?: string;   // 아우터/코트
    inner?: string;   // 이너/셔츠
    pants?: string;   // 바지
    socks?: string;   // 양말
}

export interface GenerateResult {
    success: boolean;
    imageBase64?: string;
    error?: string;
}

// API 키 가져오기
const getApiKey = (): string => {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    const localKey = localStorage.getItem('gemini_api_key');
    return envKey || localKey || '';
};

/**
 * 이미지 전처리 - 1:1 캔버스에 검은색 패딩 추가
 * 이 과정이 아웃페인팅(배경 확장)의 핵심 트리거입니다.
 */
export const prepareImageForAi = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const targetSize = 1400; // 고해상도 타겟
            canvas.width = targetSize;
            canvas.height = targetSize;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            // [중요] 빈 공간을 검은색으로 채움 -> AI가 이를 인식하고 배경을 그림
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, targetSize, targetSize);

            // 이미지를 비율 유지하며 중앙 정렬 (Letterbox/Pillarbox)
            const scale = Math.min(targetSize / img.width, targetSize / img.height);
            const newWidth = img.width * scale;
            const newHeight = img.height * scale;
            const x = (targetSize - newWidth) / 2;
            const y = (targetSize - newHeight) / 2;

            ctx.drawImage(img, x, y, newWidth, newHeight);

            // Base64로 변환 (data:image/jpeg;base64, 제거)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
            resolve(base64);
        };

        img.onerror = () => reject(new Error('Image load failed'));
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
    });
};

/**
 * 고정밀 프롬프트 생성
 */
const buildPrompt = (colorSettings?: ColorSettings): string => {
    // 동적 의상 변경 명령 생성
    let clothingInstructions = "";
    if (colorSettings) {
        if (colorSettings.outer)
            clothingInstructions += `- Change the Outerwear/Coat color to ${colorSettings.outer}.\n`;
        if (colorSettings.inner)
            clothingInstructions += `- Change the Inner Top/Shirt color to ${colorSettings.inner}.\n`;
        if (colorSettings.pants)
            clothingInstructions += `- Change the Pants/Trousers color to ${colorSettings.pants}.\n`;
        if (colorSettings.socks)
            clothingInstructions += `- Change the Socks color to ${colorSettings.socks}.\n`;
    }

    return `
[TASK] High-Fidelity Commercial Product Photography (Virtual Try-On)
[MODE] 3D-Like Photorealistic Rendering & Precision Texture Mapping & Outpainting

[CRITICAL: OUTPAINTING / BACKGROUND EXTENSION]
The input image is padded to a 1:1 Square aspect ratio with solid black bars.
**YOU MUST GENERATE REALISTIC BACKGROUND CONTENT** to fill these black areas.
- Extend the floor/ground texture naturally.
- Extend the background wall/environment naturally.
- The final output must be a seamless 1:1 square image with NO visible padding bars.

[INPUT ANALYSIS - SHOES]
Reference Product (Images 2+):
- **Material Physics**: Analyze leather shine, suede matte, mesh transparency.
- **Pattern & Micro-Details**: Capture stitching count, perforation holes, lace texture.
- **Outsole 3D Geometry**: Analyze tread pattern and midsole stack height.

[EXECUTION STEPS]
1. **Shoe Replacement**: Replace model's shoes with Reference Product.
2. **3D Texture Baking**: "Bake" reference textures onto the feet. Look like a 3D render.
3. **Lighting Match**: Match ambient occlusion (shadows) perfectly.
4. **Color Fidelity**: Keep shoe color identical to Reference Product.

${clothingInstructions ? `[ADDITIONAL CLOTHING EDITS]\n${clothingInstructions}` : ''}

[STRICT CONSTRAINTS]
- **NO HALLUCINATIONS**: Do not invent details on the SHOES.
- **PRESERVE IDENTITY**: Model's face/skin MUST remain pixel-perfect.
`;
};

/**
 * AI 캠페인 이미지 생성
 * @param sourceImageBase64 - 모델 이미지 (편집 대상)
 * @param productImagesBase64 - 제품 이미지들 (참조용)
 * @param colorSettings - 의상 색상 설정
 */
export const generateCampaignImage = async (
    sourceImageBase64: string,
    productImagesBase64: string[],
    colorSettings?: ColorSettings
): Promise<GenerateResult> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        return { success: false, error: 'API 키가 설정되지 않았습니다.' };
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = buildPrompt(colorSettings);

        // 이미지 파트 구성 (순서 중요!)
        // 1. 편집 대상 (소스)
        // 2~N. 참조 이미지 (제품)
        const imageParts = [
            { inlineData: { mimeType: 'image/jpeg', data: sourceImageBase64 } },
            ...productImagesBase64.map(img => ({
                inlineData: { mimeType: 'image/jpeg', data: img }
            }))
        ];

        // API 요청
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp', // 이미지 생성 지원 모델
            contents: {
                parts: [
                    { text: "Edit the image based on references. Output 1:1 square." },
                    ...imageParts,
                    { text: prompt }
                ]
            },
            config: {
                responseModalities: ['image', 'text'],
                imageSafety: 'block_none'
            }
        } as any);

        // 결과 추출
        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if ((part as any).inlineData?.data) {
                return {
                    success: true,
                    imageBase64: (part as any).inlineData.data
                };
            }
        }

        return { success: false, error: '이미지 생성 결과가 없습니다.' };

    } catch (error: any) {
        console.error('Campaign image generation failed:', error);
        return {
            success: false,
            error: error.message || '이미지 생성 중 오류가 발생했습니다.'
        };
    }
};

/**
 * File을 Base64로 변환 (전처리 없이)
 */
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.replace(/^data:image\/\w+;base64,/, '');
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};
