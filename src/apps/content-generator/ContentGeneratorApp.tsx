import React, { useState, useCallback } from 'react';
import { UploadFile } from './types';
import { cropImageToTargetSize } from './utils/fileUtils';
import { replaceShoesInImage, changeImagePose, generatePosePrompts } from './services/geminiService';
import { Loader } from './components/Loader';
import { DragDropUpload } from '../../components/shared/DragDropUpload';
import { Navigation } from '../../components/shared/Navigation';
import { motion, AnimatePresence } from 'framer-motion';

type ActiveTab = 'content' | 'pose';
type AppStep = 'upload' | 'generating' | 'results' | 'error';

const initialPoses = [
  { label: '정면 클로즈업', prompt: '신발의 앞모습이 프레임 중앙에 오도록 촬영한 정면 클로즈업 샷. 신발의 전체적인 모양과 발등 디테일이 잘 보이도록.' },
  { label: '좌측면 샷', prompt: '신발 의 왼쪽 측면 전체가 보이도록 촬영한 샷. 아웃솔 디자인과 측면 로고, 실루엣을 강조.' },
  { label: '우측면 샷', prompt: '신발의 오른쪽 측면 전체가 보이도록 촬영한 샷. 아웃솔 디자인과 측면 로고, 실루엣을 강조.' },
  { label: '로우앵글 사선', prompt: '낮은 카메라 각도에서 신발을 사선으로 바라본 샷. 신발의 입체감과 아웃솔의 두께를 강조.' },
  { label: '발등 굽힘', prompt: '발가락을 아래로 향하게 하여 발등을 자연스럽게 굽히는 자세. 신발의 유연성과 발등 부분의 소재감이 잘 드러나도록.' },
  { label: '앞코 접힘', prompt: '발끝으로 서는 것처럼 앞코 부분을 바닥에 대고 살짝 구부려, 신발 앞부분이 자연스럽게 접히는 모습을 보여주는 자세.' },
  { label: '측면 실루엣', prompt: '한쪽 발을 다른 발 앞에 살짝 교차시켜 세워, 신발의 바깥쪽 측면 실루엣과 뒷굽 라인을 강조하는 자세.' },
  { label: '힐업 토탭', prompt: '발끝(토)은 바닥에 가볍게 대고 뒤꿈치(힐)를 살짝 들어 올려, 신발의 아치와 측면 라인이 잘 보이도록 하는 자세.' },
  { label: '걷는 순간', prompt: '한 발이 땅을 박차고 앞으로 나아가는 듯한 걷는 동작의 순간을 포착한 샷. 신발의 역동적인 모습을 강조.' },
  { label: '서서 측면 보기', prompt: '차렷 자세로 서서 몸을 옆으로 돌려 신발의 옆모습을 보여주는 가장 기본적인 측면 자세.' },
];

