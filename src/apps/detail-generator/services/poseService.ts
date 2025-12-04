import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

// Use the same model as geminiService.ts that works for image generation
const MODEL_NAME = 'gemini-3-pro-image-preview';

const getApiKey = (): string | undefined => {
    if (import.meta.env.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
    if (typeof process !== 'undefined' && process.env?.API_KEY) return process.env.API_KEY;
    if (typeof window !== 'undefined' && (window as any).aistudio?.getApiKey) return (window as any).aistudio.getApiKey();
    return undefined;
};

const getAI = () => {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('❌ API Key not found!');
        throw new Error("AUTH_ERROR: API 키가 설정되지 않았습니다. .env 파일에 VITE_GEMINI_API_KEY를 설정해주세요.");
    }
    console.log('✅ API Key found');
    return new GoogleGenAI({ apiKey });
};

const SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

// ========================================
// 40 POSE DEFINITIONS
// ========================================

// 👩 FEMALE_FULL_BODY (01-10)
export const FEMALE_FULL_BODY_POSES: { id: string; description: string }[] = [
    {
        id: "01_FEMALE_FULL_Straight_Profile",
        description: "Side profile shot from hip height. Standing strictly upright in a neutral pose. Arms hanging vertically by the sides, fingers relaxed. Legs straight and feet together. Head facing directly forward, chin parallel to the ground. No movement."
    },
    {
        id: "02_FEMALE_FULL_Walking_Look_Back",
        description: "Rear 3/4 view from eye level. Subtle walking motion away from camera. Left leg crossing over right leg. Left hand resting firmly on the left hip. Torso twisted slightly to the right. Head turned back over the left shoulder to look at the viewer."
    },
    {
        id: "03_FEMALE_FULL_Hand_on_Head",
        description: "Frontal shot from chest height. Standing relaxed. Weight shifted to the right hip (contrapposto). Left elbow bent upwards, hand resting lightly on top of the head. Right arm hanging loose. Head tilted 15 degrees to the left."
    },
    {
        id: "04_FEMALE_FULL_Looking_Down",
        description: "Frontal shot from low angle. Standing with feet wide apart (shoulder-width). Left hand tucked into the waistband. Right arm hanging straight down. Shoulders rounded forward slightly. Head tilted down, chin tucked towards chest, looking at the floor."
    },
    {
        id: "05_FEMALE_FULL_Leaning_Forward",
        description: "Frontal 3/4 view from eye level. Leaning forward at the waist about 20 degrees. Both hands clasped together between the upper thighs. Shoulders hunched forward naturally. Knees slightly bent. Head angled down."
    },
    {
        id: "06_FEMALE_FULL_Legs_Crossed",
        description: "Frontal shot from knee height. Standing static. Legs crossed at the shins (Right leg in front of left). Both hands clasped loosely at the lower waist. Weight balanced on the back foot. Head turned 45 degrees to the right."
    },
    {
        id: "07_FEMALE_FULL_Deep_Squat",
        description: "Low angle frontal shot. Deep crouching position. Knees bent fully. Right knee positioned higher than left. Right elbow resting on right knee, hand supporting the chin. Left arm straight, fingers touching the floor for balance."
    },
    {
        id: "08_FEMALE_FULL_Hands_on_Thighs",
        description: "Frontal shot from eye level. Leaning torso forward 45 degrees from hips. Both palms resting on the mid-thighs. Arms fully extended to support weight. Legs straight. Neck extended, looking directly at the camera."
    },
    {
        id: "09_FEMALE_FULL_Profile_Eye_Contact",
        description: "Side profile shot (facing left). Standing straight. Left leg stepped forward slightly. Left hand hidden in pocket. Torso remains in profile, but head is turned 90 degrees to face the camera lens directly."
    },
    {
        id: "10_FEMALE_FULL_Power_Stance",
        description: "Frontal 3/4 view from low angle. Confident standing pose. Right leg stepped forward aggressively. Right hand inside trouser pocket. Left arm relaxed by side. Spine straight. Head facing forward."
    }
];

