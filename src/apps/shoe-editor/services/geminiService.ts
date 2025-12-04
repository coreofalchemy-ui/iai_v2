/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, InlineDataPart, Modality } from "@google/genai";

type Effect = 
  'natural_light' | 
  'cinematic' | 
  'side_lighting' | 
  'beautify' | 
  'custom' |
  'studio_minimal_prop' |
  'studio_natural_floor' |
  'studio_texture_emphasis' |
  'studio_cinematic';

// Helper function to convert File to a base64 encoded string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getPromptForEffect = (effect: Effect, poseId?: string): string => {
    // 공통: 전문가 페르소나 및 기본 원칙 설정
    // 3D 렌더링 컨셉 강화
    const systemRole = `
**SYSTEM ROLE:** You are a "Technical 3D Product Visualization Engine" and "Master Retoucher".
**INPUT ANALYSIS:** The input is a raw reference. You must RE-RENDER it into a perfect commercial asset.
**STRICT RULES (VIOLATION = FAIL):**
1.  **IDENTITY LOCK:** Logo, stitching, lace pattern, and design lines must be a 100% PERFECT CLONE.
2.  **QUANTITY CONTROL:** If the prompt says "SINGLE", render EXACTLY ONE shoe. If "PAIR", render TWO. NEVER hallucinate extra parts.
3.  **GEOMETRIC ALIGNMENT:** The product must be perfectly centered (X=50%, Y=50%). The ground plane must be perfectly horizontal.
4.  **SURFACE RE-DRAW:** Remove all dust, wrinkles, and glue marks. The texture must look "Factory Fresh".
`;

    // 1. 미화 (Beautify) - 고급 리터칭 & 톤 보정 & 위치 정렬
    if (effect === 'beautify') {
        let poseInstruction = '';
        
        switch (poseId) {
            case 'left_profile_single': 
                poseInstruction = `
                **[LAYOUT: SINGLE OBJECT - LEFT PROFILE]**
                *   **QUANTITY:** ONLY 1 SHOE (Left Foot). ABSOLUTELY NO SECOND SHOE.
                *   **ANGLE:** Perfect Side Profile (90 degrees). Toe pointing straight LEFT (9 o'clock).
                *   **ALIGNMENT:** Center of the shoe aligned to Canvas Center.
                *   **NEGATIVE:** No right foot, no pair, no angled view.
                `;
                break;
            case 'left_diagonal_single': 
                poseInstruction = `
                **[LAYOUT: SINGLE OBJECT - 3/4 VIEW]**
                *   **QUANTITY:** ONLY 1 SHOE (Left Foot). ABSOLUTELY NO SECOND SHOE.
                *   **ANGLE:** 45-Degree Front-Left Isometric view. Highlighting the toe box and outer side.
                *   **ALIGNMENT:** Centered.
                *   **NEGATIVE:** No pair, no rear view.
                `;
                break;
            case 'front_apart_pair': 
                poseInstruction = `
                **[LAYOUT: PAIR - FRONT VIEW]**
                *   **QUANTITY:** 2 SHOES (Left & Right).
                *   **ARRANGEMENT:** Placed side-by-side with slight spacing. Perfectly symmetrical.
                *   **ANGLE:** Direct Front view.
                `;
                break;
            case 'rear_pair': 
                poseInstruction = `
                **[LAYOUT: PAIR - REAR VIEW]**
                *   **QUANTITY:** 2 SHOES (Left & Right).
                *   **ANGLE:** Direct Rear (Heel) view.
                *   **ARRANGEMENT:** Heels aligned, side-by-side.
                `;
                break;
            case 'top_down_instep_pair': 
                poseInstruction = `
                **[LAYOUT: PAIR - HIGH ANGLE]**
                *   **ANGLE:** 60-Degree Camera Elevation. Looking down at the instep/laces.
                *   **CRITICAL:** The deep inside of the shoe (Insole/Heel cup) must NOT be visible. Focus on the vamp and tongue.
                *   **NOT** a flat-lay (90 deg). It is a High-Angle Product Shot.
                `;
                break;
            case 'left_diagonal_pair':
                 poseInstruction = `
                **[LAYOUT: PAIR - DIAGONAL VIEW]**
                *   **QUANTITY:** 2 SHOES.
                *   **ANGLE:** Both shoes angled 45 degrees to the left.
                *   **ARRANGEMENT:** One slightly in front of the other (natural styling) or side-by-side.
                `;
                break;
            default: 
                poseInstruction = '**LAYOUT:** Standard Commercial Angle. Centered.';
        }

        return `${systemRole}
**[TASK: LUXURY E-COMMERCE RENDER]**

${poseInstruction}

**EXECUTION STEPS:**
1.  **COMPOSITION & SCALE:**
    *   **Fill:** The product(s) must occupy exactly 85% of the image width.
    *   **Padding:** Equal whitespace on Left/Right/Top/Bottom.
    *   **Horizon:** The shoe MUST sit flat on an invisible floor. No tilting.

2.  **MASTER RETOUCHING:**
    *   **Surface:** Re-synthesize the material. Make it flawless leather/mesh.
    *   **Color:** NEUTRAL WHITE BALANCE. Remove any yellow/orange tint from indoor lighting.
    *   **Blacks:** Force "JET BLACK" (Hex #050505). Remove brown reflections.

3.  **LIGHTING & BACKGROUND:**
    *   **Light:** Soft, expensive studio strobe lighting.
    *   **Background:** PURE WHITE (#FFFFFF).
    *   **Shadow:** NO cast shadow. Floating isolation (Nu-kki).
`;
    }

    // 스튜디오 효과 공통 베이스
    const studioBase = `${systemRole}
**[TASK: EDITORIAL CAMPAIGN RENDER]**
**FORMAT:** Vertical Portrait (3:4 Ratio).
**COMPOSITION:** Product fills 85% of width. 5% Padding. Perfectly Centered.
`;

    // 2. 스튜디오 - 미니멀 소품 (Studio Minimal Prop)
    if (effect === 'studio_minimal_prop') {
        return `${studioBase}
**SCENE: "MODERN ARCHITECTURE"**
*   **Environment:** A clean, minimal studio set. Walls are painted matte Off-White (#F0F0F0). Floor is polished light grey concrete.
*   **Props:** A single, geometric concrete cube or cylinder. The shoe is placed ARTISTICALLY on top of or leaning against this prop.
*   **Lighting:** "Softbox Window Light" from the top-left.
*   **Atmosphere:** Calm, sophisticated, expensive, museum-like.
*   **Shadows:** Very soft, diffuse contact shadows.`;
    }

    // 3. 스튜디오 - 자연광 바닥 (Studio Natural Floor)
    if (effect === 'studio_natural_floor') {
        return `${studioBase}
**SCENE: "URBAN SUNLIGHT"**
*   **Environment:** Raw, textured pavement or rough bright concrete floor.
*   **Lighting:** "Hard Sunlight" (Direct Sun). High contrast. Color temperature 5500K (Daylight).
*   **Shadow Effect:** CRITICAL -> Use a "Gobo" (Go-Between) to cast a shadow of a window frame or palm leaf across the scene.
*   **Atmosphere:** Energetic, organic, summer vibe, street fashion.
*   **Texture:** Emphasize the grit of the floor vs. the smoothness of the shoe.`;
    }

    // 4. 스튜디오 - 텍스처 부각 (Studio Texture Emphasis)
    if (effect === 'studio_texture_emphasis') {
        return `${studioBase}
**SCENE: "DARK MODE DETAIL"**
*   **Environment:** Dark, matte Charcoal Grey (#333333) seamless background.
*   **Lighting:** "Raking Light" (Low angle side lighting). The light must graze across the surface of the shoe.
*   **Purpose:** This lighting angle exaggerates the depth of the materials—popping the suede texture, leather grain, and mesh holes.
*   **Atmosphere:** Masculine, technical, premium, dramatic.
*   **Contrast:** High contrast between the illuminated ridges and shadowed valleys of the texture.`;
    }

    // 5. 스튜디오 - 시네마틱 (Studio Cinematic)
    if (effect === 'studio_cinematic') {
        return `${studioBase}
**SCENE: "FUTURE RUNWAY"**
*   **Environment:** A dark, glossy, wet-look black floor.
*   **Atmosphere:** Low-lying fog/dry ice smoke covering the floor slightly.
*   **Action:** The shoe creates a "Levitation" illusion (floating slightly above the ground).
*   **Lighting:** A single "God Ray" spotlight beaming down from above. Rim lighting on the edges of the shoe to separate it from the dark background.
*   **Vibe:** Cyberpunk, ethereal, movie poster quality.`;
    }

    // 기존 레거시 효과 지원 (Fallback)
    if (effect === 'custom') {
        return `${systemRole}
**[TASK: COMPOSITE BLENDING]**
**INSTRUCTION:** Seamlessly integrate the provided shoe into the provided background image.
*   **Perspective Match:** Align the shoe's angle with the background's ground plane.
*   **Light Match:** Analyze the light source in the background and replicate it on the shoe (direction, color, intensity).
*   **Shadows:** Cast a realistic shadow onto the background floor based on the light direction.`;
    }

    // 그 외 기본
    return `${systemRole} A photorealistic high-end product shot of the shoe.`;
}

