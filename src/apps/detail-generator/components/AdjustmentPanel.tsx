import React, { useState, useRef } from 'react';
import { generateAICopywriting } from '../services/geminiAICopywriter';
import { prepareImageForReplacement, batchShoeReplacement } from '../services/shoeReplacementService';
import ModelChapterPanel from './ModelChapterPanel';
import ProductEnhancementPanel from './ProductEnhancementPanel';
import ContentGeneratorPanel from './ContentGeneratorPanel';
import { TextElement } from './PreviewRenderer';
import { FieldToggleControl } from './FieldToggleControl';

interface AdjustmentPanelProps {
    data: any;
    onUpdate: (newData: any) => void;
    showAIAnalysis?: boolean;
    onToggleAIAnalysis?: () => void;
    onAddSection?: () => void;
    activeSection?: string;
    textElements?: TextElement[];
    onAddTextElement?: (text: TextElement) => void;
    onUpdateTextElement?: (id: string, prop: keyof TextElement, value: any) => void;
    onDeleteTextElement?: (id: string) => void;
    onAddSpacerSection?: () => void;
    onAddSectionWithImage?: (imageUrl: string, sectionName?: string) => void;
}

type Section = 'hero' | 'products' | 'models' | 'contents' | 'closeup';

const HERO_FIELDS = [
    { id: 'brandLine', label: '브랜드/라인명', defaultSize: 12, aiHint: '🤖 AI가 브랜드/라인명을 추론합니다' },
    { id: 'productName', label: '제품명', defaultSize: 32, aiHint: '🤖 AI가 제품명을 생성합니다' },
    { id: 'subName', label: '서브네임', defaultSize: 18, aiHint: '🤖 AI가 서브네임을 완성합니다' },
    { id: 'stylingMatch', label: '룩/매칭 정보', defaultSize: 14, aiHint: '🤖 AI가 매칭 정보를 작성합니다', multiline: true },
    { id: 'craftsmanship', label: '제작/소재 정보', defaultSize: 14, aiHint: '🤖 AI가 소재 설명을 생성합니다', multiline: true },
    { id: 'technology', label: '⚙️ 테크놀로지', defaultSize: 14, aiHint: '🤖 AI가 기술 정보를 추천합니다' },
    { id: 'productSpec', label: '📋 Product Spec', defaultSize: 13, isSpec: true },
    { id: 'heightSpec', label: '👟 키높이 스펙', defaultSize: 16, isHeightSpec: true },
    { id: 'sizeGuide', label: '📏 사이즈 가이드', defaultSize: 14, aiHint: '🤖 AI가 사이즈 가이드를 작성합니다', multiline: true },
];

const DEFAULT_FIELD_SETTINGS: Record<string, { visible: boolean; fontSize: number }> = {};
HERO_FIELDS.forEach(f => { DEFAULT_FIELD_SETTINGS[f.id] = { visible: true, fontSize: f.defaultSize }; });
const DEFAULT_FIELD_ORDER = HERO_FIELDS.map(f => f.id);

