import React from 'react';

const Step6ProductInfo: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                <h3 className="font-display text-lg font-semibold text-indigo-900 mb-2">
                    📋 정보고시 & 배송 정보
                </h3>
                <p className="text-sm text-indigo-800">
                    제품 정보고시 및 배송 정보 입력 기능은 현재 개발 중입니다.
                </p>
            </div>

            <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
                <div className="text-6xl mb-4">🚧</div>
                <h4 className="text-xl font-semibold text-gray-800 mb-2">기능 개발 중</h4>
                <p className="text-gray-600">
                    정보고시 및 배송 정보 입력 기능은 곧 추가될 예정입니다.
                </p>
            </div>
        </div>
    );
};

export default Step6ProductInfo;
