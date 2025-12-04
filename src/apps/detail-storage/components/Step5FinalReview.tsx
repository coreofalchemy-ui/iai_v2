import React, { useState } from 'react';
import { PreviewItem } from '../components/DraggablePreview';

interface Step5FinalReviewProps {
    draggableItems: PreviewItem[];
    setDraggableItems: React.Dispatch<React.SetStateAction<PreviewItem[]>>;
    onDownloadHTML: () => void;
}

type TemplateType = 'sizeGuide' | 'care' | 'shipping' | 'caution';

const Step5FinalReview: React.FC<Step5FinalReviewProps> = ({ draggableItems, setDraggableItems, onDownloadHTML }) => {
    const [activeTemplate, setActiveTemplate] = useState<TemplateType | null>(null);
    const [uploadedShoeImage, setUploadedShoeImage] = useState<string | null>(null);

    // SIZE GUIDE State
    const [sizeGuideData, setSizeGuideData] = useState({
        shoeLength: '27cm',
        shoeWidth: '10cm',
        heelHeight: '3cm',
        sizeNote: '사이즈 측정 방법과 기준에 따라 약간의 오차가 발생할 수 있습니다.'
    });

    // CARE State
    const [careItems, setCareItems] = useState([
        { icon: '💧', title: '습기 주의', desc: '가죽 제품은 습기에 약한 변색이나 얼룩이 생길 수 있습니다.' },
        { icon: '☀️', title: '직사광선 주의', desc: '직사광선에 장시간 노출되는 경우 가죽 색상이 바래게 하거나 이염을 일으킬 수 있습니다.' },
        { icon: '🚫', title: '열/세제 금지', desc: '가죽 제품은 열탕 소독이나 강력한 세제를 사용하면 심각한 손상을 입을 수 있습니다.' },
        { icon: '🧺', title: '세탁 방법', desc: '본 제품은 특세타이 불가능합니다. 오염 시에는 즉시 가죽 전용 클리너나 부드러운 천으로 닦아주세요.' },
        { icon: '📦', title: '보관 방법', desc: '장기간 보관사에는 통기성 좋은 천 커버를 권장합니다.' },
        { icon: '👟', title: '착용 방법', desc: '착용 전후 가죽 전용 보호제나 크림을 발라 주기적으로 관리하면 제품 수명을 연장할 수 있습니다.' }
    ]);

    // SHIPPING State
    const [shippingData, setShippingData] = useState({
        shippingItems: [
            '교환 및 반품 가능 기간: 상품 수령일로부터 7일 이내',
            '단순 변심 및 주문 오류로 인한 교환/반품의 경우 왕복 배송비 부담'
        ],
        exchangeItems: [
            '신뢰의 담보 또는 훼손 조건이 있을 시',
            '주문한 상품이 결함이 없는 경우 단순 변심'
        ]
    });

    // CAUTION State
    const [cautionData, setCautionData] = useState({
        warnings: [
            '가죽 제품 특성상 개별별 색감의 차이, 고유 주름 및 스크래치가 있을 수 있으며, 이염이 발생할 수 있습니다.',
            '가죽 제품의 경우 생산과정에서 에이징 자국이 진행되어 출고됨에 따라 제품 최초 수령 시 주름이 잡혀 있으며, 이는 불량 사유가 아닙니다.'
        ],
        asCenter: 'YASE 고객센터로 연락 주시면 해당 내용을 확인 후 순차적인 답변 처리 도와드리겠습니다.',
        asContact: '070-4647-1211',
        asKakao: '스피글이자스토어'
    });

    const addTemplateToPreview = (type: TemplateType) => {
        let htmlContent = '';
        let title = '';

        switch (type) {
            case 'sizeGuide':
                title = 'SIZE GUIDE';
                htmlContent = `
<div style="padding: 60px 40px; background: white; font-family: 'Inter', sans-serif;">
    <h2 style="font-size: 32px; font-weight: 700; text-align: center; margin-bottom: 60px;">SIZE GUIDE</h2>
    <div style="max-width: 800px; margin: 0 auto;">
        ${uploadedShoeImage ? `<div style="text-align: center; margin-bottom: 40px;"><img src="${uploadedShoeImage}" style="width: 100%; max-width: 600px; height: auto;" /></div>` : ''}
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
            <div style="text-align: center; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <div style="font-size: 14px; color: #666; margin-bottom: 8px;">가로</div>
                <div style="font-size: 24px; font-weight: bold;">${sizeGuideData.shoeLength}</div>
            </div>
            <div style="text-align: center; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <div style="font-size: 14px; color: #666; margin-bottom: 8px;">세로</div>
                <div style="font-size: 24px; font-weight: bold;">${sizeGuideData.shoeWidth}</div>
            </div>
            <div style="text-align: center; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <div style="font-size: 14px; color: #666; margin-bottom: 8px;">굽 높이</div>
                <div style="font-size: 24px; font-weight: bold;">${sizeGuideData.heelHeight}</div>
            </div>
        </div>
        <p style="margin-top: 30px; font-size: 13px; color: #999; text-align: center;">• ${sizeGuideData.sizeNote}</p>
    </div>
</div>`;
                break;

            case 'care':
                title = '기타 주의 사항';
                htmlContent = `
<div style="padding: 60px 40px; background: white; font-family: 'Inter', sans-serif;">
    <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 40px;">기타 주의 사항</h2>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px;">
        ${careItems.map(item => `
            <div style="background: #f8f9fa; padding: 30px; border-radius: 12px;">
                <div style="font-size: 48px; margin-bottom: 16px;">${item.icon}</div>
                <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">${item.title}</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #666;">${item.desc}</p>
            </div>
        `).join('')}
    </div>
</div>`;
                break;

            case 'shipping':
                title = '배송/교환/환불';
                htmlContent = `
<div style="padding: 60px 40px; background: white; font-family: 'Inter', sans-serif;">
    <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 40px;">배송/교환/환불</h2>
    <div style="max-width: 800px;">
        <div style="background: #fef3f2; border-left: 4px solid #ef4444; padding: 24px; margin-bottom: 30px; border-radius: 8px;">
            <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px;">📦 배송/교환/환불 안내</h3>
            <ul style="margin: 0; padding-left: 24px; line-height: 2;">
                ${shippingData.shippingItems.map(item => `<li style="font-size: 14px; color: #555;">${item}</li>`).join('')}
            </ul>
        </div>
        <div style="background: #fef3f2; border-left: 4px solid #ef4444; padding: 24px; border-radius: 8px;">
            <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px;">📦 교환 및 환불 불가 안내</h3>
            <ul style="margin: 0; padding-left: 24px; line-height: 2;">
                ${shippingData.exchangeItems.map(item => `<li style="font-size: 14px; color: #555;">${item}</li>`).join('')}
            </ul>
        </div>
    </div>
</div>`;
                break;

            case 'caution':
                title = 'CAUTION';
                htmlContent = `
<div style="padding: 60px 40px; background: #1f2937; color: white; font-family: 'Inter', sans-serif;">
    <h2 style="font-size: 32px; font-weight: 700; margin-bottom: 40px; color: #ef4444;">CAUTION</h2>
    <div style="max-width: 900px;">
        <ul style="list-style: none; padding: 0; margin-bottom: 50px;">
            ${cautionData.warnings.map(warning => `
                <li style="font-size: 14px; line-height: 1.8; margin-bottom: 16px; padding-left: 20px; position: relative;">
                    <span style="position: absolute; left: 0; color: #ef4444;">•</span>
                    ${warning}
                </li>
            `).join('')}
        </ul>
        <div style="background: #374151; padding: 30px; border-radius: 12px;">
            <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 20px;">A/S 안내</h3>
            <p style="font-size: 14px; line-height: 1.8; margin-bottom: 16px;">${cautionData.asCenter}</p>
            <p style="font-size: 14px; margin: 8px 0;"><strong>고객센터:</strong> ${cautionData.asContact}</p>
            <p style="font-size: 14px; margin: 8px 0;"><strong>카카오톡 채널:</strong> ${cautionData.asKakao}</p>
        </div>
    </div>
</div>`;
                break;
        }

        const newItem: PreviewItem = {
            id: `${type}-${Date.now()}`,
            type: 'section',
            content: htmlContent,
            title: title,
            isSelected: false
        };
        setDraggableItems(prev => [...prev, newItem]);
        alert(`${title} 템플릿이 추가되었습니다!`);
    };

    return (
        <div className="space-y-2 p-2">
            <div className="mb-1">
                <h3 className="text-xs font-bold text-gray-900">Content Cuts</h3>
                <p className="text-[9px] text-gray-500">4가지 템플릿을 편집하고 최종 프리뷰에 추가하세요</p>
            </div>

            {/* Template Selection Buttons */}
            <div className="grid grid-cols-2 gap-2">
                {[
                    { type: 'sizeGuide' as TemplateType, label: 'SIZE GUIDE', icon: '📏' },
                    { type: 'care' as TemplateType, label: '케어', icon: '💧' },
                    { type: 'shipping' as TemplateType, label: '배송/환불', icon: '📦' },
                    { type: 'caution' as TemplateType, label: 'CAUTION', icon: '⚠️' }
                ].map(({ type, label, icon }) => (
                    <button
                        key={type}
                        onClick={() => setActiveTemplate(activeTemplate === type ? null : type)}
                        className={`p-3 rounded border text-center ${activeTemplate === type
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                    >
                        <div className="text-xl mb-1">{icon}</div>
                        <div className="text-[10px] font-semibold">{label}</div>
                    </button>
                ))}
            </div>

            {/* SIZE GUIDE Editor */}
            {activeTemplate === 'sizeGuide' && (
                <div className="bg-white p-2 rounded border border-pink-200 space-y-1">
                    <h4 className="font-semibold text-[10px] mb-1">📏 SIZE GUIDE 편집</h4>
                    <div>
                        <label className="block text-[9px] font-medium mb-0.5">신발 이미지</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => setUploadedShoeImage(event.target?.result as string);
                                    reader.readAsDataURL(file);
                                }
                            }}
                            className="block w-full text-[8px] file:mr-1 file:py-0.5 file:px-1 file:rounded file:border-0 file:text-[8px] file:bg-pink-50 file:text-pink-700"
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        {[
                            { label: '가로', key: 'shoeLength' },
                            { label: '세로', key: 'shoeWidth' },
                            { label: '굽', key: 'heelHeight' }
                        ].map(({ label, key }) => (
                            <div key={key}>
                                <label className="block text-[8px] font-medium mb-0.5">{label}</label>
                                <input
                                    type="text"
                                    value={sizeGuideData[key as keyof typeof sizeGuideData]}
                                    onChange={(e) => setSizeGuideData({ ...sizeGuideData, [key]: e.target.value })}
                                    className="w-full px-1 py-0.5 text-[9px] border rounded focus:ring-1 focus:ring-pink-500"
                                />
                            </div>
                        ))}
                    </div>
                    <div>
                        <label className="block text-[8px] font-medium mb-0.5">참고사항</label>
                        <textarea
                            value={sizeGuideData.sizeNote}
                            onChange={(e) => setSizeGuideData({ ...sizeGuideData, sizeNote: e.target.value })}
                            className="w-full px-1 py-0.5 text-[9px] border rounded focus:ring-1 focus:ring-pink-500"
                            rows={2}
                        />
                    </div>
                    <button
                        onClick={() => addTemplateToPreview('sizeGuide')}
                        className="w-full py-1 bg-black text-white text-[9px] font-semibold rounded hover:bg-gray-800"
                    >
                        프리뷰에 추가
                    </button>
                </div>
            )}

            {/* CARE Editor */}
            {activeTemplate === 'care' && (
                <div className="bg-white p-2 rounded border border-pink-200 space-y-1">
                    <h4 className="font-semibold text-[10px] mb-1">💧 기타 주의 사항 편집</h4>
                    <div className="grid grid-cols-1 gap-1">
                        {careItems.map((item, idx) => (
                            <div key={idx} className="p-1 bg-gray-50 rounded space-y-0.5">
                                <div className="text-sm">{item.icon}</div>
                                <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => {
                                        const newItems = [...careItems];
                                        newItems[idx].title = e.target.value;
                                        setCareItems(newItems);
                                    }}
                                    className="w-full px-1 py-0.5 text-[9px] font-semibold border rounded focus:ring-1 focus:ring-pink-500"
                                />
                                <textarea
                                    value={item.desc}
                                    onChange={(e) => {
                                        const newItems = [...careItems];
                                        newItems[idx].desc = e.target.value;
                                        setCareItems(newItems);
                                    }}
                                    className="w-full px-1 py-0.5 text-[8px] border rounded focus:ring-1 focus:ring-pink-500"
                                    rows={2}
                                />
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => addTemplateToPreview('care')}
                        className="w-full py-1 bg-black text-white text-[9px] font-semibold rounded hover:bg-gray-800"
                    >
                        프리뷰에 추가
                    </button>
                </div>
            )}

            {/* SHIPPING Editor */}
            {activeTemplate === 'shipping' && (
                <div className="bg-white p-2 rounded border border-pink-200 space-y-1">
                    <h4 className="font-semibold text-[10px] mb-1">📦 배송/교환/환불 편집</h4>
                    <div className="space-y-1">
                        <div>
                            <label className="block text-[8px] font-medium mb-0.5">배송/교환/환불 안내</label>
                            {shippingData.shippingItems.map((item, idx) => (
                                <textarea
                                    key={idx}
                                    value={item}
                                    onChange={(e) => {
                                        const newItems = [...shippingData.shippingItems];
                                        newItems[idx] = e.target.value;
                                        setShippingData({ ...shippingData, shippingItems: newItems });
                                    }}
                                    className="w-full px-1 py-0.5 text-[9px] border rounded mb-0.5 focus:ring-1 focus:ring-pink-500"
                                    rows={1}
                                />
                            ))}
                        </div>
                        <div>
                            <label className="block text-[8px] font-medium mb-0.5">교환 및 환불 불가 안내</label>
                            {shippingData.exchangeItems.map((item, idx) => (
                                <textarea
                                    key={idx}
                                    value={item}
                                    onChange={(e) => {
                                        const newItems = [...shippingData.exchangeItems];
                                        newItems[idx] = e.target.value;
                                        setShippingData({ ...shippingData, exchangeItems: newItems });
                                    }}
                                    className="w-full px-1 py-0.5 text-[9px] border rounded mb-0.5 focus:ring-1 focus:ring-pink-500"
                                    rows={1}
                                />
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={() => addTemplateToPreview('shipping')}
                        className="w-full py-1 bg-black text-white text-[9px] font-semibold rounded hover:bg-gray-800"
                    >
                        프리뷰에 추가
                    </button>
                </div>
            )}

            {/* CAUTION Editor */}
            {activeTemplate === 'caution' && (
                <div className="bg-white p-2 rounded border border-pink-200 space-y-1">
                    <h4 className="font-semibold text-[10px] mb-1">⚠️ CAUTION 편집</h4>
                    <div className="space-y-1">
                        <div>
                            <label className="block text-[8px] font-medium mb-0.5">주의사항</label>
                            {cautionData.warnings.map((warning, idx) => (
                                <textarea
                                    key={idx}
                                    value={warning}
                                    onChange={(e) => {
                                        const newWarnings = [...cautionData.warnings];
                                        newWarnings[idx] = e.target.value;
                                        setCautionData({ ...cautionData, warnings: newWarnings });
                                    }}
                                    className="w-full px-1 py-0.5 text-[9px] border rounded mb-0.5 focus:ring-1 focus:ring-pink-500"
                                    rows={2}
                                />
                            ))}
                        </div>
                        <div>
                            <label className="block text-[8px] font-medium mb-0.5">A/S 센터</label>
                            <textarea
                                value={cautionData.asCenter}
                                onChange={(e) => setCautionData({ ...cautionData, asCenter: e.target.value })}
                                className="w-full px-1 py-0.5 text-[9px] border rounded focus:ring-1 focus:ring-pink-500"
                                rows={1}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                            <div>
                                <label className="block text-[8px] font-medium mb-0.5">고객센터</label>
                                <input
                                    type="text"
                                    value={cautionData.asContact}
                                    onChange={(e) => setCautionData({ ...cautionData, asContact: e.target.value })}
                                    className="w-full px-1 py-0.5 text-[9px] border rounded focus:ring-1 focus:ring-pink-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] font-medium mb-0.5">카카오톡</label>
                                <input
                                    type="text"
                                    value={cautionData.asKakao}
                                    onChange={(e) => setCautionData({ ...cautionData, asKakao: e.target.value })}
                                    className="w-full px-1 py-0.5 text-[9px] border rounded focus:ring-1 focus:ring-pink-500"
                                />
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => addTemplateToPreview('caution')}
                        className="w-full py-1 bg-black text-white text-[9px] font-semibold rounded hover:bg-gray-800"
                    >
                        프리뷰에 추가
                    </button>
                </div>
            )}

            {/* Instructions when no template selected */}
            {!activeTemplate && (
                <div className="text-center py-4 bg-gray-50 rounded border border-dashed border-gray-300">
                    <p className="text-[10px] font-medium text-gray-700">위에서 템플릿을 선택하세요</p>
                    <p className="text-[8px] text-gray-500 mt-0.5">4가지 템플릿을 편집하고 프리뷰에 추가할 수 있습니다</p>
                </div>
            )}
        </div>
    );
};

export default Step5FinalReview;