export const applyShoeEffect = async (
  files: File[],
  effect: Effect,
  onProgressUpdate: (message: string) => void,
  customBackground: File | null,
  poseId?: string
): Promise<string> => {
    const ai = new GoogleGenAI({apiKey: import.meta.env.VITE_GEMINI_API_KEY});
    
    onProgressUpdate('Gemini 3.0 Pro 엔진 가동...');
    const prompt = getPromptForEffect(effect, poseId);
    
    onProgressUpdate('3D 공간 및 위치 좌표 계산 중...');
    
    const imageParts: InlineDataPart[] = [];
    
    // 커스텀 배경이 있으면 먼저 추가
    if (effect === 'custom' && customBackground) {
        onProgressUpdate('배경 이미지 분석 중...');
        imageParts.push({ inlineData: { data: await fileToBase64(customBackground), mimeType: customBackground.type } });
    }

    // 원본 신발 이미지 추가
    for (const file of files) {
        imageParts.push({ inlineData: { data: await fileToBase64(file), mimeType: file.type } });
    }
    
    const parts = [...imageParts, { text: prompt }];

    // Gemini 3.0 Pro Image Preview 호출 설정
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview', // 최신 3.0 모델
        contents: { parts },
        config: {
            responseModalities: [ Modality.IMAGE ],
            imageConfig: {
                // 상업용 화보 표준 비율 (3:4)
                aspectRatio: '3:4', 
                // Gemini 3.0 전용 고해상도 설정
                imageSize: '2K' 
            }
        },
    });

    onProgressUpdate('이미지 정렬 및 리터칭 중...');
    
    if (response.promptFeedback?.blockReason) {
        const reason = response.promptFeedback.blockReason;
        throw new Error(`이미지 생성이 차단되었습니다. (사유: ${reason})`);
    }

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts?.[0]) {
        throw new Error('AI 응답 오류: 이미지가 생성되지 않았습니다.');
    }

    for (const part of candidate.content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
    }
    throw new Error('생성된 이미지 데이터를 찾을 수 없습니다.');
};

