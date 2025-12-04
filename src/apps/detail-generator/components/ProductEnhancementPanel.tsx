import React, { useState, useEffect } from 'react';
import { ProductEffect, ProductEnhancementResult, applyProductEffect, beautifyPoses } from '../services/productEnhancement';

interface ProductEnhancementPanelProps {
    productFiles: File[];
    onResultsUpdate: (results: ProductEnhancementResult[]) => void;
    onAddSectionWithImage?: (imageUrl: string, sectionName?: string) => void;
}

const effects: { id: ProductEffect; name: string; emoji: string; fixed?: number }[] = [
    { id: 'beautify', name: '미화 (누끼)', emoji: '✨', fixed: 6 },
    { id: 'studio_minimal_prop', name: '미니멀 소품', emoji: '🎨' },
    { id: 'studio_natural_floor', name: '자연광', emoji: '☀️' },
    { id: 'studio_texture_emphasis', name: '텍스처 강조', emoji: '🔍' },
    { id: 'studio_cinematic', name: '시네마틱', emoji: '🎬' },
];

export default function ProductEnhancementPanel({
    productFiles,
    onResultsUpdate,
    onAddSectionWithImage
}: ProductEnhancementPanelProps) {
    const [selectedEffect, setSelectedEffect] = useState<ProductEffect>('beautify');
    const [results, setResults] = useState<ProductEnhancementResult[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // 결과가 완료되면 프리뷰에 섹션 추가
    useEffect(() => {
        if (onAddSectionWithImage) {
            results.forEach(result => {
                if (result.status === 'done' && result.url && !result.addedToPreview) {
                    onAddSectionWithImage(result.url, result.poseInfo?.name || result.effect);
                    // Mark as added
                    setResults(prev => prev.map(r =>
                        r.id === result.id ? { ...r, addedToPreview: true } : r
                    ));
                }
            });
        }
    }, [results, onAddSectionWithImage]);

    const handleGenerate = async () => {
        if (productFiles.length === 0) return;

        setIsProcessing(true);
        const newResults: ProductEnhancementResult[] = [];

        if (selectedEffect === 'beautify') {
            // 미화: 6장 생성 (6가지 포즈)
            const primaryFile = productFiles[0];
            beautifyPoses.forEach(pose => {
                newResults.push({
                    id: `${primaryFile.name}-${pose.id}-${Date.now()}-${Math.random()}`,
                    originalFileName: primaryFile.name,
                    status: 'loading',
                    effect: 'beautify',
                    poseInfo: pose,
                    processingStep: '대기 중...'
                });
            });
        } else {
            // 나머지 효과: 업로드한 제품 수만큼
            productFiles.forEach((file, idx) => {
                newResults.push({
                    id: `${file.name}-${selectedEffect}-${Date.now()}-${idx}`,
                    originalFileName: file.name,
                    status: 'loading',
                    effect: selectedEffect,
                    processingStep: '대기 중...'
                });
            });
        }

        setResults(newResults);
        onResultsUpdate(newResults);

        // 순차 생성
        for (const result of newResults) {
            try {
                const onProgress = (msg: string) => {
                    setResults(prev => prev.map(r =>
                        r.id === result.id ? { ...r, processingStep: msg } : r
                    ));
                };

                const filesToProcess = result.effect === 'beautify' ? productFiles : [productFiles.find(f => f.name === result.originalFileName)!];
                const url = await applyProductEffect(
                    filesToProcess,
                    result.effect,
                    onProgress,
                    result.poseInfo?.id
                );

                const updatedResult = { ...result, status: 'done' as const, url, processingStep: '완료' };
                setResults(prev => {
                    const newResults = prev.map(r => r.id === result.id ? updatedResult : r);
                    onResultsUpdate(newResults);
                    return newResults;
                });
            } catch (error: any) {
                setResults(prev => {
                    const newResults = prev.map(r =>
                        r.id === result.id ? { ...r, status: 'error' as const, error: error.message, processingStep: '실패' } : r
                    );
                    onResultsUpdate(newResults);
                    return newResults;
                });
            }
        }

        setIsProcessing(false);
    };

    const getGenerationCount = () => {
        if (selectedEffect === 'beautify') return 6;
        return productFiles.length;
    };

    return (
        <div className="space-y-6">
            {/* 업로드된 제품 썸네일 */}
            <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3">업로드된 제품 ({productFiles.length}장)</h3>
                {productFiles.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed">
                        <div className="text-4xl mb-2">📦</div>
                        <p className="text-sm">시작 화면에서 제품 이미지를 업로드해주세요</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2">
                        {productFiles.map((file, i) => (
                            <div key={i} className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-white">
                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt={file.name} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 효과 선택 */}
            <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3">효과 선택</h3>
                <div className="space-y-2">
                    {effects.map(effect => (
                        <button
                            key={effect.id}
                            onClick={() => setSelectedEffect(effect.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-between ${selectedEffect === effect.id
                                ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <span>
                                <span className="mr-2">{effect.emoji}</span>
                                {effect.name}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${selectedEffect === effect.id ? 'bg-blue-500' : 'bg-gray-200 text-gray-600'}`}>
                                {effect.fixed ? `${effect.fixed}장 고정` : `${productFiles.length}장`}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 생성 버튼 */}
            <button
                onClick={handleGenerate}
                disabled={isProcessing || productFiles.length === 0}
                className="w-full bg-green-600 text-white font-bold py-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
                {isProcessing ? '생성 중...' : `${getGenerationCount()}장 생성하기`}
            </button>

            {/* 결과 미리보기 */}
            {results.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">
                        생성 결과 ({results.filter(r => r.status === 'done').length}/{results.length})
                        <span className="text-xs font-normal text-gray-500 ml-2">
                            완료된 이미지는 프리뷰에 자동 추가됩니다
                        </span>
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {results.map(result => (
                            <div key={result.id} className="bg-white border-2 border-gray-200 rounded-lg p-3">
                                {result.poseInfo && (
                                    <div className="text-xs font-bold text-gray-600 mb-2">{result.poseInfo.name}</div>
                                )}
                                {result.status === 'loading' && (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                        <span className="text-sm text-blue-600">{result.processingStep}</span>
                                    </div>
                                )}
                                {result.status === 'done' && result.url && (
                                    <div className="relative">
                                        <img src={result.url} className="w-full rounded" alt="Result" />
                                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                            ✓ 프리뷰 추가됨
                                        </div>
                                    </div>
                                )}
                                {result.status === 'error' && (
                                    <div className="text-sm text-red-600">오류: {result.error}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
