import React, { useState } from 'react';

interface ModelShot {
    id: string;
    file: File;
    stylingText: string;
}

interface DetailShot {
    id: string;
    file: File;
    caption: string;
}

const Step3ModelShots: React.FC = () => {
    const [modelShots, setModelShots] = useState<ModelShot[]>([]);
    const [detailShots, setDetailShots] = useState<DetailShot[]>([]);
    const [faceImages, setFaceImages] = useState<File[]>([]);
    const [isFaceLearned, setIsFaceLearned] = useState(false);

    const handleModelShotsUpload = (files: FileList | File[]) => {
        const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        const newShots: ModelShot[] = newFiles.map(file => ({
            id: `${Date.now()}-${Math.random()}`,
            file,
            stylingText: ''
        }));
        setModelShots(prev => [...prev, ...newShots]);
    };

    const handleDetailShotsUpload = (files: FileList | File[]) => {
        const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        const newShots: DetailShot[] = newFiles.map(file => ({
            id: `${Date.now()}-${Math.random()}`,
            file,
            caption: ''
        }));
        setDetailShots(prev => [...prev, ...newShots]);
    };

    const handleFaceImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []).filter(file =>
            file.type.startsWith('image/')
        );
        setFaceImages(prev => [...prev, ...files]);
    };

    const handleLearnFace = async () => {
        alert('얼굴 학습 기능 (구현 예정)');
        setIsFaceLearned(true);
    };

    const handleGenerateStudio = async () => {
        alert('스튜디오 생성 + 얼굴 교체 기능 (구현 예정)\n기본 3장 출력');
    };

    return (
        <div className="space-y-6">
            {/* 모델 착용컷 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-display text-lg font-semibold text-black mb-4">모델 착용컷 (무한 업로드)</h3>
                <div className="space-y-4">
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-700">모델 전신/반신 컷 업로드</p>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => e.target.files && handleModelShotsUpload(e.target.files)}
                        />
                    </label>

                    {modelShots.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {modelShots.map((shot, index) => (
                                <div key={shot.id} className="relative group">
                                    <img
                                        src={URL.createObjectURL(shot.file)}
                                        alt={`모델컷 ${index + 1}`}
                                        className="w-full h-60 object-cover rounded-lg border-2 border-gray-200"
                                    />
                                    <button
                                        onClick={() => setModelShots(prev => prev.filter(s => s.id !== shot.id))}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
            </div>

            {/* 착화 디테일컷 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-display text-lg font-semibold text-black mb-4">착화 디테일컷 (무한 업로드)</h3>
                <div className="space-y-4">
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-700">착화 디테일 이미지 업로드</p>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => e.target.files && handleDetailShotsUpload(e.target.files)}
                        />
                    </label>

                    {detailShots.length > 0 && (
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                            {detailShots.map((shot, index) => (
                                <div key={shot.id} className="relative group">
                                    <img
                                        src={URL.createObjectURL(shot.file)}
                                        alt={`디테일 ${index + 1}`}
                                        className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                                    />
                                    <button
                                        onClick={() => setDetailShots(prev => prev.filter(s => s.id !== shot.id))}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
            </div>

            {/* "사진 한 장으로 끝내기" 기능 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200">
                <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-display text-xl font-bold text-purple-900">사진 한 장으로 끝내기</h3>
                        <p className="text-sm text-purple-700 mt-1">얼굴 이미지만 업로드하면 AI가 스튜디오 배경에서 모델컷 3장을 자동 생성합니다</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* 얼굴 이미지 업로더 */}
                    <div>
                        <label className="block text-sm font-semibold text-purple-900 mb-2">1. 얼굴 이미지 업로드</label>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors bg-white">
                            <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <p className="mt-2 text-sm text-purple-700">얼굴이 잘 보이는 사진을 업로드하세요</p>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleFaceImagesUpload}
                            />
                        </label>

                        {faceImages.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {faceImages.map((file, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`얼굴 ${index + 1}`}
                                            className="w-20 h-20 object-cover rounded-lg border-2 border-purple-300"
                                        />
                                        <button
                                            onClick={() => setFaceImages(prev => prev.filter((_, i) => i !== index))}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 얼굴 학습 버튼 */}
                    <div>
                        <label className="block text-sm font-semibold text-purple-900 mb-2">2. 얼굴 학습</label>
                        <button
                            onClick={handleLearnFace}
                            disabled={faceImages.length === 0 || isFaceLearned}
                            className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isFaceLearned ? '✓ 학습 완료' : '얼굴 학습하기'}
                        </button>
                    </div>

                    {/* 스튜디오 생성 버튼 */}
                    <div>
                        <label className="block text-sm font-semibold text-purple-900 mb-2">3. 스튜디오 모델컷 생성 (3장)</label>
                        <button
                            onClick={handleGenerateStudio}
                            disabled={!isFaceLearned}
                            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
                        >
                            AI 스튜디오 모델컷 생성하기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Step3ModelShots;
