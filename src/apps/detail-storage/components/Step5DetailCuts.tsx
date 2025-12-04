import React, { useState } from 'react';
import { replaceShoesInImage } from '../services/geminiService';

interface UploadedImage {
    file: File;
    previewUrl: string;
    base64: string;
    mimeType: string;
}

interface Step5DetailCutsProps {
    productImages: UploadedImage[];
    onAddToPreview: (content: string, type: 'section' | 'image') => void;
}

const Step5DetailCuts: React.FC<Step5DetailCutsProps> = ({ productImages, onAddToPreview }) => {
    // ============================================================================
    // SHOE SWAP STATE
    // ============================================================================
    const [shoeModelImage, setShoeModelImage] = useState<UploadedImage | null>(null);
    const [shoeSwapResult, setShoeSwapResult] = useState<string | null>(null);
    const [isShoeSwapping, setIsShoeSwapping] = useState(false);

    const handleShoeModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setShoeModelImage({
                    file,
                    previewUrl: event.target?.result as string,
                    base64: (event.target?.result as string).split(',')[1],
                    mimeType: file.type
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleShoeSwap = async () => {
        if (!shoeModelImage || productImages.length === 0) {
            alert("모델 이미지와 제품 이미지가 필요합니다.");
            return;
        }
        setIsShoeSwapping(true);
        try {
            const result = await replaceShoesInImage(shoeModelImage.file, productImages.map(p => p.file));
            setShoeSwapResult(result);
        } catch (e) {
            console.error(e);
            alert("신발 교체에 실패했습니다.");
        } finally {
            setIsShoeSwapping(false);
        }
    };

    const downloadImage = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900">Content Cuts</h3>
                <p className="text-xs text-gray-500 mt-0.5">상세페이지 템플릿 섹션을 편집하고 추가하세요</p>
            </div>

            {/* AI Shoe Swap Section */}
            <div className="bg-white p-4 rounded-lg border-2 border-purple-100 space-y-4">
                <div className="flex items-center gap-2">
                    <span className="text-xl">👟</span>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">AI 신발 교체</h3>
                        <p className="text-xs text-gray-500">모델 사진의 신발을 제품으로 교체합니다</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* 1. Model Upload */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 cursor-pointer transition-colors relative h-48 flex flex-col items-center justify-center bg-gray-50">
                        <input type="file" accept="image/*" onChange={handleShoeModelUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        {shoeModelImage ? (
                            <img src={shoeModelImage.previewUrl} className="h-full object-contain rounded" />
                        ) : (
                            <>
                                <div className="text-2xl mb-1">📸</div>
                                <p className="text-xs font-medium text-gray-600">모델 사진 업로드</p>
                            </>
                        )}
                    </div>

                    {/* 2. Product Selection (Auto-use Step 1 images) */}
                    {productImages.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto py-2">
                            {productImages.map((img, idx) => (
                                <div key={idx} className="w-16 h-16 flex-shrink-0 rounded border border-gray-200 overflow-hidden">
                                    <img src={img.previewUrl} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 3. Generate Button */}
                    <button
                        onClick={handleShoeSwap}
                        disabled={!shoeModelImage || productImages.length === 0 || isShoeSwapping}
                        className="w-full py-3 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isShoeSwapping ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                교체 중...
                            </>
                        ) : (
                            <>✨ 신발 교체하기</>
                        )}
                    </button>

                    {/* 4. Result */}
                    {shoeSwapResult && (
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                            <p className="text-xs font-bold text-gray-900">결과 확인</p>
                            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden relative group">
                                <img src={shoeSwapResult} className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => onAddToPreview(shoeSwapResult, 'image')}
                                        className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded hover:bg-gray-100"
                                    >
                                        프리뷰 추가
                                    </button>
                                    <button
                                        onClick={() => downloadImage(shoeSwapResult, 'shoe-swap.png')}
                                        className="px-3 py-1.5 bg-gray-800 text-white text-xs font-bold rounded hover:bg-gray-700"
                                    >
                                        다운로드
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>


        </div>
    );
};

export default Step5DetailCuts;
