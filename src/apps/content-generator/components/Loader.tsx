import React, { useState, useEffect } from 'react';

const loadingSteps = [
  { text: "빠른 분석 시작", detail: "이미지를 최적화하여 전송 중입니다..." },
  { text: "Gemini 3.0 처리 중", detail: "고성능 모델이 이미지를 생성하고 있습니다" },
  { text: "신발 교체 진행", detail: "원본을 보존하며 신발만 정밀하게 교체합니다" },
  { text: "마무리 중", detail: "잠시만 기다려주세요..." },
];

export const Loader: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % loadingSteps.length);
    }, 4000); 

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-950/90 backdrop-blur-md flex flex-col items-center justify-center z-50">
      <div className="w-full max-w-md p-8 relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] animate-pulse"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative mb-8">
                <div className="w-20 h-20 border-t-2 border-r-2 border-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-b-2 border-l-2 border-purple-500 rounded-full animate-spin [animation-direction:reverse]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">FAST</span>
                </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                {loadingSteps[stepIndex].text}
            </h3>
            <p className="text-indigo-300 text-sm font-medium tracking-wide uppercase animate-pulse">
                {loadingSteps[stepIndex].detail}
            </p>

            <div className="w-full bg-gray-800 h-1 mt-8 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-[loading_2s_ease-in-out_infinite] w-1/3"></div>
            </div>
            
            <p className="mt-4 text-xs text-gray-500">
                속도 최적화 모드로 작업 중입니다.
            </p>
        </div>
      </div>
      <style>{`
        @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};