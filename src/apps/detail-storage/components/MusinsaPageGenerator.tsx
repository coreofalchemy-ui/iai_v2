import React, { useState } from 'react';
import { Navigation } from '../../components/shared/Navigation';

// Step 상태 타입
type StepStatus = 'pending' | 'active' | 'completed';

interface Step {
    number: number;
    title: string;
    subtitle: string;
    status: StepStatus;
}

const MusinsaPageGenerator = () => {
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    const steps: Step[] = [
        {
            number: 1,
            title: '퍼스널쇼퍼',
            subtitle: '제품 정보 입력 & AI 텍스트 생성',
            status: currentStep === 1 ? 'active' : completedSteps.includes(1) ? 'completed' : 'pending'
        },
        {
            number: 2,
            title: '제품 디테일컷',
            subtitle: '대표컷 1장 + 디테일컷 무한',
            status: currentStep === 2 ? 'active' : completedSteps.includes(2) ? 'completed' : 'pending'
        },
        {
            number: 3,
            title: '모델 착용컷',
            subtitle: '모델컷 & 착화 디테일 무한',
            status: currentStep === 3 ? 'active' : completedSteps.includes(3) ? 'completed' : 'pending'
        },
        {
            number: 4,
            title: '정보고시 & 배송',
            subtitle: '자동 생성 + 수정 가능',
            status: currentStep === 4 ? 'active' : completedSteps.includes(4) ? 'completed' : 'pending'
        }
    ];

    const getStepIcon = (status: StepStatus, number: number) => {
        if (status === 'completed') {
            return (
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            );
        }

        if (status === 'active') {
            return (
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{number}</span>
                </div>
            );
        }

        return (
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-500 font-semibold">{number}</span>
            </div>
        );
    };

    const handleStepClick = (stepNumber: number) => {
        if (completedSteps.includes(stepNumber) || stepNumber === currentStep) {
            setCurrentStep(stepNumber);
        }
    };

    const handleNextStep = () => {
        if (currentStep < 4) {
            if (!completedSteps.includes(currentStep)) {
                setCompletedSteps([...completedSteps, currentStep]);
            }
            setCurrentStep(currentStep + 1);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-primary">
            <Navigation />

            <div className="pt-[80px] flex h-[calc(100vh-80px)]">
                {/* Left Sidebar */}
                <aside className="w-[400px] bg-white border-r border-[#E5E5E5] flex flex-col overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-[#E5E5E5]">
                        <h1 className="font-display text-2xl font-bold text-black mb-2">
                            상세페이지 생성기
                        </h1>
                        <p className="text-sm text-[#666666]">
                            4단계로 무신사 업로드용 HTML을 완성하세요
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <h2 className="font-display text-lg font-semibold text-black mb-4">
                            진행 단계
                        </h2>

                        {steps.map((step) => (
                            <button
                                key={step.number}
                                onClick={() => handleStepClick(step.number)}
                                disabled={step.status === 'pending'}
                                className={`
                  w-full text-left p-4 rounded-lg border-2 transition-all
                  ${step.status === 'active' ? 'border-blue-500 bg-blue-50' : ''}
                  ${step.status === 'completed' ? 'border-green-500 bg-green-50 cursor-pointer hover:bg-green-100' : ''}
                  ${step.status === 'pending' ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed' : ''}
                `}
                            >
                                <div className="flex items-start gap-3">
                                    {getStepIcon(step.status, step.number)}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-display text-base font-semibold text-black mb-1">
                                            {step.title}
                                        </h3>
                                        <p className="text-xs text-[#666666] leading-relaxed">
                                            {step.subtitle}
                                        </p>
                                        {step.status === 'active' && (
                                            <span className="inline-block mt-2 text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                                진행 중
                                            </span>
                                        )}
                                        {step.status === 'completed' && (
                                            <span className="inline-block mt-2 text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                                                완료
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="p-6 border-t border-[#E5E5E5]">
                        <button className="w-full bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                            전체 미리보기
                        </button>
                    </div>
                </aside>

                {/* Right Main Area */}
                <main className="flex-1 overflow-y-auto bg-[#FAFAFA] p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] p-8">
                            <h2 className="font-display text-2xl font-bold text-black mb-4">
                                {steps[currentStep - 1].title}
                            </h2>
                            <p className="text-[#666666] mb-8">
                                {steps[currentStep - 1].subtitle}
                            </p>

                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <p className="text-gray-500">1단계: 제품 정보 입력 폼이 여기에 표시됩니다.</p>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <p className="text-gray-500">2단계: 제품 디테일컷 업로드가 여기에 표시됩니다.</p>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <p className="text-gray-500">3단계: 모델 착용컷 업로드가 여기에 표시됩니다.</p>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="space-y-6">
                                    <p className="text-gray-500">4단계: 정보고시 & 배송 안내가 여기에 표시됩니다.</p>
                                </div>
                            )}

                            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                                    disabled={currentStep === 1}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    이전 단계
                                </button>
                                <button
                                    onClick={handleNextStep}
                                    disabled={currentStep === 4}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {currentStep === 4 ? '완료' : '다음 단계'}
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MusinsaPageGenerator;
