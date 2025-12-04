import React, { useState } from 'react';

const Step4ProductInfo: React.FC = () => {
    const [productInfo, setProductInfo] = useState({
        manufacturer: '',
        manufacturerContact: '',
        material: '',
        color: '',
        size: '',
        weight: '',
        manufactureDate: '',
        qualityAssurance: '',
        asInfo: ''
    });

    const [shippingPolicy, setShippingPolicy] = useState(`
배송방법: 택배
배송지역: 전국
배송비: 무료 (3만원 이상 구매 시)
배송기간: 주문 후 2-3일 이내 (영업일 기준)

* 제주도 및 도서산간 지역은 추가 배송비가 발생할 수 있습니다.
* 주말 및 공휴일에는 배송이 되지 않습니다.
  `.trim());

    const [returnPolicy, setReturnPolicy] = useState(`
교환/반품 안내:
- 교환/반품 기간: 상품 수령 후 7일 이내
- 교환/반품 비용: 고객 변심 시 왕복 배송비 고객 부담
- 교환/반품 불가 사유:
  · 상품 수령 후 7일 경과
  · 고객의 책임 있는 사유로 상품 등이 멸실 또는 훼손된 경우
  · 포장을 개봉하였거나 포장이 훼손되어 상품가치가 상실된 경우
  · 착용 또는 세탁한 흔적이 있는 경우

A/S 안내:
- A/S 책임자: COA 고객센터
- 전화: 02-1234-5678
- 이메일: support@coa.com
- A/S 기간: 구매일로부터 1년
  `.trim());

    const handleProductInfoChange = (field: string, value: string) => {
        setProductInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleGenerateTable = () => {
        alert('AI 자동 테이블 생성 기능 (구현 예정)');
    };

    return (
        <div className="space-y-6">
            {/* 정보고시 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg font-semibold text-black">정보고시</h3>
                    <button
                        onClick={handleGenerateTable}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        AI 자동 채우기
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">제조자/수입자</label>
                        <input
                            type="text"
                            value={productInfo.manufacturer}
                            onChange={(e) => handleProductInfoChange('manufacturer', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="예: (주)COA"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">제조국</label>
                        <input
                            type="text"
                            value={productInfo.manufacturerContact}
                            onChange={(e) => handleProductInfoChange('manufacturerContact', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="예: 대한민국"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">소재</label>
                        <input
                            type="text"
                            value={productInfo.material}
                            onChange={(e) => handleProductInfoChange('material', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="예: 천연 소가죽, 러버"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">색상</label>
                        <input
                            type="text"
                            value={productInfo.color}
                            onChange={(e) => handleProductInfoChange('color', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="예: 블랙"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">치수</label>
                        <input
                            type="text"
                            value={productInfo.size}
                            onChange={(e) => handleProductInfoChange('size', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="예: 230-280mm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">제조연월</label>
                        <input
                            type="text"
                            value={productInfo.manufactureDate}
                            onChange={(e) => handleProductInfoChange('manufactureDate', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="예: 2024년 11월"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">품질보증기준</label>
                        <textarea
                            value={productInfo.qualityAssurance}
                            onChange={(e) => handleProductInfoChange('qualityAssurance', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={2}
                            placeholder="예: 관련법 및 소비자분쟁해결 규정에 따름"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">A/S 책임자 및 연락처</label>
                        <input
                            type="text"
                            value={productInfo.asInfo}
                            onChange={(e) => handleProductInfoChange('asInfo', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="예: COA 고객센터 02-1234-5678"
                        />
                    </div>
                </div>
            </div>

            {/* 배송 안내 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-display text-lg font-semibold text-black">배송 안내</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">COA 공통</span>
                </div>

                <textarea
                    value={shippingPolicy}
                    onChange={(e) => setShippingPolicy(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    rows={8}
                />
            </div>

            {/* 교환/반품 안내 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-display text-lg font-semibold text-black">교환/반품 안내</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">COA 공통</span>
                </div>

                <textarea
                    value={returnPolicy}
                    onChange={(e) => setReturnPolicy(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    rows={15}
                />
            </div>

            {/* 미리보기 */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="font-display text-lg font-semibold text-blue-900 mb-3">💡 안내</h3>
                <p className="text-sm text-blue-800">
                    모든 정보를 입력하신 후 "다음 단계" 버튼을 클릭하시면 최종 HTML 미리보기 화면으로 이동합니다.
                    전체 또는 섹션별로 HTML을 복사하여 무신사에 업로드하실 수 있습니다.
                </p>
            </div>
        </div>
    );
};

export default Step4ProductInfo;