// 👩 FEMALE_CLOSE_UP (11-20)
export const FEMALE_CLOSE_UP_POSES: { id: string; description: string }[] = [
    {
        id: "11_FEMALE_CLOSE_Dangling_Arch",
        description: "Side profile close-up (waist to floor). One foot planted, the other suspended in air. The lifted foot has a high arch with toes pointed downwards (plantar flexion). Detailed ankle bone structure visible."
    },
    {
        id: "12_FEMALE_CLOSE_One_Leg_Lifted",
        description: "Front view close-up (thigh to floor). Standing on one straight leg. The other leg is bent at the knee 90 degrees, lifting the foot behind the standing leg. Knees are close together."
    },
    {
        id: "13_FEMALE_CLOSE_Walking_Stride",
        description: "Ground-level low angle close-up. Walking motion. Front foot flat on ground. Back foot heel lifted 45 degrees, weight pressing on the ball of the foot (push-off phase). Ankle tendons visible."
    },
    {
        id: "14_FEMALE_CLOSE_Tiptoe_Stance",
        description: "Rear view close-up (calves to floor). Standing on tiptoes (relevé). Both heels raised high off the ground. Feet parallel and slightly apart. Calf muscles engaged."
    },
    {
        id: "15_FEMALE_CLOSE_Deep_Squat_Side",
        description: "Side profile close-up. Deep squat position. Hamstrings pressed tight against calves. Knees fully bent. Feet flat on the floor. Center of gravity low."
    },
    {
        id: "16_FEMALE_CLOSE_Squat_Front",
        description: "Front view close-up (knees to floor). Crouching posture. Knees bent deeply and angled outwards 45 degrees. Heels slightly lifted off the ground. Weight distinct on the balls of feet."
    },
    {
        id: "17_FEMALE_CLOSE_Dynamic_Step",
        description: "Side profile close-up. Mid-stride snapshot. Front leg extended straight, heel striking the ground first. Toes of the front foot pulled up (dorsiflexion)."
    },
    {
        id: "18_FEMALE_CLOSE_Static_Standing",
        description: "Low angle close-up (ground level). Single leg weight-bearing. Foot planted firmly flat. Ankle joint at a strict 90-degree angle. Vertical shin alignment."
    },
    {
        id: "19_FEMALE_CLOSE_Crossed_Walk",
        description: "Front 3/4 view close-up. Walking motion where one leg crosses in front of the other (catwalk style). Front foot flat, rear foot obscured or heel lifted."
    },
    {
        id: "20_FEMALE_CLOSE_Relaxed_Stance",
        description: "Side view close-up. Static standing. Feet shoulder-width apart. Weight slightly shifted to the heels. Ankles relaxed, not locked. Natural standing posture."
    }
];