export const ContentGeneratorApp: React.FC = () => {
  const [sourceImages, setSourceImages] = useState<UploadFile[]>([]);
  const [productImages, setProductImages] = useState<UploadFile[]>([]);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSingleShoe, setIsSingleShoe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSourceImagesChange = async (files: File[]) => {
    setIsGenerating(true);
    setError(null);
    try {
      const uploadFiles: UploadFile[] = files.map(f => ({
        file: f,
        previewUrl: URL.createObjectURL(f)
      }));
      const croppedFiles = await Promise.all(uploadFiles.map(uf => cropImageToTargetSize(uf.file)));
      setSourceImages(croppedFiles);
    } catch (e) {
      setError("이미지를 처리하는 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProductImagesChange = async (files: File[]) => {
    const uploadFiles: UploadFile[] = files.map(f => ({
      file: f,
      previewUrl: URL.createObjectURL(f)
    }));
    setProductImages(prev => [...prev, ...uploadFiles].slice(0, 10));
  };

  const handleGenerate = useCallback(async () => {
    if (sourceImages.length === 0 || productImages.length === 0) {
      setError('교체할 사진과 제품 사진을 모두 업로드해주세요.');
      return;
    }
    setIsGenerating(true);
    setError(null);

    try {
      const generationPromises = sourceImages.map(sourceImage =>
        replaceShoesInImage(sourceImage, productImages, isSingleShoe)
      );

      const settledResults = await Promise.allSettled(generationPromises);
      const successfulResults = settledResults
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<string>).value);

      const failedCount = settledResults.length - successfulResults.length;

      if (successfulResults.length === 0) {
        const firstError = settledResults[0].status === 'rejected' ? (settledResults[0] as PromiseRejectedResult).reason : '알 수 없는 오류';
        const errorMessage = firstError instanceof Error ? firstError.message : String(firstError);
        throw new Error(`모든 이미지 생성에 실패했습니다. (${errorMessage})`);
      }

      setGeneratedImages(successfulResults);

      if (failedCount > 0) {
        setError(`${successfulResults.length}/${settledResults.length} 개 생성 성공. ${failedCount}개는 실패했습니다.`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [sourceImages, productImages, isSingleShoe]);

  const removeSourceImage = (index: number) => {
    setSourceImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeProductImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
  };

  const downloadImage = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `generated-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canGenerate = sourceImages.length > 0 && productImages.length > 0 && !isGenerating;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-primary">
      <Navigation />

      <div className="flex flex-col lg:flex-row h-screen pt-[60px]">
        {/* Sidebar */}
        <aside className="w-full lg:w-[400px] bg-white border-r border-[#E5E5E5] flex flex-col overflow-y-auto custom-scrollbar">
          <div className="p-8 border-b border-[#F0F0F0]">
            <h1 className="font-display text-2xl font-[700] mb-2">콘텐츠 생성기</h1>
            <p className="text-sm text-[#666666]">
              빠른 신발 교체 및 이미지 생성
            </p>
          </div>

          <div className="p-6 space-y-8 flex-1">
            {/* 01. Source Images */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-[600]">01. 교체할 사진</h2>
                <span className="text-xs text-[#999999]">{sourceImages.length}</span>
              </div>
              <DragDropUpload
                onFilesSelected={handleSourceImagesChange}
                multiple={true}
                accept="image/*"
              />
              {sourceImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {sourceImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img.previewUrl}
                        alt={`Source ${idx + 1}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeSourceImage(idx)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 02. Product Images */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-[600]">02. 제품 사진</h2>
                <span className="text-xs text-[#999999]">{productImages.length}/10</span>
              </div>
              <DragDropUpload
                onFilesSelected={handleProductImagesChange}
                multiple={true}
                accept="image/*"
              />
              {productImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {productImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img.previewUrl}
                        alt={`Product ${idx + 1}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeProductImage(idx)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 03. Settings */}
            <section>
              <h2 className="font-display text-lg font-[600] mb-4">03. 설정</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSingleShoe}
                  onChange={(e) => setIsSingleShoe(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">한쪽 신발만 교체</span>
              </label>
            </section>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="p-6 border-t border-[#F0F0F0]">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full bg-black text-white py-4 rounded-xl font-[600] hover:bg-[#333333] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isGenerating ? '생성 중...' : '이미지 생성'}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h2 className="font-display text-2xl font-[700] mb-2">생성 결과</h2>
              <p className="text-sm text-[#666666]">
                {generatedImages.length > 0
                  ? `${generatedImages.length}개의 이미지가 생성되었습니다`
                  : '생성된 이미지가 여기에 표시됩니다'}
              </p>
            </div>

            {generatedImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 mb-4 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                  <svg className="w-12 h-12 text-[#CCCCCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-[600] mb-2">생성된 이미지가 없습니다</h3>
                <p className="text-[#666666]">왼쪽에서 이미지를 업로드하고 생성 버튼을 눌러주세요</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {generatedImages.map((imgUrl, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <img
                        src={imgUrl}
                        alt={`Generated ${idx + 1}`}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => downloadImage(imgUrl, idx)}
                          className="w-full bg-white text-black py-2 rounded-lg font-[600] text-sm hover:bg-gray-100 transition-colors"
                        >
                          다운로드
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </main>
      </div>

      {isGenerating && <Loader />}
    </div>
  );
};
