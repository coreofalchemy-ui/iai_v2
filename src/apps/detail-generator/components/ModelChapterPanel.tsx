import React, { useState, useRef } from 'react';
import { generateFaceBatch, upscaleFace, batchFaceReplacement } from '../services/geminiService';
import { SparklesIcon, DownloadIcon, Loader2Icon, MoveHorizontalIcon, CheckIcon, UploadCloudIcon } from '../components/icons';

interface ModelChapterPanelProps {
    data: any;
    onUpdate: (newData: any) => void;
}

export default function ModelChapterPanel({ data, onUpdate }: ModelChapterPanelProps) {
    // Reference Face Upload State (최대 5장)
    const [referenceFaces, setReferenceFaces] = useState<Array<{ file: File; preview: string }>>([]);

    // Face Generator State
    const [gender, setGender] = useState<'male' | 'female'>('female');
    const [race, setRace] = useState('한국인');
    const [age, setAge] = useState('23');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedFaces, setGeneratedFaces] = useState<string[]>([]);
    const [selectedFace, setSelectedFace] = useState<string | null>(null);
    const [upscaledFace, setUpscaledFace] = useState<string | null>(null);
    const [isUpscaling, setIsUpscaling] = useState(false);
    const [compareSlider, setCompareSlider] = useState(50);
    const sliderRef = useRef<HTMLDivElement>(null);

    // 전체 얼굴 교체 상태
    const [isReplacingAllFaces, setIsReplacingAllFaces] = useState(false);
    const [replaceProgress, setReplaceProgress] = useState({ current: 0, total: 0 });

    // Handlers for Reference Face Upload
    const handleReferenceFaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).slice(0, 5 - referenceFaces.length);
            const newFaces = newFiles.map(file => {
                const reader = new FileReader();
                return new Promise<{ file: File; preview: string }>((resolve) => {
                    reader.onload = (e) => {
                        resolve({ file, preview: e.target?.result as string });
                    };
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(newFaces).then(faces => {
                setReferenceFaces(prev => [...prev, ...faces]);
            });
        }
    };

    const removeReferenceFace = (index: number) => {
        setReferenceFaces(prev => prev.filter((_, i) => i !== index));
    };

    // Handlers for Face Generator
    const handleGenerate = async () => {
        setIsGenerating(true);
        setGeneratedFaces([]);
        setSelectedFace(null);
        setUpscaledFace(null);
        try {
            console.log('🖱️ Generate button clicked. Calling generateFaceBatch...');
            const faces = await generateFaceBatch(gender, race, age, referenceFaces.map(f => f.preview));
            console.log('✅ generateFaceBatch returned:', faces);
            setGeneratedFaces(faces);
        } catch (e) {
            console.error('❌ Error in handleGenerate:', e);
            alert('얼굴 생성 실패: ' + e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSelectFace = async (faceUrl: string) => {
        setSelectedFace(faceUrl);
        setUpscaledFace(null);
    };

    const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!sliderRef.current) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        setCompareSlider((x / rect.width) * 100);
    };

    // 프리뷰 전체 얼굴 교체
    const handleApplyFaceToAllPreview = async () => {
        if (!selectedFace) {
            alert('먼저 얼굴을 선택하세요.');
            return;
        }

        // 프리뷰에서 모델 이미지 URL들 수집
        const allImageUrls: string[] = [];
        const imageUrls = data.imageUrls || {};

        // modelShots 수집
        if (imageUrls.modelShots && Array.isArray(imageUrls.modelShots)) {
            allImageUrls.push(...imageUrls.modelShots.filter((url: string) => url && url.startsWith('data:')));
        }

        // 개별 모델 이미지 수집
        Object.entries(imageUrls).forEach(([key, value]) => {
            if (key.startsWith('model') && typeof value === 'string' && value.startsWith('data:')) {
                if (!allImageUrls.includes(value)) {
                    allImageUrls.push(value);
                }
            }
        });

        if (allImageUrls.length === 0) {
            alert('프리뷰에 모델 이미지가 없습니다.');
            return;
        }

        setIsReplacingAllFaces(true);
        setReplaceProgress({ current: 0, total: allImageUrls.length });

        try {
            const results = await batchFaceReplacement(
                allImageUrls,
                selectedFace,
                (current, total) => setReplaceProgress({ current, total })
            );

            // 결과 반영
            const newImageUrls = { ...imageUrls };
            let successCount = 0;

            results.forEach((result) => {
                if (result.result) {
                    // modelShots 배열 업데이트
                    if (newImageUrls.modelShots && Array.isArray(newImageUrls.modelShots)) {
                        const idx = newImageUrls.modelShots.indexOf(result.original);
                        if (idx !== -1) {
                            newImageUrls.modelShots[idx] = result.result;
                            successCount++;
                        }
                    }

                    // 개별 키 업데이트
                    Object.entries(newImageUrls).forEach(([key, value]) => {
                        if (value === result.original) {
                            newImageUrls[key] = result.result;
                            successCount++;
                        }
                    });
                }
            });

            if (successCount > 0) {
                onUpdate({ ...data, imageUrls: newImageUrls });
                alert(`✅ ${successCount}개 이미지의 얼굴이 교체되었습니다!`);
            } else {
                alert('얼굴 교체에 실패했습니다. 콘솔을 확인하세요.');
            }
        } catch (error) {
            console.error('전체 얼굴 교체 오류:', error);
            alert('얼굴 교체 중 오류가 발생했습니다.');
        } finally {
            setIsReplacingAllFaces(false);
            setReplaceProgress({ current: 0, total: 0 });
        }
    };

    return (
        <div className="space-y-6">
            {/* 1. Reference Face Upload */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-3 text-purple-900 flex items-center gap-2">
                    <UploadCloudIcon className="w-5 h-5" /> 레퍼런스 페이스 업로드
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                    원하는 얼굴 사진을 최대 5장까지 업로드하세요. AI가 이를 참고하여 믹스된 새로운 얼굴을 생성합니다.
                </p>

                {/* 업로드된 얼굴들 */}
                {referenceFaces.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 mb-3">
                        {referenceFaces.map((face, idx) => (
                            <div key={idx} className="relative aspect-square">
                                <img src={face.preview} alt={`Face ${idx}`} className="w-full h-full object-cover rounded border-2 border-purple-300" />
                                <button
                                    onClick={() => removeReferenceFace(idx)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full shadow hover:bg-red-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* 업로드 버튼 */}
                {referenceFaces.length < 5 && (
                    <div className="relative border-2 border-dashed border-purple-300 rounded-lg p-4 hover:bg-purple-100 transition-colors text-center cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleReferenceFaceUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center py-4 text-purple-400">
                            <UploadCloudIcon className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">클릭하여 얼굴 이미지 업로드</span>
                            <span className="text-xs text-gray-500 mt-1">({referenceFaces.length}/5)</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. AI Face Studio */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 text-white shadow-xl">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-700 pb-3">
                    <SparklesIcon className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-bold text-lg">AI Face Studio</h3>
                    <span className="ml-auto text-xs text-gray-400">K-POP 비주얼</span>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="bg-gray-700 border-none rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="female">여성</option>
                        <option value="male">남성</option>
                    </select>
                    <select
                        value={race}
                        onChange={(e) => setRace(e.target.value)}
                        className="bg-gray-700 border-none rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="한국인">한국인</option>
                        <option value="백인">백인</option>
                        <option value="동아시아인">동아시아인</option>
                        <option value="혼혈">혼혈</option>
                    </select>
                    <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="나이"
                        className="bg-gray-700 border-none rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${isGenerating
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-lg hover:shadow-pink-500/30'
                        }`}
                >
                    {isGenerating ? (
                        <><Loader2Icon className="w-4 h-4 animate-spin" /> K-POP 비주얼 얼굴 생성 중...</>
                    ) : (
                        <><SparklesIcon className="w-4 h-4" /> ✨ K-POP 비주얼 얼굴 5명 생성</>
                    )}
                </button>

                {/* ===== 대형 그리드 뷰 (사용자 요청) ===== */}
                {generatedFaces.length > 0 && (
                    <div className="mt-6 space-y-4">
                        <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                            <span className="text-pink-400">🎭</span> 생성된 얼굴 선택
                        </h4>

                        {/* 2x3 대형 그리드 */}
                        <div className="grid grid-cols-2 gap-4">
                            {generatedFaces.map((face, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleSelectFace(face)}
                                    className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-4 transition-all transform hover:scale-[1.02] ${selectedFace === face
                                            ? 'border-pink-500 ring-4 ring-pink-500/30 shadow-xl shadow-pink-500/20'
                                            : 'border-gray-600 hover:border-gray-400'
                                        }`}
                                >
                                    <img src={face} alt={`Face ${idx + 1}`} className="w-full h-full object-cover" />

                                    {/* 선택 표시 */}
                                    {selectedFace === face && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-pink-600/60 to-transparent flex items-end justify-center pb-4">
                                            <div className="bg-pink-500 text-white px-4 py-2 rounded-full flex items-center gap-2 font-bold text-sm shadow-lg">
                                                <CheckIcon className="w-4 h-4" /> 선택됨
                                            </div>
                                        </div>
                                    )}

                                    {/* 번호 표시 */}
                                    <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded-lg text-xs font-bold">
                                        #{idx + 1}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ===== 선택된 얼굴 미리보기 및 프리뷰 전체 적용 버튼 ===== */}
                        {selectedFace && (
                            <div className="mt-6 bg-gradient-to-r from-pink-900/50 to-purple-900/50 border border-pink-500/30 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="flex items-center gap-4">
                                    {/* 선택된 얼굴 미리보기 */}
                                    <div className="relative flex-shrink-0">
                                        <img
                                            src={selectedFace}
                                            alt="Selected Face"
                                            className="w-20 h-20 rounded-full object-cover border-4 border-pink-500 shadow-xl"
                                        />
                                        <div className="absolute -bottom-1 -right-1 bg-pink-500 text-white rounded-full p-1">
                                            <CheckIcon className="w-3 h-3" />
                                        </div>
                                    </div>

                                    {/* 정보 및 버튼 */}
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-lg font-bold text-white mb-1">Identity Locked 🔒</h5>
                                        <p className="text-xs text-gray-300 mb-3">
                                            이 얼굴로 프리뷰의 모든 모델 이미지를 교체합니다.
                                        </p>

                                        {/* 프리뷰 전체 얼굴 교체 버튼 */}
                                        <button
                                            onClick={handleApplyFaceToAllPreview}
                                            disabled={isReplacingAllFaces}
                                            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${isReplacingAllFaces
                                                    ? 'bg-gray-600 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-500 hover:to-orange-400 shadow-lg hover:shadow-orange-500/30'
                                                }`}
                                        >
                                            {isReplacingAllFaces ? (
                                                <>
                                                    <Loader2Icon className="w-4 h-4 animate-spin" />
                                                    얼굴 교체 중... ({replaceProgress.current}/{replaceProgress.total})
                                                </>
                                            ) : (
                                                <>🪄 이 얼굴로 프리뷰 전체 변경</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4K 업스케일 옵션 (선택적) */}
                        {selectedFace && (
                            <div className="flex gap-2 mt-4">
                                {!upscaledFace && !isUpscaling && (
                                    <button
                                        onClick={async () => {
                                            if (!selectedFace) return;
                                            setIsUpscaling(true);
                                            try {
                                                const upscaled = await upscaleFace(selectedFace);
                                                setUpscaledFace(upscaled);
                                            } catch (e) {
                                                console.error(e);
                                                alert('업스케일링 실패');
                                            } finally {
                                                setIsUpscaling(false);
                                            }
                                        }}
                                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2"
                                    >
                                        <SparklesIcon className="w-3 h-3" />
                                        4K 업스케일링
                                    </button>
                                )}

                                <button
                                    onClick={async () => {
                                        const targetUrl = upscaledFace || selectedFace;
                                        if (!targetUrl) return;

                                        const res = await fetch(targetUrl);
                                        const blob = await res.blob();
                                        const file = new File([blob], `generated_face_${Date.now()}.png`, { type: 'image/png' });

                                        const currentModelFiles = data.modelFiles || [];
                                        const newFileUrl = URL.createObjectURL(file);

                                        onUpdate({
                                            ...data,
                                            modelFiles: [...currentModelFiles, file],
                                            imageUrls: {
                                                ...data.imageUrls,
                                                modelShots: [...(data.imageUrls?.modelShots || []), newFileUrl]
                                            }
                                        });

                                        alert('모델 리스트에 추가되었습니다!');
                                    }}
                                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold text-xs shadow-lg hover:shadow-green-500/30 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckIcon className="w-3 h-3" />
                                    모델 리스트에 추가
                                </button>
                            </div>
                        )}

                        {/* 업스케일 비교 슬라이더 */}
                        {upscaledFace && (
                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                                    4K 업스케일 비교
                                </h4>
                                <div
                                    ref={sliderRef}
                                    className="relative w-full aspect-square rounded-lg overflow-hidden cursor-col-resize touch-none select-none shadow-2xl"
                                    onMouseMove={handleSliderMove}
                                    onTouchMove={handleSliderMove}
                                >
                                    <img src={selectedFace} className="absolute inset-0 w-full h-full object-cover" alt="Original" />
                                    <div
                                        className="absolute inset-0 w-full h-full overflow-hidden border-r-2 border-white/80 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                                        style={{ width: `${compareSlider}%` }}
                                    >
                                        <img src={upscaledFace} className="absolute top-0 left-0 max-w-none h-full w-[100%] object-cover" style={{ width: sliderRef.current?.offsetWidth }} alt="Upscaled" />
                                    </div>
                                    <div
                                        className="absolute top-0 bottom-0 w-1 bg-white/0 z-10 flex items-center justify-center pointer-events-none"
                                        style={{ left: `${compareSlider}%` }}
                                    >
                                        <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center transform -translate-x-1/2">
                                            <MoveHorizontalIcon className="w-5 h-5 text-gray-800" />
                                        </div>
                                    </div>
                                    <div className="absolute top-3 left-3 bg-black/50 backdrop-blur px-2 py-1 rounded text-[10px] font-bold border border-white/10">4K UPSCALE</div>
                                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur px-2 py-1 rounded text-[10px] font-bold border border-white/10">ORIGINAL</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