// 👨 MALE_FULL_BODY (21-30)
export const MALE_FULL_BODY_POSES: { id: string; description: string }[] = [
    {
        id: "21_MALE_FULL_Pockets_Down",
        description: "Frontal shot from chest height. Standing with a slouch. Shoulders rolled forward. Head tilted down, chin almost touching chest. Both hands deeply buried in pockets. Legs straight but relaxed."
    },
    {
        id: "22_MALE_FULL_Pockets_Up",
        description: "Frontal shot from low angle. Standing tall with a slight backward lean. Head tilted upwards 20 degrees (chin up). Both hands in pockets with elbows pointed outwards. Feet shoulder-width apart."
    },
    {
        id: "23_MALE_FULL_Mid_Stride_Walk",
        description: "Frontal shot from knee height. Walking towards camera. Right leg leading with foot planted. Left leg pushing off behind with heel lifted. Torso upright, arms swinging naturally."
    },
    {
        id: "24_MALE_FULL_Profile_Looking_Down",
        description: "Side profile shot (facing left). Standing completely still. Head tilted down, gaze fixed on the chest/waist area. Shoulders slightly rounded. Hands clasped loosely in front of the hips."
    },
    {
        id: "25_MALE_FULL_Rigid_Stance",
        description: "Frontal shot from eye level. Rigid, military-style standing. Spine perfectly perpendicular to the floor. Arms hanging straight and stiff by sides. Feet firmly planted shoulder-width apart. Face neutral."
    },
    {
        id: "26_MALE_FULL_Relaxed_One_Pocket",
        description: "Frontal shot from eye level. Casual standing. Weight shifted entirely to the left leg. Right knee slightly bent and relaxed. Left hand in pocket. Right arm hanging loose."
    },
    {
        id: "27_MALE_FULL_Leaning_Cross_Legged",
        description: "Frontal shot from chest height. Leaning back against a wall (implied). Legs crossed at the ankles (Right over Left). Both hands in trouser pockets. Shoulders relaxed and back against the surface."
    },
    {
        id: "28_MALE_FULL_Profile_Step",
        description: "Side profile shot (facing left). Mid-stride walking motion. Left leg stepping forward with a long stride, heel touching ground. Right leg trailing behind. Left hand in pocket."
    },
    {
        id: "29_MALE_FULL_Thinking_Stance",
        description: "Frontal shot from eye level. Wide stance. Right hand raised touching the chin (thinking gesture), elbow tucked near ribs. Left hand in pocket. Head neutral."
    },
    {
        id: "30_MALE_FULL_Profile_Look_at_Camera",
        description: "Side profile shot (facing right). Body is strictly sideways. Feet planted. Head turned 90 degrees to the right to look directly into the camera lens. Shoulders remain in profile."
    }
];

// 👨 MALE_CLOSE_UP (31-40)
export const MALE_CLOSE_UP_POSES: { id: string; description: string }[] = [
    {
        id: "31_MALE_CLOSE_Walking_Heel_Up",
        description: "Low angle close-up (ground level). Walking motion. The rear foot's heel is lifted high (70 degrees), weight focused on the big toe. Front foot flat. Trouser hem breaks over the shoe."
    },
    {
        id: "32_MALE_CLOSE_Static_Feet_Apart",
        description: "Low angle close-up. Standing still. Feet positioned parallel, shoulder-width apart. Weight distributed evenly on both soles. Ankles vertical and stable."
    },
    {
        id: "33_MALE_CLOSE_Ankle_Flex",
        description: "Extreme close-up (shin to foot). Foot lifted in mid-air. Ankle flexed tightly upwards (dorsiflexion) to 90 degrees. Toes pointing down. Shin muscle defined."
    },
    {
        id: "34_MALE_CLOSE_Step_Forward",
        description: "Side view close-up. Walking stride. Front leg straight, landing firmly on the heel. The sole of the shoe makes a 30-degree angle with the floor."
    },
    {
        id: "35_MALE_CLOSE_Foot_Cross",
        description: "Front view close-up. Static standing. Ankles crossed tightly (Right foot planted in front of Left). Weight distributed on both feet. Feet parallel to the camera."
    },
    {
        id: "36_MALE_CLOSE_Wide_Stance_Down",
        description: "High angle (top-down) close-up. Very wide stance. Feet angled slightly outwards. Knees locked straight. Planted firmly."
    },
    {
        id: "37_MALE_CLOSE_Single_Foot_Arch",
        description: "Side profile close-up. One foot resting with only the toes touching the ground, heel lifted. The arch of the foot is slightly curved. Other foot flat."
    },
    {
        id: "38_MALE_CLOSE_Walk_Mid_Stride",
        description: "Frontal view close-up. Walking towards camera. Right foot flat and weight-bearing. Left foot in the background, heel raised, in the passing phase of a step."
    },
    {
        id: "39_MALE_CLOSE_Profile_Flat_Stand",
        description: "Side profile close-up. Static standing. Entire sole of the foot is flat on the ground. Ankle at 90 degrees. Weight centered on the heel."
    },
    {
        id: "40_MALE_CLOSE_Inner_Feet_Angle",
        description: "Low angle close-up. Relaxed standing. Feet turned slightly inwards (pigeon-toed). Knees slightly bent/soft. Weight rolling slightly to the outer edges of the shoes."
    }
];

// ========================================
// HELPER FUNCTIONS
// ========================================

