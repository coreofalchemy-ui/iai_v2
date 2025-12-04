/**
 * VFX급 신발 교체 서비스
 * - 1400x1400 캔버스 + 검은색 패딩 전처리
 * - Gemini gemini-3-pro-image-preview 모델 사용
 * - VFX급 프롬프트로 신발 교체 + 배경 확장
 */

import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const MODEL_NAME = 'gemini-2.0-flash-exp';

/**
 * 이미지를 1:1 비율 검은색 캔버스에 중앙 배치 (전처리)
 */
export const prepareImageForReplacement = async (file: File | string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;

            // 1400x1400 캔버스
            canvas.width = 1400;
            canvas.height = 1400;

            // 검은색 배경 (AI가 void로 인식)
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 1400, 1400);

            // 비율 유지하며 중앙 배치
            const scale = Math.min(1400 / img.width, 1400 / img.height);
            const dWidth = img.width * scale;
            const dHeight = img.height * scale;
            const dx = (1400 - dWidth) / 2;
            const dy = (1400 - dHeight) / 2;

            ctx.drawImage(img, dx, dy, dWidth, dHeight);

            // Base64 추출 (헤더 제거)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
        };

        img.onerror = () => reject(new Error('이미지 로드 실패'));

        if (typeof file === 'string') {
            img.src = file;
        } else {
            img.src = URL.createObjectURL(file);
        }
    });
};

/**
 * VFX급 신발 교체 실행
 */
export const executeShoeReplacement = async (
    sourceImageBase64: string,  // 모델 원본 (1:1, 검은 여백)
    productImageBase64: string  // 교체할 신발 제품
): Promise<{ success: boolean; imageBase64?: string; error?: string }> => {

    if (!API_KEY) {
        return { success: false, error: 'API 키가 없습니다' };
    }

    const VFX_PROMPT = `
[ROLE] Senior 3D Material Artist & VFX Compositor
[TASK] Hyper-Realistic Shoe Replacement with Outpainting

[INPUTS]
- Image 1: TARGET SCENE (Model). Contains BLACK BARS (Void) for Outpainting.
- Image 2: MASTER PRODUCT (Shoe Reference).

[PHASE 1: MACRO TEXTURE INSPECTION (PRIORITY #1)]
**SIMULATE 400% ZOOM ON IMAGE 2**
1. **LEATHER DNA**: Identify hide type (Full-grain, Suede, Mesh, Canvas).
2. **PORE MAPPING**: Extract pore density and replicate uneven pebble grain exactly.
3. **IMPERFECTIONS**: Capture micro-creases. DO NOT make it look synthetic.
4. **COLOR MATCH**: Extract exact hex codes from Image 2 for color matching.

[PHASE 2: 3D GEOMETRY LOCK]
1. **EXACT SHAPE MATCH**: The silhouette of the shoe in Image 1 MUST change to match Image 2.
2. **OUTSOLE GEOMETRY**: Replicate the tread pattern and midsole stack height from Image 2 pixel-perfectly.
3. **TOE BOX**: Match the exact roundness/pointedness from Image 2.
4. **WARPING**: If the product is chunky, warp the model's foot to match.

[PHASE 3: PHOTOREALISTIC COMPOSITING]
1. **STITCHING**: Every thread count must be visible.
2. **LACES**: Replicate the weave pattern of the laces from Image 2.
3. **LIGHTING**: Apply Scene 1's lighting to the new shoe texture.
4. **SHADOWS**: Maintain consistent shadow direction.

[PHASE 4: SCENE RECONSTRUCTION (OUTPAINTING)]
1. **FILL THE VOID**: The Input Image 1 has BLACK BARS. Treat them as "missing camera view".
2. **EXTEND ENVIRONMENT**: Generate realistic floor (concrete/wood) and walls to fill the black areas.
3. **SHADOWS**: Cast directional shadows from the model onto the new floor areas.

[STRICT CONSTRAINTS]
- **NO SMOOTHING**: Output must look like a RAW photograph.
- **KEEP MODEL BODY**: Only replace the shoes, keep everything else intact.
- **OUTPUT**: 1:1 Square Image. NO BLACK BARS remaining.
`;

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [{
                role: 'user',
                parts: [
                    { text: "Perform 3D Geometry Shoe Replacement and Background Extension. Replace the shoes in Image 1 with the product shoes from Image 2." },
                    { inlineData: { mimeType: 'image/jpeg', data: sourceImageBase64 } },
                    { inlineData: { mimeType: 'image/jpeg', data: productImageBase64 } },
                    { text: VFX_PROMPT },
                ],
            }],
            config: {
                responseModalities: ['IMAGE', 'TEXT'],
            },
        });

        // 결과 추출
        const candidate = response.candidates?.[0];
        if (!candidate?.content?.parts) {
            return { success: false, error: '응답이 없습니다' };
        }

        for (const part of candidate.content.parts) {
            if (part.inlineData?.data) {
                return { success: true, imageBase64: part.inlineData.data };
            }
        }

        return { success: false, error: '이미지 생성 실패' };

    } catch (error: any) {
        console.error('Shoe Replacement Error:', error);
        return { success: false, error: error.message || '신발 교체 실패' };
    }
};

/**
 * 여러 이미지에서 일괄 신발 교체
 */
export const batchShoeReplacement = async (
    imageUrls: string[],
    productImageBase64: string,
    onProgress?: (current: number, total: number) => void
): Promise<{ url: string; result?: string; error?: string }[]> => {
    const results: { url: string; result?: string; error?: string }[] = [];

    for (let i = 0; i < imageUrls.length; i++) {
        onProgress?.(i + 1, imageUrls.length);

        try {
            // 원본 이미지 전처리
            const sourceBase64 = await prepareImageForReplacement(imageUrls[i]);

            // 신발 교체 실행
            const result = await executeShoeReplacement(sourceBase64, productImageBase64);

            if (result.success && result.imageBase64) {
                results.push({
                    url: imageUrls[i],
                    result: `data:image/jpeg;base64,${result.imageBase64}`
                });
            } else {
                results.push({ url: imageUrls[i], error: result.error });
            }
        } catch (error: any) {
            results.push({ url: imageUrls[i], error: error.message });
        }
    }

    return results;
};
