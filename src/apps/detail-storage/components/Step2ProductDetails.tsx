import React, { useState } from 'react';
import { UploadedImage } from '../DetailStorageApp';
import { applyShoeEffect, applyColorChange, Effect } from '../services/geminiService';

export interface ResultItem {
    id: string;
    originalFile: File;
    processedImage?: string;
    status: 'loading' | 'success' | 'error';
    error?: string;
    processingStep?: string;
    effect: Effect;
    isSelected: boolean;
    poseInfo?: { id: string; label: string };
}

interface Step2ProductDetailsProps {
    uploadedImages: UploadedImage[];
    results: ResultItem[];
    setResults: React.Dispatch<React.SetStateAction<ResultItem[]>>;
    onNext: () => void;
    onAddToPreview?: (content: string, type: 'section' | 'image') => void;
    onMoveAllToStaging?: () => void;
}

const EFFECTS: { id: Effect; label: string; icon: string; desc: string }[] = [
    { id: 'beautify', label: 'Beautify Pack', icon: '✨', desc: '상품의 6가지 각도를 자동으로 생성합니다' },
    { id: 'studio_minimal_prop', label: 'Minimal', icon: '⬜', desc: '미니멀한 소품과 부드러운 조명의 스튜디오' },
    { id: 'studio_natural_floor', label: 'Natural', icon: '🌿', desc: '자연광과 질감있는 바닥의 따뜻한 연출' },
    { id: 'studio_texture_emphasis', label: 'Detail Focus', icon: '🔍', desc: '제품 디테일을 강조하는 다크톤 배경' },
    { id: 'studio_cinematic', label: 'Cinematic', icon: '🎬', desc: '드라마틱한 조명과 공중부양 효과' },
    { id: 'custom', label: 'Custom BG', icon: '🖼️', desc: '원하는 배경 이미지를 직접 업로드' },
];

const BEAUTIFY_POSES = [
    { id: 'left_profile_single', label: '좌측 프로필 (단품)' },
    { id: 'left_diagonal_single', label: '좌측 대각 (단품)' },
    { id: 'front_apart_pair', label: '정면 뷰 (양발)' },
    { id: 'rear_pair', label: '후면 뷰 (양발)' },
    { id: 'top_down_instep_pair', label: '탑다운 (양발)' },
    { id: 'left_diagonal_pair', label: '대각 뷰 (양발)' },
];