function getImageUrlFromResponse(response: any): string {
    console.log('📦 Full API Response:', JSON.stringify(response, null, 2).substring(0, 500));

    // Check if there's text instead of image (common issue)
    const textContent = response.text;
    if (textContent) {
        console.log('⚠️ Response contains text instead of image:', textContent.substring(0, 200));
    }

    for (const candidate of response.candidates || []) {
        console.log('📋 Candidate:', JSON.stringify(candidate, null, 2).substring(0, 300));
        for (const part of candidate.content?.parts || []) {
            if (part.inlineData) {
                console.log('✅ Found inline image data!');
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
            if (part.text) {
                console.log('📝 Part contains text:', part.text.substring(0, 100));
            }
        }
    }

    console.error('❌ No image found in response. Full response:', JSON.stringify(response, null, 2));
    throw new Error('No image found in the response. The model may not support image generation.');
}

async function urlToBase64(url: string): Promise<string> {
    if (url.startsWith('data:')) {
        return url.includes('base64,') ? url.split('base64,')[1] : url;
    }
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.includes('base64,') ? result.split('base64,')[1] : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// ========================================
// GENDER DETECTION
// ========================================

export type Gender = 'MALE' | 'FEMALE';

export async function detectGender(imageUrl: string): Promise<Gender> {
    console.log('🔍 Detecting gender from image...');
    const ai = getAI();
    const base64 = await urlToBase64(imageUrl);

    const prompt = `Analyze this image and determine if the fashion model is MALE or FEMALE.
Look at the body shape, clothing style, and overall appearance.
Respond with ONLY one word: "MALE" or "FEMALE".`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
                parts: [
                    { inlineData: { data: base64, mimeType: 'image/jpeg' } },
                    { text: prompt }
                ]
            },
            config: {
                // @ts-ignore
                safetySettings: SAFETY_SETTINGS
            }
        });

        const text = response.text?.trim().toUpperCase() || '';
        console.log('🔍 Gender detection result:', text);

        if (text.includes('FEMALE')) return 'FEMALE';
        if (text.includes('MALE')) return 'MALE';

        // Default to FEMALE if unclear
        return 'FEMALE';
    } catch (e) {
        console.error('Gender detection failed:', e);
        return 'FEMALE'; // Default
    }
}

// ========================================
// GET AVAILABLE POSES
// ========================================

export function getAvailablePoses(
    gender: Gender,
    type: 'full' | 'closeup',
    usedPoseIds: Set<string>
): { id: string; description: string }[] {
    let poseLibrary: { id: string; description: string }[];

    if (gender === 'FEMALE') {
        poseLibrary = type === 'full' ? FEMALE_FULL_BODY_POSES : FEMALE_CLOSE_UP_POSES;
    } else {
        poseLibrary = type === 'full' ? MALE_FULL_BODY_POSES : MALE_CLOSE_UP_POSES;
    }

    return poseLibrary.filter(pose => !usedPoseIds.has(pose.id));
}

// ========================================
// POSE GENERATION
// ========================================

export interface PoseGenerationResult {
    imageUrl: string;
    poseId: string;
    poseDescription: string;
}

