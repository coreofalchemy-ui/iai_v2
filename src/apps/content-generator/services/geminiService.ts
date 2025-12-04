import { GoogleGenAI, Modality, Type } from '@google/genai';
import { UploadFile } from '../types';
import { fileToBase64, enforceAspectRatio } from '../utils/fileUtils';

// Initialize the Google AI client.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });

// Standard Aspect Ratio for Fashion Detail Pages
const TARGET_WIDTH = 1165;
const TARGET_HEIGHT = 1400;

// MODEL DEFINITIONS - GEMINI 3.0 PRO SERIES
const MODEL_TEXT_LOGIC = 'gemini-3-pro-preview';
const MODEL_IMAGE_GEN = 'gemini-3-pro-image-preview';

const POSE_GENERATION_PROMPT = `
You are a creative director. Generate 3 natural pose descriptions for a footwear photoshoot.
Context: Korean Language.
Output Schema (JSON): Array of { label, prompt }.
`;

export const generatePosePrompts = async (
  existingPrompts: string[]
): Promise<{ label: string; prompt: string }[]> => {
  const prompt = POSE_GENERATION_PROMPT + `\nAvoid: ${existingPrompts.join(', ')}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_TEXT_LOGIC,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              prompt: { type: Type.STRING },
            },
            required: ['label', 'prompt'],
          },
        },
      },
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Pose Prompt Generation Error:", error);
    throw new Error('포즈 생성 중 오류 발생');
  }
};

/**
 * Single-Step Precise Shoe Replacement
 * Uses Gemini 3.0's editing capabilities to swap shoes in one go.
 */
export const replaceShoesInImage = async (
  sourceImage: UploadFile,
  productImages: UploadFile[],
  isSingleShoe: boolean
): Promise<string> => {
  
  // 1. Prepare Source Image
  const sourceImageBase64 = await fileToBase64(sourceImage.file);
  const sourceImagePart = { 
    inlineData: { data: sourceImageBase64, mimeType: sourceImage.file.type } 
  };

  // 2. Prepare Product Images (Limit to 2 for SPEED optimization)
  // Reducing from 4 to 2 drastically improves latency while maintaining sufficient context.
  const limitedProductImages = productImages.slice(0, 2);
  const productImagesParts = await Promise.all(
    limitedProductImages.map(async (img) => {
      const base64 = await fileToBase64(img.file);
      return { inlineData: { data: base64, mimeType: img.file.type } };
    })
  );

  // 3. Construct Powerful Editing Prompt
  const EDITING_PROMPT = `
[TASK] Virtual Try-On / Precise Object Replacement
[INPUT] Image 1 is the 'Model Photo'. The following images are the 'Reference Product'.
[INSTRUCTION]
Replace the shoes worn by the model in Image 1 with the 'Reference Product' shoes.

[CRITICAL RULES]
1. **Target**: Change ONLY the shoes.
2. **Preservation**: The model's face, skin, legs, clothing, and the background MUST remain exactly pixel-perfect to Image 1.
3. **Integration**: Match the lighting, shadows, and perspective of Image 1.
4. **Output**: Return the full image with the new shoes applied. Photorealistic.
`;

  const contents = {
    parts: [
      { text: "Edit the first image based on the reference images." },
      sourceImagePart, // First image = Source
      ...productImagesParts, // Subsequent images = References
      { text: EDITING_PROMPT },
    ],
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_IMAGE_GEN,
      contents,
      config: {
        // Optimized config for speed: Removed explicit "2K" enforcement to allow faster default generation
        imageConfig: {
             aspectRatio: "3:4" 
        },
        responseModalities: [Modality.IMAGE],
      },
    });

    const newImagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (newImagePart?.inlineData) {
      const originalDataUrl = `data:${newImagePart.inlineData.mimeType};base64,${newImagePart.inlineData.data}`;
      // Ensure output consistency with app requirements
      return await enforceAspectRatio(originalDataUrl, TARGET_WIDTH, TARGET_HEIGHT);
    }
    throw new Error("이미지 생성 응답이 비어있습니다.");
  } catch (error) {
    console.error("Replacement Error:", error);
    // User-friendly error mapping
    let msg = String(error);
    if (msg.includes('JSON')) msg = "이미지 처리 중 연결이 불안정합니다. 잠시 후 다시 시도해주세요.";
    if (msg.includes('400')) msg = "요청이 너무 큽니다. 제품 사진 용량을 줄여보세요.";
    
    throw new Error(`작업 실패: ${msg}`);
  }
};


export const changeImagePose = async (
  sourceImage: UploadFile,
  posePrompt: string
): Promise<string> => {
    const sourceImageBase64 = await fileToBase64(sourceImage.file);
    const imagePart = { inlineData: { data: sourceImageBase64, mimeType: sourceImage.file.type } };
    
    const prompt = `
[TASK] Precise Local Editing (Inpainting)
[INPUT] Source Image
[INSTRUCTION]
Modify ONLY the position of the model's legs and feet to match this pose: "${posePrompt}".

[CRITICAL RULES - READ CAREFULLY]
1. **BACKGROUND PRESERVATION**: The background, floor, wall, and lighting environment must remain 100% UNCHANGED. Do NOT regenerate the background.
2. **IDENTITY PRESERVATION**: Do not change the model's face, hair, torso, or arms.
3. **SCOPE**: Apply changes strictly to the lower body (legs/shoes) only.
4. **REALISM**: The new leg position must look natural in the *original* space.
`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_IMAGE_GEN,
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                // Optimized for speed
                imageConfig: { aspectRatio: "3:4" },
                responseModalities: [Modality.IMAGE],
            },
        });

        const newImagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

        if (newImagePart?.inlineData) {
             const originalDataUrl = `data:${newImagePart.inlineData.mimeType};base64,${newImagePart.inlineData.data}`;
             return await enforceAspectRatio(originalDataUrl, TARGET_WIDTH, TARGET_HEIGHT);
        }
        throw new Error("No pose image generated.");

    } catch (error) {
        console.error("Pose Change Error:", error);
        throw new Error(`자세 변경 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
};