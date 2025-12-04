import React from 'react';
import { ImageUploader } from './ImageUploader';
import { GeneratedImageGallery } from './GeneratedImageGallery';
import { UploadFile } from '../types';
import { ArrowPathIcon } from './Icons';

type AppStep = 'upload' | 'generating' | 'results' | 'error';

interface ContentGeneratorProps {
  sourceImages: UploadFile[];
  productImages: UploadFile[];
  generatedImages: string[];
  step: AppStep;
  error: string | null;
  isSingleShoe: boolean;
  onSourceImagesChange: (files: UploadFile[]) => void;
  onProductImagesChange: (files: UploadFile[]) => void;
  onGenerate: () => void;
  onReset: () => void;
  onImageAdd: (index: number, newImageUrl: string) => void;
  onIsSingleShoeChange: (isSingle: boolean) => void;
}

export const ContentGenerator: React.FC<ContentGeneratorProps> = ({
  sourceImages,
  productImages,
  generatedImages,
  step,
  error,
  isSingleShoe,
  onSourceImagesChange,
  onProductImagesChange,
  onGenerate,
  onReset,
  onImageAdd,
  onIsSingleShoeChange,
}) => {
  
  switch (step) {
    case 'generating':
      // The global loader in App.tsx is now used
      return null; 
    case 'results':
      return (
        <>
        {error && 
            <div className="mb-6 text-center p-4 bg-yellow-900/30 rounded-lg border border-yellow-700">
                <p className="text-yellow-300 whitespace-pre-wrap">{error}</p>
            </div>
        }
        <GeneratedImageGallery
          images={generatedImages}
          onReset={onReset}
          onImageAdd={onImageAdd}
        />
        </>
      );
    case 'error':
      return (
        <div className="text-center p-8 bg-gray-800 rounded-lg">
          <h2 className="text-2xl font-bold text-red-400 mb-4">오류가 발생했습니다</h2>
          <p className="text-gray-300 mb-6 whitespace-pre-wrap">{error}</p>
          <button
            onClick={onReset}
            className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-500 transition-colors flex items-center justify-center mx-auto"
          >
             <ArrowPathIcon className="h-5 w-5 mr-2"/>
            처음부터 다시 시작
          </button>
        </div>
      );
    case 'upload':
    default:
      const isButtonDisabled = sourceImages.length === 0 || productImages.length === 0;
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ImageUploader
              title="교체할 사진"
              description="신발을 교체할 원본 사진을 최대 10장 업로드하세요. 이미지는 1165:1400 비율로 자동 조정됩니다."
              onFilesChange={onSourceImagesChange}
              maxFiles={10}
              maxSizeMB={10}
              isMultiple
              aspectRatio="1165/1400"
            />
            <ImageUploader
              title="제품 사진"
              description="다양한 각도에서 촬영한 새 신발 이미지를 5-10장 업로드하세요."
              onFilesChange={onProductImagesChange}
              maxFiles={10}
              maxSizeMB={5}
              isMultiple
            />
          </div>
            <div className="flex justify-center items-center -mt-2">
                <div className="flex items-center p-4">
                    <input
                        id="single-shoe-checkbox"
                        type="checkbox"
                        checked={isSingleShoe}
                        onChange={(e) => onIsSingleShoeChange(e.target.checked)}
                        className="h-5 w-5 rounded border-gray-500 bg-gray-700 text-indigo-500 focus:ring-indigo-600 cursor-pointer"
                    />
                    <label htmlFor="single-shoe-checkbox" className="ml-3 text-base text-gray-300 cursor-pointer select-none">
                        한쪽 신발만 교체 (외발 생성)
                    </label>
                </div>
            </div>
          <div className="text-center pt-0">
            <button
              onClick={onGenerate}
              disabled={isButtonDisabled}
              className={`px-12 py-4 text-lg font-bold rounded-lg transition-all duration-300 transform hover:scale-105
                ${isButtonDisabled
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl'
                }`}
            >
              콘텐츠 생성하기
            </button>
          </div>
        </div>
      );
  }
};