export async function generatePoseVariation(
    baseImageUrl: string,
    pose: { id: string; description: string },
    gender: Gender,
    type: 'full' | 'closeup'
): Promise<PoseGenerationResult> {
    console.log(`🎨 Generating pose variation: ${pose.id}`);
    const ai = getAI();
    const base64 = await urlToBase64(baseImageUrl);

    const frameNote = type === 'closeup'
        ? `[FRAME] This is a CLOSE-UP shot focusing on the lower body (waist down to feet). Emphasize ankle articulation and ground interaction.`
        : `[FRAME] This is a FULL-BODY shot. Show the entire figure from head to toe.`;

    const genderNote = gender === 'FEMALE'
        ? `Model is FEMALE. Maintain feminine proportions and body language.`
        : `Model is MALE. Emphasize wide stance and grounded weight distribution.`;

    const prompt = `
[TASK: FASHION MODEL POSE VARIATION]
Input: A photo of a fashion model wearing specific clothing and shoes.

[CRITICAL RULES - MUST FOLLOW EXACTLY]
1. **IDENTITY LOCK**: Keep the model's FACE 100% IDENTICAL. Same facial features, expression quality.
2. **OUTFIT LOCK**: Keep ALL CLOTHING EXACTLY THE SAME - pants/bottoms fit, color, texture, wrinkles pattern.
3. **SHOES LOCK**: Keep the SHOES 100% IDENTICAL - model, color, condition, lacing style.
4. **BACKGROUND LOCK**: Keep the BACKGROUND 100% IDENTICAL - same studio/location, lighting, color.
5. **ONLY CHANGE POSE**: Apply the new pose described below while preserving everything else.

${frameNote}

${genderNote}

[NEW POSE TO APPLY]
${pose.description}

[STYLE]
- High-end fashion photography
- Professional studio lighting
- 8K resolution, photorealistic
- Magazine quality editorial shot

[AVOID]
- Changing the model's face identity
- Changing clothing style, fit, or color
- Changing shoe appearance
- Changing background
- Adding or removing accessories
- Blurry or distorted output
`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
                parts: [
                    { inlineData: { data: base64, mimeType: 'image/jpeg' } },
                    { text: prompt }
                ]
            },
            config: {
                // @ts-ignore
                imageConfig: {
                    aspectRatio: type === 'closeup' ? '3:4' : '4:3', // 4:3 for full body (horizontal), 3:4 for closeup
                    imageSize: '1K'
                },
                safetySettings: SAFETY_SETTINGS
            }
        });

        const imageUrl = getImageUrlFromResponse(response);
        console.log(`✅ Generated pose: ${pose.id}`);

        return {
            imageUrl,
            poseId: pose.id,
            poseDescription: pose.description
        };
    } catch (e) {
        console.error(`Failed to generate pose ${pose.id}:`, e);
        throw e;
    }
}

// ========================================
// BATCH POSE GENERATION
// ========================================

export async function generatePoseBatch(
    baseImageUrl: string,
    count: number,
    type: 'full' | 'closeup',
    usedPoseIds: Set<string>,
    onProgress?: (current: number, total: number, result: PoseGenerationResult) => void
): Promise<{ results: PoseGenerationResult[]; newUsedPoseIds: Set<string> }> {
    console.log(`🚀 Starting batch pose generation: ${count} images, type: ${type}`);

    // 1. Detect gender
    const gender = await detectGender(baseImageUrl);
    console.log(`👤 Detected gender: ${gender}`);

    // 2. Get available poses
    const availablePoses = getAvailablePoses(gender, type, usedPoseIds);
    console.log(`📋 Available poses: ${availablePoses.length}`);

    if (availablePoses.length === 0) {
        throw new Error(`사용 가능한 자세가 없습니다. 모든 ${gender === 'FEMALE' ? '여성' : '남성'} ${type === 'full' ? '전신' : '클로즈업'} 자세가 이미 사용되었습니다.`);
    }

    // 3. Select poses (up to count, no duplicates)
    const selectedPoses = availablePoses.slice(0, Math.min(count, availablePoses.length));
    console.log(`🎯 Selected ${selectedPoses.length} poses`);

    // 4. Generate images sequentially to avoid rate limits
    const results: PoseGenerationResult[] = [];
    const newUsedPoseIds = new Set(usedPoseIds);

    for (let i = 0; i < selectedPoses.length; i++) {
        const pose = selectedPoses[i];
        try {
            const result = await generatePoseVariation(baseImageUrl, pose, gender, type);
            results.push(result);
            newUsedPoseIds.add(pose.id);

            if (onProgress) {
                onProgress(i + 1, selectedPoses.length, result);
            }
        } catch (e) {
            console.error(`Failed to generate pose ${i + 1}:`, e);
            // Continue with other poses
        }
    }

    console.log(`✨ Batch complete: ${results.length}/${selectedPoses.length} successful`);
    return { results, newUsedPoseIds };
}