export const applyColorChange = async (
  baseImageFile: File,
  onProgressUpdate: (message: string) => void,
  selectedColor: string | null,
  customColorImage: File | null,
): Promise<string> => {
    const ai = new GoogleGenAI({apiKey: import.meta.env.VITE_GEMINI_API_KEY});
    onProgressUpdate('제품 재질 및 파트 분석 중...');

    const colorInstruction = customColorImage
        ? `**Target Color:** Extract the dominant color from the provided reference image.`
        : `**Target Color:** HEX ${selectedColor}.`;
    
    const colorChangePrompt = `
**SYSTEM ROLE:** Expert Digital Retoucher.
**TASK:** Recolor the shoe's UPPER material only.
**CONSTRAINT:** The OUTSOLE (rubber bottom) and LOGO must remain 100% UNTOUCHED.

**EXECUTION STEPS:**
1.  **Masking:** Precisely isolate the 'Upper' (leather/mesh/fabric).
2.  **Color Grading:** Apply ${colorInstruction} to the Upper.
3.  **Texture Preservation:** KEEP all original stitching, grain, and specular highlights. The material must look realistic, not like a flat paint bucket fill.
4.  **Lighting:** Ensure the new color reacts naturally to the existing lighting in the photo.
`;

    const parts = [
        { inlineData: { data: await fileToBase64(baseImageFile), mimeType: baseImageFile.type } },
        { text: colorChangePrompt }
    ];

    if (customColorImage) {
        parts.push({ inlineData: { data: await fileToBase64(customColorImage), mimeType: customColorImage.type } });
    }

    onProgressUpdate('Gemini 3.0 Pro 색상 변경 적용 중...');
    const colorResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts },
        config: { 
            responseModalities: [ Modality.IMAGE ],
            imageConfig: {
                aspectRatio: '1:1', // 색상 변경은 1:1 유지
                imageSize: '2K'
            }
        },
    });

    onProgressUpdate('최종 마무리 중...');
    
    const finalCandidate = colorResponse.candidates?.[0];
    if (!finalCandidate?.content?.parts?.[0]) {
        throw new Error('색상 변경 이미지를 생성하지 못했습니다.');
    }

    for (const part of finalCandidate.content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
    }
    throw new Error('이미지 데이터를 반환받지 못했습니다.');
};