const generateStandaloneHeroHTML = (data: any): string => {
    const content = data.heroTextContent || {};
    const settings = data.heroFieldSettings || DEFAULT_FIELD_SETTINGS;
    const order = data.heroFieldOrder || DEFAULT_FIELD_ORDER;
    const isVisible = (field: string) => settings[field]?.visible !== false;
    const getFontSize = (field: string) => settings[field]?.fontSize || 14;
    const renderField = (fieldId: string): string => {
        if (!isVisible(fieldId)) return '';
        switch (fieldId) {
            case 'brandLine': return `<div style="font-size:${getFontSize('brandLine')}px;letter-spacing:1px;color:#888;margin-bottom:8px;font-weight:500;">${content.brandLine || ''}</div>`;
            case 'productName': return `<h1 style="font-size:${getFontSize('productName')}px;font-weight:800;margin:0 0 16px 0;line-height:1.2;">${content.productName || ''}${isVisible('subName') && content.subName ? ` <span style="font-weight:300;color:#ccc;">—</span> <span style="color:#666;font-size:${getFontSize('subName')}px;">${content.subName}</span>` : ''}</h1>`;
            case 'stylingMatch': return content.stylingMatch ? `<div style="margin-bottom:12px;font-size:${getFontSize('stylingMatch')}px;line-height:1.7;color:#444;">${content.stylingMatch}</div>` : '';
            case 'craftsmanship': return content.craftsmanship ? `<div style="margin-bottom:16px;font-size:${getFontSize('craftsmanship')}px;line-height:1.7;color:#444;">${content.craftsmanship}</div>` : '';
            case 'technology': return content.technology ? `<div style="background:#f9fafb;border-left:4px solid #111;padding:16px;margin-bottom:16px;border-radius:0 8px 8px 0;"><h3 style="margin:0 0 8px 0;font-size:14px;font-weight:700;color:#111;">Technology</h3><p style="margin:0;font-size:${getFontSize('technology')}px;color:#555;line-height:1.6;">${content.technology}</p></div>` : '';
            case 'productSpec': return `<div style="margin-bottom:16px;"><h3 style="font-size:11px;font-weight:800;letter-spacing:1px;margin-bottom:12px;text-transform:uppercase;color:#111;">Product Spec</h3><table style="width:100%;border-collapse:collapse;font-size:${getFontSize('productSpec')}px;border-top:2px solid #eee;"><tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#9ca3af;width:80px;">Color</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:500;">${content.specColor || '-'}</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#9ca3af;width:80px;">Upper</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:500;">${content.specUpper || '-'}</td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#9ca3af;">Lining</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:500;">${content.specLining || '-'}</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#9ca3af;">Outsole</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:500;">${content.specOutsole || '-'}</td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#9ca3af;">Origin</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:500;">${content.specOrigin || '-'}</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#9ca3af;">굽 높이</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:500;">${content.heelHeight || '-'}</td></tr></table></div>`;
            case 'heightSpec': return `<div style="margin-bottom:16px;"><h3 style="font-size:11px;font-weight:800;letter-spacing:1px;margin-bottom:12px;text-transform:uppercase;color:#111;border-bottom:2px solid #111;padding-bottom:4px;display:inline-block;">Height Spec</h3><table style="width:100%;border:1px solid #e5e7eb;border-radius:12px;border-collapse:separate;"><tr><td style="text-align:center;padding:20px;width:33%;"><div style="font-size:11px;color:#6b7280;margin-bottom:4px;">아웃솔 (Outsole)</div><div style="font-weight:700;font-size:${getFontSize('heightSpec')}px;color:#111;">${content.outsole || '3'} CM</div></td><td style="text-align:center;padding:20px;width:33%;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;"><div style="font-size:11px;color:#6b7280;margin-bottom:4px;">인솔 (Insole)</div><div style="font-weight:700;font-size:${getFontSize('heightSpec')}px;color:#111;">${content.insole || '1.5'} CM</div></td><td style="text-align:center;padding:20px;width:33%;"><div style="font-size:11px;color:#ef4444;margin-bottom:4px;font-weight:600;">총 키높이 (Total)</div><div style="font-weight:800;font-size:${getFontSize('heightSpec') + 2}px;color:#ef4444;">${content.totalHeight || '4.5'} CM</div></td></tr></table></div>`;
            case 'sizeGuide': return content.sizeGuide ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;display:flex;align-items:flex-start;"><div style="background:#ef4444;color:white;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-right:12px;flex-shrink:0;font-size:11px;">✓</div><div><h3 style="margin:0 0 4px 0;font-size:12px;font-weight:700;color:#ef4444;text-transform:uppercase;">Size Guide</h3><p style="margin:0;font-size:${getFontSize('sizeGuide')}px;line-height:1.5;color:#4b5563;">${content.sizeGuide.replace(/\n/g, '<br>')}</p></div></div>` : '';
            default: return '';
        }
    };
    const fieldsHtml = order.map((id: string) => renderField(id)).filter(Boolean).join('\n    ');
    return `<!-- 상품 상세 설명 HTML - 무신사/네이버 등록 가능 -->\n<div style="max-width:860px;margin:0 auto;padding:20px;font-family:'Noto Sans KR',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;line-height:1.6;">\n    ${fieldsHtml}\n</div>`;
};

