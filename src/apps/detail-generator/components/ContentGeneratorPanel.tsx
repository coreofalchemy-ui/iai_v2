/**
 * Content Generator Panel - AI 캠페인 이미지 생성 UI
 * 
 * 모델 이미지만 업로드하고, 제품 탭의 신발 이미지를 사용해서 합성
 */

import React, { useState, useRef, DragEvent } from 'react';
import {
    prepareImageForAi,
    fileToBase64,
    generateCampaignImage,
    ColorSettings
} from '../services/contentGeneratorService';

interface ContentGeneratorPanelProps {
    productImages?: string[]; // 제품 탭에서 전달받은 신발 이미지들
    onImageGenerated?: (imageUrl: string) => void;
    onAddToPreview?: (imageUrl: string, sectionType: string) => void;
}

// 색상 프리셋 옵션
const COLOR_OPTIONS = {
    outer: ['', 'Navy', 'Black', 'Beige', 'Gray', 'Brown', 'White', 'Camel', 'Olive'],
    inner: ['', 'White', 'Black', 'Cream', 'Light Blue', 'Pink', 'Gray', 'Striped'],
    pants: ['', 'Black', 'Navy', 'Gray', 'Brown', 'Beige', 'White', 'Denim Blue'],
    socks: ['', 'White', 'Black', 'Gray', 'Beige', 'Navy']
};

export default function ContentGeneratorPanel({
    productImages = [],
    onImageGenerated,
    onAddToPreview
}: ContentGeneratorPanelProps) {
    // 모델 이미지 상태
    const [sourceImage, setSourceImage] = useState<File | null>(null);
    const [sourcePreview, setSourcePreview] = useState<string>('');
    const [sourceDragActive, setSourceDragActive] = useState(false);

    // 색상 설정
    const [colorSettings, setColorSettings] = useState<ColorSettings>({
        outer: '',
        inner: '',
        pants: '',
        socks: ''
    });

    // 생성 상태
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultImage, setResultImage] = useState<string>('');
    const [error, setError] = useState<string>('');

    const sourceInputRef = useRef<HTMLInputElement>(null);

    // 파일 처리 함수
    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('image/')) return;
        setSourceImage(file);
        setSourcePreview(URL.createObjectURL(file));
    };

    const handleSourceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    // 드래그 이벤트 핸들러
    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSourceDragActive(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSourceDragActive(false);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSourceDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    };

    // 색상 변경
    const handleColorChange = (key: keyof ColorSettings, value: string) => {
        setColorSettings(prev => ({ ...prev, [key]: value }));
    };

    // URL을 Base64로 변환
    const urlToBase64 = async (url: string): Promise<string> => {
        if (url.startsWith('data:')) {
            return url.split('base64,')[1] || url;
        }
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split('base64,')[1] || result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    // AI 이미지 생성
    const handleGenerate = async () => {
        if (!sourceImage) {
            setError('모델 이미지를 업로드해주세요.');
            return;
        }
        if (productImages.length === 0) {
            setError('제품 탭에서 신발 이미지를 먼저 업로드해주세요.');
            return;
        }

        setIsGenerating(true);
        setError('');
        setResultImage('');

        try {
            // 1. 모델 이미지 전처리 (1:1 + 검은색 패딩)
            const sourceBase64 = await prepareImageForAi(sourceImage);

            // 2. 제품 이미지들 Base64 변환
            const productBase64s = await Promise.all(
                productImages.map(url => urlToBase64(url))
            );

            // 3. 색상 설정
            const activeColors: ColorSettings = {};
            if (colorSettings.outer) activeColors.outer = colorSettings.outer;
            if (colorSettings.inner) activeColors.inner = colorSettings.inner;
            if (colorSettings.pants) activeColors.pants = colorSettings.pants;
            if (colorSettings.socks) activeColors.socks = colorSettings.socks;

            // 4. AI 생성 (고정밀 신발 분석 + 합성)
            const result = await generateCampaignImage(
                sourceBase64,
                productBase64s,
                Object.keys(activeColors).length > 0 ? activeColors : undefined
            );

            if (result.success && result.imageBase64) {
                const imageUrl = `data:image/jpeg;base64,${result.imageBase64}`;
                setResultImage(imageUrl);
                onImageGenerated?.(imageUrl);
                if (onAddToPreview) {
                    onAddToPreview(imageUrl, 'campaign');
                }
            } else {
                setError(result.error || '생성 실패');
            }
        } catch (err: any) {
            setError(err.message || '오류 발생');
        } finally {
            setIsGenerating(false);
        }
    };

    // 결과 다운로드
    const handleDownload = () => {
        if (!resultImage) return;
        const a = document.createElement('a');
        a.href = resultImage;
        a.download = `campaign_${Date.now()}.jpg`;
        a.click();
    };

    return (
        <div className="space-y-3">
            {/* 모델 이미지 업로드 - 정사각형, 드래그 앤 드롭 */}
            <div
                className={`aspect-square border-2 border-dashed rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center
                    ${sourceDragActive
                        ? 'border-purple-500 bg-purple-50 scale-[1.02]'
                        : 'border-gray-300 hover:border-purple-400'}`}
                onClick={() => sourceInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    ref={sourceInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSourceInputChange}
                    className="hidden"
                />
                <span className="text-3xl mb-2">👤</span>
                <span className="text-sm font-bold text-gray-700">모델 이미지</span>
                <span className="text-xs text-gray-400">클릭 또는 드래그 앤 드롭</span>
                {sourcePreview && <span className="text-green-500 text-sm mt-2">✓ 업로드됨</span>}
            </div>

            {/* 제품 탭 이미지 현황 */}
            <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs font-bold text-blue-700 mb-2">
                    👟 제품 이미지 ({productImages.length}장)
                </div>
                {productImages.length > 0 ? (
                    <div className="flex gap-1 flex-wrap">
                        {productImages.slice(0, 4).map((url, i) => (
                            <img
                                key={i}
                                src={url}
                                alt={`제품 ${i + 1}`}
                                className="w-12 h-12 object-cover rounded border"
                            />
                        ))}
                        {productImages.length > 4 && (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                +{productImages.length - 4}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-xs text-blue-600">
                        📦 제품 탭에서 신발 이미지를 먼저 업로드하세요
                    </div>
                )}
            </div>



            {/* 생성 버튼 */}
            <button
                onClick={handleGenerate}
                disabled={isGenerating || !sourceImage || productImages.length === 0}
                className={`w-full py-3 rounded-lg font-bold text-white transition-all ${isGenerating || !sourceImage || productImages.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                    }`}
            >
                {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        AI 신발 합성 중...
                    </span>
                ) : (
                    '✨ 신발 교체 이미지 생성'
                )}
            </button>

            {/* 업로드된 모델 이미지 미리보기 */}
            {sourcePreview && (
                <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-bold text-gray-700 mb-2">📷 업로드된 모델</div>
                    <img src={sourcePreview} alt="모델" className="w-full aspect-square object-cover rounded-lg border" />
                </div>
            )}

            {/* 에러 표시 */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-2 rounded-lg">
                    ⚠️ {error}
                </div>
            )}

            {/* 결과 이미지 */}
            {resultImage && (
                <div className="bg-white border rounded-xl p-3 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-700">🖼️ 생성 결과</span>
                        <button
                            onClick={handleDownload}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                            📥 다운로드
                        </button>
                    </div>
                    <img
                        src={resultImage}
                        alt="Generated"
                        className="w-full rounded-lg border"
                    />
                </div>
            )}
        </div>
    );
}
