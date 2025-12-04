import React, { useState } from 'react';

interface Step3ProductCutsProps {
    uploadedImages: { previewUrl: string; file: File; base64: string; mimeType: string }[];
    onNext: () => void;
    onAddToPreview: (content: string, type: 'section' | 'image') => void;
}

const Step3ProductCuts: React.FC<Step3ProductCutsProps> = ({ uploadedImages, onNext, onAddToPreview }) => {
    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-bold text-gray-900">Product Cuts</h3>
                <p className="text-xs text-gray-500 mt-0.5">제품 이미지를 프리뷰에 추가하세요</p>
            </div>

            {uploadedImages.length > 0 ? (
                <div className="space-y-3">
                    <p className="text-xs text-gray-600">Step 1에서 업로드한 이미지 {uploadedImages.length}개</p>
                    <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                        {uploadedImages.map((img, idx) => (
                            <div
                                key={idx}
                                className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-black transition-all group"
                                onClick={() => onAddToPreview(img.previewUrl, 'image')}
                            >
                                <img src={img.previewUrl} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                                    <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100">+ 추가</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 text-center">이미지를 클릭하여 프리뷰에 추가</p>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-sm text-gray-500">업로드된 이미지 없음</p>
                    <p className="text-xs text-gray-400 mt-1">먼저 Step 1에서 이미지를 업로드해주세요</p>
                </div>
            )}
        </div>
    );
};

export default Step3ProductCuts;