export default function AdjustmentPanel({ data, onUpdate, activeSection: previewActiveSection, textElements = [], onAddTextElement, onUpdateTextElement, onDeleteTextElement, onAddSectionWithImage }: AdjustmentPanelProps) {
    const [activeSection, setActiveSection] = useState<Section>('hero');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
    const [draggedField, setDraggedField] = useState<string | null>(null);

    // 신발 교체 및 제품 관리 상태
    const [selectedProductIndex, setSelectedProductIndex] = useState<number>(0);
    const [productDragActive, setProductDragActive] = useState(false);
    const [isReplacingShoes, setIsReplacingShoes] = useState(false);
    const [replaceProgress, setReplaceProgress] = useState({ current: 0, total: 0 });
    const productInputRef = useRef<HTMLInputElement>(null);

    const fieldSettings = data.heroFieldSettings || DEFAULT_FIELD_SETTINGS;
    const fieldOrder = data.heroFieldOrder || DEFAULT_FIELD_ORDER;
    const productFiles = data.productFiles || [];

    const updateHeroContent = (field: string, value: string) => {
        onUpdate({ ...data, heroTextContent: { ...data.heroTextContent, [field]: value } });
    };
    const updateFieldSetting = (field: string, setting: 'visible' | 'fontSize', value: boolean | number) => {
        onUpdate({ ...data, heroFieldSettings: { ...fieldSettings, [field]: { ...fieldSettings[field], [setting]: value } } });
    };
    const handleDragStart = (fieldId: string) => (e: React.DragEvent) => { setDraggedField(fieldId); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
    const handleDrop = (targetFieldId: string) => (e: React.DragEvent) => {
        e.preventDefault();
        if (!draggedField || draggedField === targetFieldId) return;
        const newOrder = [...fieldOrder];
        const draggedIdx = newOrder.indexOf(draggedField);
        const targetIdx = newOrder.indexOf(targetFieldId);
        if (draggedIdx !== -1 && targetIdx !== -1) { newOrder.splice(draggedIdx, 1); newOrder.splice(targetIdx, 0, draggedField); onUpdate({ ...data, heroFieldOrder: newOrder }); }
        setDraggedField(null);
    };

    const handleAIAnalysis = async () => {
        setIsGeneratingAI(true);
        try {
            const productFile = productFiles[0];
            if (!productFile) { alert('제품 이미지가 없습니다.'); return; }
            const productImage = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = (e) => resolve(e.target?.result); reader.onerror = reject; reader.readAsDataURL(productFile); });
            const aiCopy = await generateAICopywriting(productImage);
            onUpdate({ ...data, heroTextContent: { ...data.heroTextContent, ...aiCopy } });
        } catch (error) { console.error('AI 분석 실패:', error); alert('AI 분석에 실패했습니다.'); }
        finally { setIsGeneratingAI(false); }
    };

    // 제품(신발) 드롭존 핸들러 (다중 파일 지원)
    const handleProductDragOver = (e: React.DragEvent) => { e.preventDefault(); setProductDragActive(true); };
    const handleProductDragLeave = () => setProductDragActive(false);
    const handleProductDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setProductDragActive(false);
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
            const newFiles = [...productFiles, ...files].slice(0, 10); // 최대 10장
            onUpdate({ ...data, productFiles: newFiles });

            // 프리뷰에 원본 자동 추가 (사용자 요청: "업로드된 제품은 사이즈가 꽉차게 한장씩 보여서")
            if (onAddSectionWithImage) {
                for (const file of files) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        const result = ev.target?.result as string;
                        onAddSectionWithImage(result, 'product_original');
                    };
                    reader.readAsDataURL(file);
                }
            }
        }
    };
    const handleProductFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
            const newFiles = [...productFiles, ...files].slice(0, 10);
            onUpdate({ ...data, productFiles: newFiles });

            // 프리뷰에 원본 자동 추가
            if (onAddSectionWithImage) {
                for (const file of files) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        const result = ev.target?.result as string;
                        onAddSectionWithImage(result, 'product_original');
                    };
                    reader.readAsDataURL(file);
                }
            }
        }
    };

    // 선택된 제품 삭제
    const removeProductFile = (index: number) => {
        const newFiles = [...productFiles];
        newFiles.splice(index, 1);
        onUpdate({ ...data, productFiles: newFiles });
        if (selectedProductIndex >= newFiles.length) setSelectedProductIndex(Math.max(0, newFiles.length - 1));
    };

    // VFX 신발 교체 실행
    const handleShoeReplacement = async () => {
        const selectedFile = productFiles[selectedProductIndex];
        if (!selectedFile) { alert('교체할 제품(신발) 이미지를 선택하세요.'); return; }

        // 프리뷰의 모든 이미지 URL 수집
        const allImageUrls: string[] = [];
        Object.entries(data.imageUrls || {}).forEach(([key, value]) => {
            if (key !== 'products' && typeof value === 'string' && value.startsWith('data:')) {
                allImageUrls.push(value);
            }
        });

        if (allImageUrls.length === 0) { alert('프리뷰에 이미지가 없습니다.'); return; }

        setIsReplacingShoes(true);
        setReplaceProgress({ current: 0, total: allImageUrls.length });

        try {
            // 제품 이미지 전처리
            const reader = new FileReader();
            reader.readAsDataURL(selectedFile);
            await new Promise(resolve => reader.onload = resolve);
            const productImage = reader.result as string;
            const productBase64 = productImage.includes('base64,') ? productImage.split('base64,')[1] : productImage;

            const results = await batchShoeReplacement(
                allImageUrls,
                productBase64,
                (current, total) => setReplaceProgress({ current, total })
            );

            // 결과를 imageUrls에 반영
            const newImageUrls = { ...data.imageUrls };
            let successCount = 0;
            results.forEach((result, idx) => {
                if (result.result) {
                    // 원본 URL에 해당하는 키 찾아서 교체
                    Object.entries(newImageUrls).forEach(([key, url]) => {
                        if (url === allImageUrls[idx]) {
                            newImageUrls[key] = result.result;
                            successCount++;
                        }
                    });
                }
            });

            if (successCount > 0) {
                onUpdate({ ...data, imageUrls: newImageUrls });
                alert(`${successCount}개 이미지의 신발이 교체되었습니다!`);
            } else {
                alert('신발 교체에 실패했습니다. 콘솔을 확인하세요.');
            }
        } catch (error) {
            console.error('신발 교체 오류:', error);
            alert('신발 교체 중 오류가 발생했습니다.');
        } finally {
            setIsReplacingShoes(false);
            setReplaceProgress({ current: 0, total: 0 });
        }
    };

    const handleAddText = () => {
        if (!onAddTextElement) return;
        const newText: TextElement = { id: `text-${Date.now()}`, sectionId: previewActiveSection || 'hero', content: '텍스트를 입력하세요', top: 50, left: 50, width: 200, height: 50, fontSize: 16, fontFamily: 'Noto Sans KR', color: '#000000', fontWeight: 'normal', textAlign: 'left' };
        onAddTextElement(newText);
        setSelectedTextId(newText.id);
    };

    const selectedText = textElements.find(t => t.id === selectedTextId);

    const renderField = (fieldDef: typeof HERO_FIELDS[0]) => {
        const { id, label, defaultSize, aiHint, multiline, isSpec, isHeightSpec } = fieldDef;
        const isVisible = fieldSettings[id]?.visible !== false;
        const fontSize = fieldSettings[id]?.fontSize || defaultSize;

        if (isSpec) {
            return (
                <FieldToggleControl key={id} fieldId={id} label={label} isVisible={isVisible} onToggleVisibility={() => updateFieldSetting(id, 'visible', !isVisible)} fontSize={fontSize} onFontSizeChange={(size: number) => updateFieldSetting(id, 'fontSize', size)} draggable onDragStart={handleDragStart(id)} onDragOver={handleDragOver} onDrop={handleDrop(id)}>
                    <div className="grid grid-cols-2 gap-1">
                        <div><label className="text-[9px] text-gray-500">Color 🤖</label><input className="w-full border p-0.5 rounded text-xs" value={data.heroTextContent?.specColor || ''} onChange={(e) => updateHeroContent('specColor', e.target.value)} /></div>
                        <div><label className="text-[9px] text-gray-500">Upper 🤖</label><input className="w-full border p-0.5 rounded text-xs" value={data.heroTextContent?.specUpper || ''} onChange={(e) => updateHeroContent('specUpper', e.target.value)} /></div>
                        <div><label className="text-[9px] text-gray-500">Lining 🤖</label><input className="w-full border p-0.5 rounded text-xs" value={data.heroTextContent?.specLining || ''} onChange={(e) => updateHeroContent('specLining', e.target.value)} /></div>
                        <div><label className="text-[9px] text-gray-500">Outsole 🤖</label><input className="w-full border p-0.5 rounded text-xs" value={data.heroTextContent?.specOutsole || ''} onChange={(e) => updateHeroContent('specOutsole', e.target.value)} /></div>
                        <div><label className="text-[9px] text-gray-500">Origin 🤖</label><input className="w-full border p-0.5 rounded text-xs" value={data.heroTextContent?.specOrigin || ''} onChange={(e) => updateHeroContent('specOrigin', e.target.value)} /></div>
                        <div><label className="text-[9px] text-gray-500">굽 높이 🤖</label><input className="w-full border p-0.5 rounded text-xs" value={data.heroTextContent?.heelHeight || ''} onChange={(e) => updateHeroContent('heelHeight', e.target.value)} /></div>
                    </div>
                </FieldToggleControl>
            );
        }
        if (isHeightSpec) {
            return (
                <FieldToggleControl key={id} fieldId={id} label={label} isVisible={isVisible} onToggleVisibility={() => updateFieldSetting(id, 'visible', !isVisible)} fontSize={fontSize} onFontSizeChange={(size: number) => updateFieldSetting(id, 'fontSize', size)} draggable onDragStart={handleDragStart(id)} onDragOver={handleDragOver} onDrop={handleDrop(id)}>
                    <div className="grid grid-cols-3 gap-1">
                        <div><label className="text-[9px] text-gray-500">아웃솔 🤖</label><input className="w-full border p-0.5 rounded text-xs" value={data.heroTextContent?.outsole || ''} onChange={(e) => updateHeroContent('outsole', e.target.value)} placeholder="3cm" /></div>
                        <div><label className="text-[9px] text-gray-500">인솔 🤖</label><input className="w-full border p-0.5 rounded text-xs" value={data.heroTextContent?.insole || ''} onChange={(e) => updateHeroContent('insole', e.target.value)} placeholder="1.5cm" /></div>
                        <div><label className="text-[9px] text-orange-600 font-bold">총 키높이 🤖</label><input className="w-full border border-orange-300 bg-orange-50 p-0.5 rounded text-xs font-bold" value={data.heroTextContent?.totalHeight || ''} onChange={(e) => updateHeroContent('totalHeight', e.target.value)} placeholder="4.5cm" /></div>
                    </div>
                </FieldToggleControl>
            );
        }
        return (
            <FieldToggleControl key={id} fieldId={id} label={label} isVisible={isVisible} onToggleVisibility={() => updateFieldSetting(id, 'visible', !isVisible)} fontSize={fontSize} onFontSizeChange={(size: number) => updateFieldSetting(id, 'fontSize', size)} draggable onDragStart={handleDragStart(id)} onDragOver={handleDragOver} onDrop={handleDrop(id)}>
                {multiline ? <textarea rows={2} className="w-full border p-1 rounded text-sm resize-none" value={data.heroTextContent?.[id] || ''} onChange={(e) => updateHeroContent(id, e.target.value)} placeholder={aiHint} />
                    : <input className="w-full border p-1 rounded text-sm" value={data.heroTextContent?.[id] || ''} onChange={(e) => updateHeroContent(id, e.target.value)} placeholder={aiHint} />}
            </FieldToggleControl>
        );
    };

    const orderedFields = fieldOrder.map((id: string) => HERO_FIELDS.find(f => f.id === id)).filter(Boolean);

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4"><h2 className="text-lg font-bold">콘텐츠 편집 패널</h2></div>
            <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50">
                <nav className="grid grid-cols-5 gap-1 p-2">
                    {[{ id: 'hero' as Section, label: '히어로', emoji: '🎯' }, { id: 'products' as Section, label: '제품', emoji: '📦' }, { id: 'models' as Section, label: '모델', emoji: '👔' }, { id: 'contents' as Section, label: '콘텐츠', emoji: '📝' }, { id: 'closeup' as Section, label: '디테일', emoji: '🔍' }].map(section => (
                        <button key={section.id} onClick={() => setActiveSection(section.id)} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeSection === section.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}><div>{section.emoji}</div><div>{section.label}</div></button>
                    ))}
                </nav>
            </div>
            <div className="flex-grow overflow-y-auto p-3">
                {activeSection === 'hero' && (
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-sm text-blue-900">🎯 히어로 섹션</h3>
                            <button onClick={handleAIAnalysis} disabled={isGeneratingAI} className={`px-2 py-1 text-white text-xs font-bold rounded ${isGeneratingAI ? 'bg-gray-400' : 'bg-zinc-800 hover:bg-black'}`}>{isGeneratingAI ? '분석 중...' : '🔄 AI 재분석'}</button>
                        </div>
                        <div className="text-[10px] text-gray-400 mb-2 bg-gray-50 p-1.5 rounded">💡 필드를 드래그하여 순서를 변경할 수 있습니다</div>
                        {orderedFields.map((fieldDef: any) => renderField(fieldDef))}
                        <button onClick={() => { const heroHtml = generateStandaloneHeroHTML(data); const blob = new Blob([heroHtml], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${data.heroTextContent?.productName || 'hero'}_section.html`; a.click(); URL.revokeObjectURL(url); }} className="w-full bg-green-600 text-white font-bold py-1.5 rounded hover:bg-green-700 text-sm mt-2">📥 히어로 섹션 HTML 다운로드</button>
                    </div>
                )}
                {activeSection === 'products' && (
                    <div className="space-y-3">
                        {/* 제품 드롭존 (다중 업로드) */}
                        <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${productDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-blue-400'}`}
                            onDragOver={handleProductDragOver} onDragLeave={handleProductDragLeave} onDrop={handleProductDrop} onClick={() => productInputRef.current?.click()}>
                            <input ref={productInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleProductFileSelect} />
                            <div className="space-y-1">
                                <div className="text-3xl">📦</div>
                                <div className="text-sm font-bold text-gray-700">제품 이미지 업로드 (최대 10장)</div>
                                <div className="text-xs text-gray-400">드래그 또는 클릭하여 추가</div>
                            </div>
                        </div>

                        {/* 업로드된 제품 목록 */}
                        {productFiles.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs font-bold text-gray-700 mb-2">업로드된 제품 ({productFiles.length}/10)</div>
                                <div className="grid grid-cols-4 gap-2">
                                    {productFiles.map((file: File, idx: number) => (
                                        <div key={idx} onClick={() => setSelectedProductIndex(idx)}
                                            className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer ${selectedProductIndex === idx ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
                                            <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt={`Product ${idx}`} />
                                            <button onClick={(e) => { e.stopPropagation(); removeProductFile(idx); }} className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-red-500">×</button>
                                            {selectedProductIndex === idx && <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-[9px] text-center py-0.5">선택됨</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 신발 교체 버튼 */}
                        <button onClick={handleShoeReplacement} disabled={productFiles.length === 0 || isReplacingShoes}
                            className={`w-full py-3 rounded-xl font-bold text-white transition-all ${productFiles.length === 0 || isReplacingShoes ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg'}`}>
                            {isReplacingShoes ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    VFX 신발 교체 중... ({replaceProgress.current}/{replaceProgress.total})
                                </span>
                            ) : '👟 프리뷰 전체 신발 교체 (VFX)'}
                        </button>

                        <div className="text-[10px] text-gray-400 bg-gray-50 p-2 rounded">
                            💡 선택된 제품 이미지로 프리뷰의 모든 신발을 교체합니다.
                        </div>

                        {/* 제품 효과 패널 */}
                        <ProductEnhancementPanel productFiles={productFiles} onResultsUpdate={(results: any) => { const doneResults = results.filter((r: any) => r.status === 'done' && r.url); if (doneResults.length > 0) { const newUrls = doneResults.map((r: any) => r.url!); const currentUrls = data.imageUrls?.products || []; const uniqueNewUrls = newUrls.filter((url: string) => !currentUrls.includes(url)); if (uniqueNewUrls.length > 0) { onUpdate({ ...data, imageUrls: { ...data.imageUrls, products: [...currentUrls, ...uniqueNewUrls] } }); } } }} onAddSectionWithImage={onAddSectionWithImage} />
                    </div>
                )}
                {activeSection === 'models' && <div className="space-y-4"><ModelChapterPanel data={data} onUpdate={onUpdate} /></div>}
                {activeSection === 'contents' && <ContentGeneratorPanel productImages={data.imageUrls?.products || []} />}
                {activeSection === 'closeup' && (
                    <div className="space-y-4">
                        <div className="bg-white border rounded-xl p-4 shadow-sm">
                            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-800">텍스트 편집</h3><button onClick={handleAddText} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700">+ 텍스트 추가</button></div>
                            <div className="text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded">현재 선택된 섹션: <span className="font-bold text-blue-600">{previewActiveSection || '없음'}</span></div>
                            <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto">
                                {textElements.map((text: TextElement) => (<div key={text.id} onClick={() => setSelectedTextId(text.id)} className={`p-2 border rounded cursor-pointer flex justify-between items-center ${selectedTextId === text.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}><span className="text-xs truncate max-w-[150px]">{text.content}</span><button onClick={(e) => { e.stopPropagation(); onDeleteTextElement?.(text.id); }} className="text-gray-400 hover:text-red-500">🗑️</button></div>))}
                                {textElements.length === 0 && <div className="text-center text-gray-400 text-xs py-4">추가된 텍스트가 없습니다.</div>}
                            </div>
                            {selectedText && onUpdateTextElement && (<div className="border-t pt-4 space-y-3"><div><label className="block text-xs font-bold text-gray-700 mb-1">내용</label><textarea className="w-full border p-2 rounded text-sm" rows={3} value={selectedText.content} onChange={(e) => onUpdateTextElement(selectedText.id, 'content', e.target.value)} /></div><div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-bold text-gray-700 mb-1">크기</label><input type="number" className="w-full border p-2 rounded text-sm" value={selectedText.fontSize} onChange={(e) => onUpdateTextElement(selectedText.id, 'fontSize', parseInt(e.target.value))} /></div><div><label className="block text-xs font-bold text-gray-700 mb-1">색상</label><input type="color" className="w-full h-[38px] border p-1 rounded" value={selectedText.color || '#000000'} onChange={(e) => onUpdateTextElement(selectedText.id, 'color', e.target.value)} /></div></div></div>)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}