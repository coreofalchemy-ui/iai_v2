import React, { useState } from 'react';

interface UploadedImage {
    file: File;
    previewUrl: string;
    base64: string;
    mimeType: string;
}

interface GeneratedDetailCut {
    url: string;
    index: number;
}

interface StepDetailCutProps {
    productImages: UploadedImage[];
    onAddToPreview: (imageUrl: string) => void;
}

const StepDetailCut: React.FC<StepDetailCutProps> = ({ productImages, onAddToPreview }) => {
    const [backgroundImages, setBackgroundImages] = useState<UploadedImage[]>([]);
    const [generatedImages, setGeneratedImages] = useState<GeneratedDetailCut[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newImages: UploadedImage[] = [];
        let processedCount = 0;

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64String = (event.target?.result as string).split(',')[1];
                newImages.push({
                    file,
                    previewUrl: URL.createObjectURL(file),
                    base64: base64String,
                    mimeType: file.type
                });
                processedCount++;

                if (processedCount === files.length) {
                    setBackgroundImages(prev => [...prev, ...newImages]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removeBackgroundImage = (index: number) => {
        setBackgroundImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleGenerate = async () => {
        if (backgroundImages.length === 0) {
            setError('배경 이미지를 업로드해주세요.');
            return;
        }

        if (productImages.length === 0) {
            setError('제품 이미지가 없습니다. Step 1에서 제품 이미지를 먼저 업로드해주세요.');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const { GoogleGenAI, Modality } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });

            const generationPromises = backgroundImages.map(async (bgImage, index) => {
                // Prepare background image
                const bgImagePart = {
                    inlineData: { data: bgImage.base64, mimeType: bgImage.mimeType }
                };

                // Prepare product images (limit to 2 for speed)
                const productImagesParts = productImages.slice(0, 2).map(img => ({
                    inlineData: { data: img.base64, mimeType: img.mimeType }
                }));

                const EDITING_PROMPT = `
[TASK] Product Integration / Precise Object Replacement
[INPUT] Image 1 is the 'Background Scene'. The following images are the 'Product to Insert'.
[INSTRUCTION]
Replace or insert the product shoes from the reference images into the background scene (Image 1).

[CRITICAL RULES]
1. **Target**: Add or replace shoes in the scene naturally.
2. **Preservation**: The background environment, lighting, and atmosphere MUST remain exactly as in Image 1.
3. **Integration**: Match the lighting, shadows, and perspective of Image 1 perfectly.
4. **Placement**: Position the shoes naturally in the scene as if they belong there.
5. **Output**: Return the full image with the product integrated. Photorealistic quality.
`;

                const contents = {
                    parts: [
                        { text: "Edit the first image by adding the product from reference images." },
                        bgImagePart,
                        ...productImagesParts,
                        { text: EDITING_PROMPT },
                    ],
                };

                const response = await ai.models.generateContent({
                    model: 'imagen-3.0-generate-001',
                    contents,
                    config: {
                        // imageConfig: {
                        //     aspectRatio: "3:4"
                        // },
                        // responseModalities: [Modality.IMAGE],
                    },
                });

                const newImagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

                if (newImagePart?.inlineData) {
                    return {
                        url: `data:${newImagePart.inlineData.mimeType};base64,${newImagePart.inlineData.data}`,
                        index
                    };
                }
                throw new Error(`이미지 ${index + 1} 생성 실패`);
            });

            const results = await Promise.allSettled(generationPromises);
            const successful = results
                .filter(r => r.status === 'fulfilled')
                .map(r => (r as PromiseFulfilledResult<GeneratedDetailCut>).value);

            if (successful.length === 0) {
                throw new Error('모든 이미지 생성에 실패했습니다.');
            }

            setGeneratedImages(successful);

            const failedCount = results.length - successful.length;
            if (failedCount > 0) {
                setError(`${successful.length}/${results.length} 개 생성 성공. ${failedCount}개는 실패했습니다.`);
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
            setError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddToPreview = (imageUrl: string) => {
        onAddToPreview(imageUrl);
        alert('상세페이지에 추가되었습니다!');
    };

    return (
        <div className="space-y-6">
            {/* 안내 */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="font-display text-lg font-semibold text-purple-900 mb-2">🎨 디테일컷 생성</h3>
                <p className="text-sm text-purple-800">
                    배경 이미지를 업로드하면, Step 1의 제품 이미지와 합성하여 자연스러운 디테일컷을 생성합니다.
                    <br />
                    생성된 이미지는 "상세페이지 반영" 버튼으로 미리보기에 추가할 수 있습니다.
                </p>
            </div>

            {/* 배경 이미지 업로드 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-display text-lg font-semibold">배경 이미지 업로드</h4>
                    <span className="text-xs text-gray-500">{backgroundImages.length}개</span>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleBackgroundUpload}
                        className="hidden"
                        id="background-upload"
                    />
                    <label htmlFor="background-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-sm font-medium text-gray-700 mb-1">배경 이미지를 업로드하세요</p>
                            <p className="text-xs text-gray-500">또는 클릭하여 파일 선택</p>
                        </div>
                    </label>
                </div>

                {backgroundImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-4">
                        {backgroundImages.map((img, idx) => (
                            <div key={idx} className="relative group">
                                <img
                                    src={img.previewUrl}
                                    alt={`Background ${idx + 1}`}
                                    className="w-full aspect-square object-cover rounded-lg"
                                />
                                <button
                                    onClick={() => removeBackgroundImage(idx)}
                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 생성 버튼 */}
            <button
                onClick={handleGenerate}
                disabled={isGenerating || backgroundImages.length === 0}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
                {isGenerating ? (
                    <>
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        생성 중...
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        디테일컷 생성
                    </>
                )}
            </button>

            {/* 에러 메시지 */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* 생성된 이미지 */}
            {generatedImages.length > 0 && (
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="font-display text-lg font-semibold mb-4">생성된 디테일컷 ({generatedImages.length}개)</h4>
                    <div className="grid grid-cols-2 gap-4">
                        {generatedImages.map((img, idx) => (
                            <div key={idx} className="relative group">
                                <img
                                    src={img.url}
                                    alt={`Generated ${idx + 1}`}
                                    className="w-full aspect-square object-cover rounded-lg border-2 border-gray-200"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <button
                                        onClick={() => handleAddToPreview(img.url)}
                                        className="bg-white text-purple-600 font-bold py-2 px-4 rounded-lg hover:bg-purple-50 transition-colors"
                                    >
                                        상세페이지 반영
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StepDetailCut;
