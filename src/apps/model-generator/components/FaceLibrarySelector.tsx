import React, { useState } from 'react';
import { fetchRandomFaces, type FaceImage } from '../services/faceLibraryService';
import { SparklesIcon } from './icons';

interface FaceLibrarySelectorProps {
    gender: 'm' | 'w';
    onSelectFace: (imageUrl: string) => void;
}

export const FaceLibrarySelector: React.FC<FaceLibrarySelectorProps> = ({ gender, onSelectFace }) => {
    const [faces, setFaces] = useState<FaceImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadRandomFaces = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const randomFaces = await fetchRandomFaces(gender, 6);
            setFaces(randomFaces);
            setIsOpen(true);
        } catch (err) {
            setError('얼굴 이미지를 불러오는데 실패했습니다.');
            console.error('Error loading faces:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectFace = async (face: FaceImage) => {
        try {
            // Fetch the image and convert to File
            const response = await fetch(face.publicUrl);
            const blob = await response.blob();
            const file = new File([blob], face.filename, { type: blob.type });

            // Create a FileReader to get the data URL
            const reader = new FileReader();
            reader.onload = () => {
                onSelectFace(reader.result as string);
                setIsOpen(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError('얼굴 이미지를 선택하는데 실패했습니다.');
            console.error('Error selecting face:', err);
        }
    };

    return (
        <>
            <button
                onClick={loadRandomFaces}
                disabled={isLoading}
                className="w-full mt-3 py-3 px-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-purple-200"
            >
                <SparklesIcon className="w-4 h-4" />
                {isLoading ? '불러오는 중...' : '추천 얼굴 라이브러리'}
            </button>

            {error && (
                <p className="text-xs text-red-600 mt-2">{error}</p>
            )}

            {isOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
                    <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-lg font-semibold">얼굴 라이브러리 ({gender === 'w' ? '여성' : '남성'})</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            {faces.map((face, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSelectFace(face)}
                                    className="aspect-[3/4] rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-500 transition-all hover:shadow-lg group"
                                >
                                    <img
                                        src={face.publicUrl}
                                        alt={face.filename}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={loadRandomFaces}
                            disabled={isLoading}
                            className="w-full mt-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                            {isLoading ? '불러오는 중...' : '🔄 다른 얼굴 보기'}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
