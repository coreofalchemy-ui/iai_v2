import React, { useState } from 'react';
import { ArrowPathIcon, DownloadIcon } from './Icons';
import { changeImagePose, generatePosePrompts } from '../services/geminiService';
import { PoseChanger } from './PoseChanger';
import { UploadFile } from '../types';
import { dataURLtoFile } from '../utils/fileUtils';

const initialPoses = [
  { label: '정면 클로즈업', prompt: '신발의 앞모습이 프레임 중앙에 오도록 촬영한 정면 클로즈업 샷. 신발의 전체적인 모양과 발등 디테일이 잘 보이도록.' },
  { label: '좌측면 샷', prompt: '신발의 왼쪽 측면 전체가 보이도록 촬영한 샷. 아웃솔 디자인과 측면 로고, 실루엣을 강조.' },
  { label: '우측면 샷', prompt: '신발의 오른쪽 측면 전체가 보이도록 촬영한 샷. 아웃솔 디자인과 측면 로고, 실루엣을 강조.' },
  { label: '로우앵글 사선', prompt: '낮은 카메라 각도에서 신발을 사선으로 바라본 샷. 신발의 입체감과 아웃솔의 두께를 강조.' },
  { label: '발등 굽힘', prompt: '발가락을 아래로 향하게 하여 발등을 자연스럽게 굽히는 자세. 신발의 유연성과 발등 부분의 소재감이 잘 드러나도록.' },
  { label: '앞코 접힘', prompt: '발끝으로 서는 것처럼 앞코 부분을 바닥에 대고 살짝 구부려, 신발 앞부분이 자연스럽게 접히는 모습을 보여주는 자세.' },
  { label: '측면 실루엣', prompt: '한쪽 발을 다른 발 앞에 살짝 교차시켜 세워, 신발의 바깥쪽 측면 실루엣과 뒷굽 라인을 강조하는 자세.' },
  { label: '힐업 토탭', prompt: '발끝(토)은 바닥에 가볍게 대고 뒤꿈치(힐)를 살짝 들어 올려, 신발의 아치와 측면 라인이 잘 보이도록 하는 자세.' },
  { label: '걷는 순간', prompt: '한 발이 땅을 박차고 앞으로 나아가는 듯한 걷는 동작의 순간을 포착한 샷. 신발의 역동적인 모습을 강조.' },
  { label: '서서 측면 보기', prompt: '차렷 자세로 서서 몸을 옆으로 돌려 신발의 옆모습을 보여주는 가장 기본적인 측면 자세.' },
];

interface GeneratedImageGalleryProps {
  images: string[];
  onReset: () => void;
  onImageAdd: (index: number, newImageUrl: string) => void;
}

