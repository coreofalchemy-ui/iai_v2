import React from 'react';

const Step3ModelFoot: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-display text-lg font-semibold text-blue-900 mb-2">
                    👟 모델 발 사진 (착화샷)
                </h3>
                <p className="text-sm text-blue-800">
                    착화 발 사진 촬영 기능은 현재 개발 중입니다.
                </p>
            </div>

            <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
                <div className="text-6xl mb-4">🚧</div>
                <h4 className="text-xl font-semibold text-gray-800 mb-2">기능 개발 중</h4>
                <p className="text-gray-600">
                    모델 발 착화 사진 생성 기능은 곧 추가될 예정입니다.
                </p>
            </div>
        </div>
    );
};

export default Step3ModelFoot;
