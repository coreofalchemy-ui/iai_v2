import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY! });

// Helper function to clean JSON from AI response
function cleanJson(text: string): string {
    const withoutFence = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const match = withoutFence.match(/\{[\s\S]*\}/);
    if (match) return match[0];
    return withoutFence;
}

// ============ 1. Extract Product Info ============
router.post('/extract-product-info', async (req, res) => {
    try {
        const { images, prompt } = req.body;

        const parts: any[] = images.map((img: any) => ({
            inlineData: {
                data: img.base64,
                mimeType: img.mimeType,
            },
        }));

        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: { parts },
        });

        const rawText = response.text;
        if (!rawText) throw new Error("AI 응답이 비어있습니다.");

        const jsonText = cleanJson(rawText);
        const parsed = JSON.parse(jsonText);

        res.json({ success: true, data: parsed });
    } catch (error) {
        console.error('Extract Product Info Error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// ============ 2. Generate Faces ============
router.post('/generate-faces', async (req, res) => {
    try {
        const { gender, race, age } = req.body;

        const genderTerm = gender === 'male' ? 'male' : 'female';
        const numericAge = parseInt(age);

        let ageDetails = "";
        if (numericAge <= 25) {
            ageDetails = "Youthful but textured skin, visible pores, peach fuzz, natural skin unevenness, unretouched, slight imperfections.";
        } else if (numericAge <= 40) {
            ageDetails = "Authentic skin texture, micropores, very faint fine lines, natural skin tone variation, not overly smoothed.";
        } else {
            ageDetails = "Visible signs of aging, dignified wrinkles, fine lines around eyes and mouth, sunspots.";
        }

        const vibeKeywords = gender === 'female'
            ? "trendy, hip, cool girl aesthetic, street casting model, charismatic, edgy, chic, non-traditional beauty"
            : "cool, edgy, streetwear vibe, raw masculinity, intense gaze, modern model, distinctive features";

        const textureKeywords = "hyper-realistic skin texture, visible pores, peach fuzz on face, slight skin imperfections, natural eyebrows, unretouched, raw photograph, film grain, Kodak Portra 400";

        const hairStyles = gender === 'male'
            ? ["buzz cut", "messy textured hair", "slicked back hair", "modern mullet/fade", "grown out waves"]
            : ["long straight sleek hair", "messy chic bob cut", "voluminous wavy hair", "tight bun with loose strands", "layered cut with texture"];

        const studioBackgrounds = [
            "Solid pure white studio backdrop",
            "Dark grey textured canvas background",
            "Soft beige seamless paper background",
            "Cool light blue studio background",
            "Warm cream colored studio wall"
        ];

        const promises = Array(5).fill(null).map(async (_, idx) => {
            try {
                const hairStyle = hairStyles[idx % hairStyles.length];
                const bg = studioBackgrounds[idx % studioBackgrounds.length];

                const prompt = `
[1. SUBJECT]: Extreme close-up portrait of a ${age}-year-old ${race} ${genderTerm}.
- VIBE: ${vibeKeywords}.
- REALISM: ${textureKeywords}. NOT AI-looking, NOT plastic smooth.
- APPEARANCE: Authentic. Slight natural asymmetry allowed.
- CROP: NECK UP ONLY. FOCUS ON FACE FEATURES.
- NO CLOTHES: Bare skin/shoulders only.
- HAIR: ${hairStyle}.
- DETAILS: ${ageDetails}
[2. BACKGROUND]: ${bg}. Simple, solid color.
[3. STYLE]: Hip magazine photography, 35mm film style.
- LIGHTING: Direct flash or hard studio lighting.
- COLOR: FULL COLOR ONLY. Vibrant. NO B&W.
        `;

                const response = await ai.models.generateContent({
                    model: 'gemini-3-pro-image-preview',
                    contents: { parts: [{ text: prompt }] },
                    config: {
                        imageConfig: { aspectRatio: '1:1', imageSize: '1K' }
                    }
                });

                for (const part of response.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
                return null;
            } catch (e) {
                console.error(`Face ${idx} generation error:`, e);
                return null;
            }
        });

        const results = await Promise.all(promises);
        const faces = results.filter((img): img is string => img !== null);

        res.json({ success: true, faces });
    } catch (error) {
        console.error('Generate Faces Error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// ============ 3. Generate Candidates ============
router.post('/generate-candidates', async (req, res) => {
    try {
        const { gender, age, ethnicity, faceImage } = req.body;

        const genderTerm = gender === 'w' ? 'FEMALE' : 'MALE';
        const poses = [
            "Standing straight, confident pose, fashion model stance",
            "Walking forward, mid-stride, dynamic movement",
            "Leaning against wall, casual relaxed pose",
            "Seated position, legs crossed, elegant posture",
            "Side profile, head slightly turned, professional model pose"
        ];

        const candidates: string[] = [];

        for (let i = 0; i < 5; i++) {
            try {
                const faceBase64 = faceImage.includes('base64,')
                    ? faceImage.split('base64,')[1]
                    : faceImage;

                const systemPrompt = `
[TASK: GENERATE MODEL WITH SPECIFIC IDENTITY]
INPUT: Face identity reference image.
GOAL: Generate a full-body fashion model photo with this exact face identity.

[STRICT RULES]
1. IDENTITY LOCK: The face must look exactly like the input face.
2. BODY: Full body ${genderTerm} model, ${age} years old, ${ethnicity} features.
3. OUTFIT: Modern casual streetwear or minimal fashion clothing.
4. POSE: ${poses[i]}
5. BACKGROUND: Clean studio background, minimal setting.
6. QUALITY: Professional fashion photography, 8K quality.
7. ASPECT RATIO: Vertical portrait (3:4).
        `;

                const response = await ai.models.generateContent({
                    model: 'gemini-3-pro-image-preview',
                    contents: {
                        parts: [
                            { inlineData: { data: faceBase64, mimeType: 'image/png' } },
                            { text: systemPrompt }
                        ]
                    },
                    config: {
                        imageConfig: { aspectRatio: "3:4", imageSize: "1K" }
                    }
                });

                if (response.candidates?.[0]?.content?.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData) {
                            const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                            candidates.push(imageUrl);
                            break;
                        }
                    }
                }
            } catch (e) {
                console.error(`Candidate ${i} generation error:`, e);
            }
        }

        res.json({ success: true, candidates });
    } catch (error) {
        console.error('Generate Candidates Error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// ============ 4. Generate Lookbook ============
router.post('/generate-lookbook', async (req, res) => {
    try {
        const { candidateImage, productImages, bgImage, gender, useFilter } = req.body;

        const MALE_FULL_BODY = [
            `[POSE] Mid-stride walk towards camera. [HANDS] Right hand raised to upper chest level, Left hand in pant pocket.`,
            `[POSE] Standing still, angled 45-degrees. [HANDS] Left hand raised touching the chin/jawline.`,
            `[POSE] Seated position, one leg extended. [HANDS] Leaning back, both hands behind supporting body.`
        ];

        const FEMALE_FULL_BODY = [
            `[POSE] Standing at a slight 3/4 angle. [HANDS] Both hands loosely clasped together in front of thighs.`,
            `[POSE] Standing facing forward, weight shifted to one hip. [HANDS] Left hand raised, fingers running through hair.`,
            `[POSE] Mid-walk with one leg forward. [HANDS] Arms naturally swinging.`
        ];

        const MALE_DETAIL = [
            `[FRAME] Knee-down shot. Close-up of shoes and lower legs.`,
            `[FRAME] Low-angle ground shot. Focus on footwear from below.`,
            `[FRAME] Side profile shot. Detail of shoe design from side angle.`
        ];

        const FEMALE_DETAIL = [
            `[FRAME] Dynamic side stride close-up. Capture movement and shoe detail.`,
            `[FRAME] Top-down view. Overhead shot showing shoe design.`,
            `[FRAME] Seated detail. Close-up of crossed legs and shoes.`
        ];

        const fullBodyPoses = gender === 'w' ? FEMALE_FULL_BODY : MALE_FULL_BODY;
        const detailPoses = gender === 'w' ? FEMALE_DETAIL : MALE_DETAIL;

        const filterPrompt = useFilter
            ? `[FILTER: FILM LOOK] Analog Film Photography, Grain, Vintage aesthetic.`
            : `[FILTER: DIGITAL CLEAN] Ultra-sharp 8K digital quality.`;

        const systemPromptBase = `
[TASK: FASHION LOOKBOOK PRODUCTION]
Input 1: SELECTED MODEL. Input 2-5: PRODUCT SHOE IMAGES.
RULES:
1. IGNORE THE POSE OF INPUT 1: Create NEW GEOMETRY based on pose instruction.
2. KEEP ATTRIBUTES ONLY: Use Input 1 as reference for Face, Outfit style, overall vibe.
3. PRODUCT IDENTITY LOCK: The generated shoe MUST be identical to input product images.
4. NO SPLIT SCREEN. 9:16 portrait ratio.
${filterPrompt}
    `;

        const candidateBase64 = candidateImage.includes('base64,')
            ? candidateImage.split('base64,')[1]
            : candidateImage;

        const images: string[] = [];

        // Full body shots
        for (let i = 0; i < 3; i++) {
            try {
                const parts: any[] = [
                    { inlineData: { data: candidateBase64, mimeType: 'image/png' } }
                ];

                productImages.slice(0, 4).forEach((img: any) => {
                    parts.push({ inlineData: { data: img.base64, mimeType: img.mimeType } });
                });

                if (bgImage) {
                    parts.push({ inlineData: { data: bgImage.base64, mimeType: bgImage.mimeType } });
                }

                const prompt = `${systemPromptBase}\n\n[SHOT ${i + 1}] FULL-BODY. POSE: ${fullBodyPoses[i]}`;
                parts.push({ text: prompt });

                const response = await ai.models.generateContent({
                    model: 'gemini-3-pro-image-preview',
                    contents: { parts },
                    config: {
                        imageConfig: { aspectRatio: "9:16", imageSize: "2K" }
                    }
                });

                if (response.candidates?.[0]?.content?.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData) {
                            images.push(`data:image/png;base64,${part.inlineData.data}`);
                            break;
                        }
                    }
                }
            } catch (e) {
                console.error(`Full body ${i} error:`, e);
            }
        }

        // Detail shots
        for (let i = 0; i < 3; i++) {
            try {
                const parts: any[] = [
                    { inlineData: { data: candidateBase64, mimeType: 'image/png' } }
                ];

                productImages.slice(0, 4).forEach((img: any) => {
                    parts.push({ inlineData: { data: img.base64, mimeType: img.mimeType } });
                });

                if (bgImage) {
                    parts.push({ inlineData: { data: bgImage.base64, mimeType: bgImage.mimeType } });
                }

                const prompt = `${systemPromptBase}\n\n[SHOT ${i + 4}] DETAIL KNEE-DOWN. POSE: ${detailPoses[i]}`;
                parts.push({ text: prompt });

                const response = await ai.models.generateContent({
                    model: 'gemini-3-pro-image-preview',
                    contents: { parts },
                    config: {
                        imageConfig: { aspectRatio: "9:16", imageSize: "2K" }
                    }
                });

                if (response.candidates?.[0]?.content?.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData) {
                            images.push(`data:image/png;base64,${part.inlineData.data}`);
                            break;
                        }
                    }
                }
            } catch (e) {
                console.error(`Detail ${i} error:`, e);
            }
        }

        res.json({ success: true, images });
    } catch (error) {
        console.error('Generate Lookbook Error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