export const GeneratedImageGallery: React.FC<GeneratedImageGalleryProps> = ({ images, onReset, onImageAdd }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPosing, setIsPosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poses, setPoses] = useState(initialPoses);
  const [isGeneratingRandom, setIsGeneratingRandom] = useState(false);

  const selectedImage = images[selectedIndex] || null;

  if (images.length === 0) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-yellow-400">생성된 이미지 없음</h2>
        <p className="text-gray-300 mt-2">문제가 발생했습니다. 다시 시도해 주세요.</p>
        <button
          onClick={onReset}
          className="mt-6 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-500 transition-colors flex items-center justify-center mx-auto"
        >
          <ArrowPathIcon className="h-5 w-5 mr-2"/>
          처음부터 다시 시작
        </button>
      </div>
    );
  }

  const handleDownload = () => {
    if (!selectedImage) return;
    const link = document.createElement('a');
    link.href = selectedImage;
    const mimeType = selectedImage.split(';')[0].split(':')[1];
    const extension = mimeType.split('/')[1] || 'png';
    link.download = `generated-fashion-image.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePoseChange = async (posePrompt: string) => {
    if (!selectedImage || isPosing || isGeneratingRandom) return;

    setIsPosing(true);
    setError(null);
    try {
      const file = dataURLtoFile(selectedImage, `generated_image_${selectedIndex}.jpeg`);
      const uploadFile: UploadFile = { file, previewUrl: selectedImage };
      const newImage = await changeImagePose(uploadFile, posePrompt);
      onImageAdd(selectedIndex, newImage);
      setSelectedIndex(selectedIndex + 1);
    } catch (e) {
      console.error("Failed to change pose:", e);
      const errorMessage = e instanceof Error ? e.message : '자세 변경 중 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setIsPosing(false);
    }
  };

  const handleGenerateRandom = async () => {
    if (!selectedImage || isPosing || isGeneratingRandom) return;

    setIsGeneratingRandom(true);
    setError(null);
    
    try {
      // 1. Convert current image to file for processing
      const file = dataURLtoFile(selectedImage, `generated_base_${Date.now()}.jpg`);
      const uploadFile: UploadFile = { file, previewUrl: selectedImage };

      // 2. Generate 3 random prompts
      const existingPrompts = poses.map(p => p.prompt);
      const newPoses = await generatePosePrompts(existingPrompts);
      setPoses(prevPoses => [...prevPoses, ...newPoses]);

      // 3. Generate images for ALL 3 prompts immediately
      const generationPromises = newPoses.map(pose => 
        changeImagePose(uploadFile, pose.prompt)
      );

      const newImages = await Promise.all(generationPromises);

      // 4. Add all generated images to the gallery
      // We loop and add them. They will appear after the current image.
      newImages.forEach((img) => {
        onImageAdd(selectedIndex, img);
      });

    } catch (e) {
      console.error("Failed to generate random poses:", e);
      const errorMessage = e instanceof Error ? e.message : '랜덤 포즈 이미지 생성 중 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setIsGeneratingRandom(false);
    }
  };

  const isBusy = isPosing || isGeneratingRandom;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">생성 결과</h2>
        <button
          onClick={onReset}
          className="bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors flex items-center"
        >
          <ArrowPathIcon className="h-5 w-5 mr-2"/>
          새로 생성하기
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative">
          <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 aspect-[3/4] flex items-center justify-center">
            {selectedImage && <img src={selectedImage} alt="Selected generated fashion" className="w-full h-full object-contain" />}
            {isBusy && (
              <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <div className="w-12 h-12 border-4 border-t-4 border-gray-600 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-white">
                  {isGeneratingRandom ? '랜덤 포즈 3종 생성 중...' : '모델의 자세를 변경 중...'}
                </p>
              </div>
            )}
          </div>
          {selectedImage && (
            <button
                onClick={handleDownload}
                className="absolute top-4 right-4 bg-gray-900/70 text-white font-semibold py-2 px-3 rounded-lg hover:bg-indigo-600 transition-colors flex items-center backdrop-blur-sm"
                aria-label="Download image"
            >
                <DownloadIcon className="h-5 w-5 mr-2" />
                다운로드
            </button>
          )}
        </div>
        
        <div className="lg:col-span-1 flex flex-col space-y-6">
            <PoseChanger
              poses={poses}
              onPoseSelect={handlePoseChange}
              onGenerateRandom={handleGenerateRandom}
              disabled={isBusy}
              isGenerating={isGeneratingRandom}
            />
            
            <div>
              <h3 className="text-xl font-semibold text-gray-300 mb-4">이미지 세트</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4">
              {images.map((img, index) => (
                  <div 
                      key={index} 
                      className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selectedIndex === index ? 'border-indigo-500 scale-105' : 'border-transparent hover:border-indigo-400'}`}
                      onClick={() => setSelectedIndex(index)}
                  >
                  <img src={img} alt={`Generated image ${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center p-1 truncate">
                      {`결과 ${index + 1}`}
                  </div>
                  </div>
              ))}
              </div>
            </div>
            {error && <p className="text-red-400 text-sm mt-2 text-center bg-red-900/20 p-2 rounded">{error}</p>}
        </div>
      </div>
    </div>
  );
};