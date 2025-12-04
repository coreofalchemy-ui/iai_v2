import React, { useState } from 'react';
import { geminiService } from '../../../services/geminiService';

// Icon components (simplified versions)
const ArrowRightIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const UploadCloudIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

const XIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const Spinner = () => (
    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

// Helper function to sort files
const sortFilesByNumberInName = (files: File[]): File[] => {
    const getNumber = (name: string): number => {
        const match = name.match(/(\d+)/);
        return match ? parseInt(match[0], 10) : Infinity;
    };
    return [...files].sort((a, b) => getNumber(a.name) - getNumber(b.name));
};

const PersonalShopper = () => {
    const [productFiles, setProductFiles] = useState<File[]>([]);
    const [modelFiles, setModelFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleProductFiles = (files: FileList | null) => {
        const selectedFiles = Array.from(files || []).filter(file => file.type.startsWith('image/'));
        if (selectedFiles.length === 0) return;
        setProductFiles(prev => [...prev, ...selectedFiles]);
    };

    const handleModelFiles = (files: FileList | null) => {
        const selectedFiles = Array.from(files || []).filter(file => file.type.startsWith('image/'));
        if (selectedFiles.length === 0) return;
        setModelFiles(prev => [...prev, ...selectedFiles].slice(0, 5));
    };

    const handleRemoveProductFile = (index: number) => {
        setProductFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveModelFile = (index: number) => {
        setModelFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleGenerate = async () => {
        if (productFiles.length === 0) {
            setError('최소 1개 이상의 제품 이미지를 업로드해주세요.');
            return;
        }
        if (modelFiles.length === 0) {
            setError('최소 1개 이상의 모델 이미지를 업로드해주세요.');
            return;
        }

        setError(null);
        setIsLoading(true);
        setResult(null);

        try {
            const sortedProductFiles = sortFilesByNumberInName(productFiles);

            // Convert files to base64
            const productImages = await Promise.all(
                sortedProductFiles.map(file => fileToBase64(file))
            );
            const modelImages = await Promise.all(
                modelFiles.map(file => fileToBase64(file))
            );

            // Call Gemini API to analyze product
            const prompt = `당신은 패션 전문가입니다. 다음 제품 이미지들을 분석하여 상세한 제품 정보를 작성해주세요:

1. 제품명
2. 브랜드 (추정 가능한 경우)
3. 주요 특징 (3-5개)
4. 소재 및 제조 정보
5. 추천 스타일링

제품 이미지를 보고 정확하고 매력적인 상품설명을 작성해주세요.`;

            const response = await geminiService.generateText(
                prompt,
                productImages.concat(modelImages).map(base64 => ({
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: base64
                    }
                }))
            );

            setResult(response);
        } catch (err) {
            setError('상세페이지 생성 중 오류가 발생했습니다: ' + (err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    };

    const isButtonDisabled = isLoading || productFiles.length === 0 || modelFiles.length === 0;

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="text-center">
                <h2 className="font-display text-3xl font-bold text-black mb-4">
                    퍼스널쇼퍼 - AI 상세페이지 생성
                </h2>
                <p className="text-lg text-[#666666]">
                    제품과 모델 이미지를 업로드하면 AI가 자동으로 상세한 제품 정보를 작성해드립니다.
                </p>
            </div>

            {!result && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Product Upload */}
                    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">1. 제품 이미지 업로드</h3>
                        <p className="text-sm text-gray-500 mb-4">상세페이지에 사용할 제품 이미지를 업로드하세요. (권장: 3-7장)</p>

                        <div className="space-y-2 mb-3 max-h-60 overflow-y-auto pr-2">
                            {productFiles.map((file, index) => (
                                <div key={index} className="relative p-3 bg-gray-50 rounded-md border text-sm flex items-center justify-between">
                                    <span className="truncate pr-4 font-medium text-gray-700">{file.name}</span>
                                    <button onClick={() => handleRemoveProductFile(index)} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-gray-300 bg-gray-50 hover:bg-gray-100">
                            <UploadCloudIcon className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-center text-gray-500">클릭하여 파일 추가 또는 드래그 앤 드롭</p>
                            <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleProductFiles(e.target.files)} />
                        </label>
                    </div>

                    {/* Model Upload */}
                    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">2. 모델 이미지 업로드</h3>
                        <p className="text-sm text-gray-500 mb-4">제품을 착용한 모델 이미지를 업로드하세요. (최대 5장)</p>

                        <div className="space-y-2 mb-3 max-h-60 overflow-y-auto pr-2">
                            {modelFiles.map((file, index) => (
                                <div key={index} className="relative p-3 bg-gray-50 rounded-md border text-sm flex items-center justify-between">
                                    <span className="truncate pr-4 font-medium text-gray-700">{file.name}</span>
                                    <button onClick={() => handleRemoveModelFile(index)} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-gray-300 bg-gray-50 hover:bg-gray-100">
                            <UploadCloudIcon className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-center text-gray-500">클릭하여 파일 추가 또는 드래그 앤 드롭</p>
                            <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleModelFiles(e.target.files)} />
                        </label>
                    </div>
                </div>
            )}

            {error && <p className="text-red-600 text-center font-bold">{error}</p>}

            {!result && (
                <div className="pt-4">
                    <button
                        onClick={handleGenerate}
                        disabled={isButtonDisabled}
                        className="w-full flex items-center justify-center text-center bg-gray-800 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 ease-in-out hover:bg-gray-700 active:scale-95 text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Spinner />
                                <span className="ml-2">AI가 제품 정보를 분석하고 있어요...</span>
                            </>
                        ) : (
                            <>
                                제품 정보 생성하기
                                <ArrowRightIcon className="w-5 h-5 ml-2" />
                            </>
                        )}
                    </button>
                </div>
            )}

            {result && (
                <div className="bg-white rounded-lg shadow-lg p-8 animate-fade-in">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-display text-2xl font-bold text-black">AI 생성 제품 정보</h3>
                        <button
                            onClick={() => {
                                setResult(null);
                                setProductFiles([]);
                                setModelFiles([]);
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            새로 생성하기
                        </button>
                    </div>
                    <div className="prose max-w-none">
                        <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                            {result}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonalShopper;
