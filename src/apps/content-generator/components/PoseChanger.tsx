import React from 'react';
import { SparklesIcon } from './Icons';

interface PoseChangerProps {
  poses: { label: string; prompt: string }[];
  onPoseSelect: (prompt: string) => void;
  onGenerateRandom: () => void;
  disabled: boolean;
  isGenerating: boolean;
}

export const PoseChanger: React.FC<PoseChangerProps> = ({ 
  poses, 
  onPoseSelect, 
  onGenerateRandom, 
  disabled, 
  isGenerating 
}) => {

  return (
    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
        <SparklesIcon className="w-6 h-6 mr-2 text-indigo-400"/>
        자세 변경 작업
      </h3>
      <div className="flex-grow grid grid-cols-2 gap-3 content-start overflow-y-auto max-h-60">
        {poses.map((pose) => (
          <button
            key={pose.prompt}
            onClick={() => onPoseSelect(pose.prompt)}
            disabled={disabled}
            className={`w-full text-sm text-left p-2.5 rounded-md transition-colors duration-200
              ${disabled
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700/50 text-gray-300 hover:bg-indigo-600 hover:text-white'
              }`}
          >
            {pose.label}
          </button>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700">
        <button
          onClick={onGenerateRandom}
          disabled={disabled || isGenerating}
          className={`w-full text-base font-semibold p-3 rounded-lg transition-all duration-300 flex items-center justify-center
            ${disabled || isGenerating
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg transform hover:scale-105'
            }`}
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-t-2 border-gray-400 border-t-white rounded-full animate-spin mr-2"></div>
              생성 중...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2"/>
              신발이 잘 보이는 랜덤 자세 3개 추가
            </>
          )}
        </button>
      </div>
    </div>
  );
};