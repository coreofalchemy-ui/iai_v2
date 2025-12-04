import React from 'react';

const Step2ModelFoot: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <h3 className="font-semibold text-yellow-900 mb-1">👟 모델 발 사진 기능 준비 중</h3>
                        <p className="text-sm text-yellow-800">
                            이 단계는 현재 개발 중입니다. 모델이 제품을 착용한 발 사진을 업로드하고 편집할 수 있는 기능이 추가될 예정입니다.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">곧 출시됩니다</h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                    모델 착용 발 사진을 업로드하고 자동으로 보정하는 기능을 준비 중입니다.
                </p>
            </div>
        </div>
    );
};

export default Step2ModelFoot;