const Step2ProductDetails: React.FC<Step2ProductDetailsProps> = ({
    uploadedImages,
    results,
    setResults,
    onNext,
    onAddToPreview,
    onMoveAllToStaging
}) => {
    const [selectedEffect, setSelectedEffect] = useState<Effect>('beautify');
    const [customBackground, setCustomBackground] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCustomBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCustomBackground(e.target.files[0]);
        }
    };

    const handleGenerate = async () => {
        if (uploadedImages.length === 0) {
            alert('먼저 Step 1에서 이미지를 업로드해주세요.');
            return;
        }

        setIsProcessing(true);
        const newResults: ResultItem[] = [];
        const timestamp = Date.now();

        if (selectedEffect === 'beautify') {
            // Beautify Pack Logic: Move existing items to staging first
            if (onMoveAllToStaging) {
                onMoveAllToStaging();
            }

            const primaryFile = uploadedImages[0].file;
            if (primaryFile) {
                BEAUTIFY_POSES.forEach(pose => {
                    newResults.push({
                        id: `${primaryFile.name}-beautify-${pose.id}-${timestamp}`,
                        originalFile: primaryFile,
                        status: 'loading',
                        processingStep: '대기중...',
                        effect: 'beautify',
                        isSelected: true,
                        poseInfo: pose,
                    });
                });
            }
        } else {
            uploadedImages.forEach(img => {
                newResults.push({
                    id: `${img.file.name}-${selectedEffect}-${timestamp}`,
                    originalFile: img.file,
                    status: 'loading',
                    processingStep: '대기중...',
                    effect: selectedEffect,
                    isSelected: true,
                });
            });
        }

        setResults(prev => [...newResults, ...prev]);

        const processItem = async (item: ResultItem) => {
            try {
                setResults(prev => prev.map(r => r.id === item.id ? { ...r, processingStep: 'AI 처리 시작...' } : r));

                const generatedImageBase64 = await applyShoeEffect(
                    [item.originalFile],
                    item.effect,
                    (msg) => setResults(prev => prev.map(r => r.id === item.id ? { ...r, processingStep: msg } : r)),
                    customBackground,
                    item.poseInfo?.id
                );

                setResults(prev => prev.map(r => r.id === item.id ? {
                    ...r,
                    status: 'success',
                    processedImage: generatedImageBase64,
                    processingStep: '완료'
                } : r));

                if (onAddToPreview && generatedImageBase64) {
                    onAddToPreview(generatedImageBase64, 'image');
                }

            } catch (error: any) {
                console.error("생성 실패:", error);
                setResults(prev => prev.map(r => r.id === item.id ? {
                    ...r,
                    status: 'error',
                    error: error.message || '알 수 없는 오류',
                    processingStep: '실패'
                } : r));
            }
        };

        await Promise.all(newResults.map(processItem));
        setIsProcessing(false);
    };

    const toggleSelection = (id: string) => {
        setResults(prev => prev.map(r => r.id === id ? { ...r, isSelected: !r.isSelected } : r));
    };

    const deleteResult = (id: string) => {
        if (confirm('이미지를 삭제하시겠습니까?')) {
            setResults(prev => prev.filter(r => r.id !== id));
        }
    };

    const downloadImage = (base64: string, filename: string) => {
        const link = document.createElement('a');
        link.href = base64;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadSelected = () => {
        const selected = results.filter(r => r.isSelected && r.status === 'success');
        if (selected.length === 0) {
            alert('다운로드할 이미지를 선택해주세요.');
            return;
        }
        selected.forEach(item => {
            if (item.processedImage) {
                downloadImage(item.processedImage, `product-${item.id}.png`);
            }
        });
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div>
                <h3 className="text-lg font-bold text-gray-900">Product Enhancement</h3>
                <p className="text-xs text-gray-500 mt-0.5">상품 이미지를 AI로 보정하고 다양한 각도를 생성합니다</p>
            </div>

            {/* Effect Selector - 세로 나열 */}
            <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">스타일 선택</h4>
                <div className="space-y-2">
                    {EFFECTS.map(effect => (
                        <button
                            key={effect.id}
                            onClick={() => setSelectedEffect(effect.id)}
                            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${selectedEffect === effect.id
                                ? 'border-black bg-black text-white'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="text-2xl flex-shrink-0">{effect.icon}</div>
                                <div className="flex-1">
                                    <div className="font-bold text-sm mb-1">{effect.label}</div>
                                    <div className={`text-xs leading-relaxed ${selectedEffect === effect.id ? 'opacity-90' : 'opacity-60'}`}>
                                        {effect.desc}
                                    </div>
                                </div>
                                {selectedEffect === effect.id && (
                                    <div className="flex-shrink-0">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Background Upload */}
            {selectedEffect === 'custom' && (
                <div className="space-y-2">
                    <label className="block">
                        <span className="text-xs font-medium text-gray-700">배경 이미지 업로드</span>
                        <input
                            type="file"
                            onChange={handleCustomBackgroundUpload}
                            accept="image/*"
                            className="mt-1 block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                        />
                    </label>
                    {customBackground && <p className="text-xs text-green-600">✓ {customBackground.name}</p>}
                </div>
            )}

            {/* Generate Button */}
            <button
                onClick={handleGenerate}
                disabled={isProcessing || uploadedImages.length === 0}
                className="w-full px-4 py-3 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isProcessing ? '생성 중...' : `이미지 생성 (${uploadedImages.length}장)`}
            </button>

            {/* Results */}
            {results.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                    <div className="flex justify-between items-center">
                        <h4 className="text-sm font-semibold text-gray-900">생성된 이미지 ({results.length}개)</h4>
                        <button
                            onClick={handleDownloadSelected}
                            disabled={results.filter(r => r.isSelected && r.status === 'success').length === 0}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            선택 다운로드
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                        {results.map((item) => (
                            <div
                                key={item.id}
                                className={`relative group bg-white rounded-lg overflow-hidden border-2 transition-all ${item.isSelected ? 'border-black' : 'border-gray-200'
                                    }`}
                            >
                                <div className="aspect-square relative bg-gray-50 flex items-center justify-center">
                                    {item.status === 'loading' ? (
                                        <div className="text-center p-4">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-2"></div>
                                            <p className="text-xs text-gray-500">{item.processingStep}</p>
                                        </div>
                                    ) : item.status === 'error' ? (
                                        <div className="text-center p-4 text-red-500">
                                            <div className="text-2xl mb-1">⚠️</div>
                                            <p className="text-xs font-bold">생성 실패</p>
                                            <p className="text-xs mt-1 opacity-70">{item.error}</p>
                                        </div>
                                    ) : (
                                        <img
                                            src={item.processedImage}
                                            alt="Result"
                                            className="w-full h-full object-cover"
                                        />
                                    )}

                                    {/* Selection Checkbox */}
                                    <label className="absolute top-2 left-2 flex items-center gap-1 bg-white bg-opacity-90 px-2 py-1 rounded shadow cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={item.isSelected}
                                            onChange={() => toggleSelection(item.id)}
                                            className="w-3 h-3"
                                        />
                                    </label>

                                    {/* Delete Button */}
                                    {item.status === 'success' && (
                                        <button
                                            onClick={() => deleteResult(item.id)}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Download on hover */}
                                    {item.status === 'success' && (
                                        <button
                                            onClick={() => downloadImage(item.processedImage!, `product-${item.id}.png`)}
                                            className="absolute bottom-2 right-2 p-1.5 bg-black bg-opacity-70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-2 bg-gray-50 border-t border-gray-200">
                                    <p className="text-xs font-medium text-gray-900 truncate">{item.effect.replace(/_/g, ' ')}</p>
                                    {item.poseInfo && (
                                        <p className="text-xs text-gray-500 truncate">{item.poseInfo.label}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Step2ProductDetails;
