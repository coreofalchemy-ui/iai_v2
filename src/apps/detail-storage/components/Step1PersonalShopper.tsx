import React, { useState, useCallback } from 'react';
import { extractProductInfoFromImages } from '../services/geminiService';

interface UploadedImage {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

interface ProductDetailInfo {
  lineName: string;
  productName: string;
  color: string;
  upperMaterial: string;
  liningMaterial: string;
  soleMaterial: string;
  insoleMaterial: string;
  outsoleHeight: string;
  insoleHeight: string;
  sizeSpec: string;
  origin: string;
  intro: string;
  style: string;
  tech: string;
  techLabel?: string;
  techTitle?: string;
  techDesc?: string;
  // New fields
  estimatedWidth?: string;
  estimatedLength?: string;
  estimatedHeight?: string;
  careGuide?: string;
}

interface Step1PersonalShopperProps {
  onImagesChange?: (images: UploadedImage[]) => void;
  onDataChange?: (data: ProductDetailInfo) => void;
  onStartBackgroundProcessing?: () => Promise<void>;
  initialData?: ProductDetailInfo | null;
  initialImages?: UploadedImage[];
  onAddCustomText?: (text: string) => void;
  onNext?: () => void;
  onAddToPreview?: (content: string, type: 'section' | 'image', title?: string) => void;
}

// --- HTML Generator Functions ---

const generateLineNameHTML = (data: ProductDetailInfo) => {
  return `<div style="text-align:center;margin-bottom:8px;">
    <div style="font-size:12px;color:#666;letter-spacing:0.05em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
      ${data.lineName || 'PREMIUM COLLECTION'}
    </div>
  </div>`;
};

const generateProductNameHTML = (data: ProductDetailInfo) => {
  return `<div style="text-align:center;margin-bottom:20px;">
    <h2 style="font-size:26px;font-weight:700;margin:0;word-break:keep-all;line-height:1.3;font-family:'Inter', sans-serif;color:#111;">
      "${data.productName}"
    </h2>
  </div>`;
};

const generateIntroHTML = (data: ProductDetailInfo) => {
  return `<div style="text-align:center;margin-bottom:40px;">
    <div style="font-size:15px;color:#333;max-width:600px;margin:0 auto;word-break:keep-all;line-height:1.8;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
      ${data.intro ? data.intro.replace(/\n/g, '<br/>') : ''}
    </div>
  </div>`;
};

const generateStyleHTML = (data: ProductDetailInfo) => {
  return `<div style="margin-bottom:40px;text-align:center;">
    <p style="font-size:14px;color:#555;max-width:640px;margin:0 auto;word-break:keep-all;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
      ${data.style}
    </p>
  </div>`;
};

const generateTechHTML = (data: ProductDetailInfo) => {
  return `<div style="background-color:#f8f9fa;border-radius:8px;padding:30px;margin-bottom:40px;display:flex;align-items:center;gap:30px;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
    <div style="flex:0 0 100px;text-align:left;">
      <div style="font-size:10px;font-weight:700;color:#888;letter-spacing:0.1em;margin-bottom:6px;text-transform:uppercase;">
        ${data.techLabel || 'TECHNOLOGY'}
      </div>
      <div style="font-size:18px;font-weight:700;color:#111;font-family:'Inter', sans-serif;">
        ${data.techTitle || 'Core Tech'}
      </div>
    </div>
    <div style="flex:1;border-left:1px solid #ddd;padding-left:30px;">
      <p style="font-size:13px;color:#444;margin:0;line-height:1.6;">
        ${data.techDesc || data.tech}
      </p>
    </div>
  </div>`;
};

const generateInfoTableHTML = (data: ProductDetailInfo) => {
  return `<div style="margin-bottom:30px;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
    <h3 style="font-size:13px;font-weight:700;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:0;font-family:'Inter', sans-serif;color:#111;">
      PRODUCT INFO
    </h3>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <colgroup>
        <col style="width:20%;" />
        <col style="width:80%;" />
      </colgroup>
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:12px 0;color:#666;font-weight:500;font-family:'Inter', sans-serif;">Color</td>
        <td style="padding:12px 0;color:#111;">${data.color}</td>
      </tr>
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:12px 0;color:#666;font-weight:500;font-family:'Inter', sans-serif;">Material</td>
        <td style="padding:12px 0;color:#111;">
          <span style="margin-right:10px;">[Upper] ${data.upperMaterial}</span>
          <span style="margin-right:10px;">[Lining] ${data.liningMaterial}</span>
          <span>[Sole] ${data.soleMaterial}</span>
        </td>
      </tr>
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:12px 0;color:#666;font-weight:500;font-family:'Inter', sans-serif;">Size / Height</td>
        <td style="padding:12px 0;color:#111;">
          ${data.sizeSpec} / 굽높이 ${data.outsoleHeight} (속굽 ${data.insoleHeight})
        </td>
      </tr>
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:12px 0;color:#666;font-weight:500;font-family:'Inter', sans-serif;">Origin</td>
        <td style="padding:12px 0;color:#111;">${data.origin}</td>
      </tr>
    </table>
  </div>`;
};

const generateSizeGuideHTML = (data: ProductDetailInfo) => {
  return `<div style="background:linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);border:1px solid #ffcdd2;border-left:4px solid #ef5350;border-radius:8px;padding:20px;margin-top:30px;box-shadow:0 2px 8px rgba(239,83,80,0.05);font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
    <div style="display:flex;align-items:center;margin-bottom:8px;">
      <span style="display:inline-block;width:16px;height:16px;background:#ef5350;color:#fff;font-size:12px;text-align:center;line-height:16px;border-radius:2px;margin-right:8px;">✓</span>
      <h4 style="font-size:14px;font-weight:700;color:#d32f2f;margin:0;font-family:'Inter', sans-serif;">SIZE GUIDE</h4>
    </div>
    <p style="font-size:13px;color:#333;font-weight:700;line-height:1.6;margin:0;">
      ${data.careGuide || '정사이즈 착용을 권장합니다.'}
    </p>
  </div>`;
};

const generateFullProductHTML = (data: ProductDetailInfo) => {
  return `<!-- COA 상품 상세 정보 (Text Only) -->
<div style="font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#111;line-height:1.6;max-width:800px;margin:0 auto;padding:40px 10px;">
  ${generateLineNameHTML(data)}
  ${generateProductNameHTML(data)}
  ${generateIntroHTML(data)}
  ${data.style ? generateStyleHTML(data) : ''}
  ${generateTechHTML(data)}
  ${generateInfoTableHTML(data)}
  ${generateSizeGuideHTML(data)}
</div>`;
};

const FileDropzone: React.FC<{
  onImagesSelected: (images: UploadedImage[]) => void;
  maxFiles?: number;
  currentImages: UploadedImage[];
  onRemoveImage: (index: number) => void;
}> = ({ onImagesSelected, maxFiles = 10, currentImages, onRemoveImage }) => {
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newImages: UploadedImage[] = [];
    const remainingSlots = maxFiles - currentImages.length;
    const count = Math.min(files.length, remainingSlots);
    if (count <= 0) return;

    let processedCount = 0;
    Array.from(files).slice(0, count).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = (e.target?.result as string).split(',')[1];
        newImages.push({
          file,
          previewUrl: URL.createObjectURL(file),
          base64: base64String,
          mimeType: file.type
        });
        processedCount++;
        if (processedCount === count) {
          onImagesSelected(newImages);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [maxFiles, currentImages.length, onImagesSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  return (
    <div className="space-y-3">
      {currentImages.length < maxFiles && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer relative ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => { processFiles(e.target.files); e.target.value = ''; }}
          />
          <div className="flex flex-col items-center text-center pointer-events-none">
            <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium text-gray-700">이미지를 드롭하거나 클릭하여 업로드</p>
            <p className="text-xs text-gray-500 mt-1">최대 {maxFiles}개</p>
          </div>
        </div>
      )}

      {currentImages.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {currentImages.map((img, idx) => (
            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
              <img src={img.previewUrl} alt="preview" className="w-full h-full object-cover" />
              <button
                onClick={() => onRemoveImage(idx)}
                className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Step1PersonalShopper: React.FC<Step1PersonalShopperProps> = ({
  onImagesChange, onDataChange, onStartBackgroundProcessing, initialData, initialImages, onAddCustomText, onAddToPreview
}) => {
  const initialInfo: ProductDetailInfo = {
    lineName: '', productName: '', color: '', upperMaterial: '', liningMaterial: '',
    soleMaterial: '', insoleMaterial: '', outsoleHeight: '', insoleHeight: '',
    sizeSpec: '230-280mm', origin: 'Made in Korea', intro: '', style: '', tech: '',
    techLabel: 'TECHNOLOGY', techTitle: 'Premium Material',
    techDesc: '고급 소재를 사용하여 편안한 착화감을 제공합니다.',
    estimatedWidth: '', estimatedLength: '', estimatedHeight: '', careGuide: ''
  };

  const [info, setInfo] = useState<ProductDetailInfo>(initialData || initialInfo);
  const [images, setImages] = useState<UploadedImage[]>(initialImages || []);
  const [analyzing, setAnalyzing] = useState(false);
  const [customText, setCustomText] = useState('');

  React.useEffect(() => { if (onImagesChange) onImagesChange(images); }, [images, onImagesChange]);
  React.useEffect(() => { if (onDataChange) onDataChange(info); }, [info, onDataChange]);

  const handleAutoFill = async () => {
    if (images.length === 0) {
      alert("먼저 제품 이미지를 업로드해주세요.");
      return;
    }

    setAnalyzing(true);
    try {
      const result = await extractProductInfoFromImages(images.map(img => ({ base64: img.base64, mimeType: img.mimeType })), `
럭셔리 브랜드 카피라이터 및 제품 분석가로서 제품 이미지를 분석하여 JSON으로 응답:
{
  "lineName": "라인명 (영문)", 
  "productName": "제품명 (영문)", 
  "intro": "스타일링 제안: 어떤 룩(캐주얼, 포멀 등)을 즐겨 입는 사람에게 추천하는지, 어떤 바지나 자켓과 매칭하면 좋은지 구체적으로 제안하는 매력적인 문구 (한국어)",
  "style": "디자인 설명: 제품의 디자인 컨셉, 쉐입, 제작 방식, 디테일한 특징을 설명 (한국어)",
  "techLabel": "기술 라벨 (영문, 예: TECHNOLOGY)",
  "techTitle": "기술명 (영문, 예: CarbonLite)",
  "techDesc": "기술 설명: 소재나 기술의 기능적 장점 설명 (한국어)",
  "color": "컬러 (한국어)", 
  "upper": "갑피 소재 (한국어)", 
  "lining": "안감 (한국어)", 
  "sole": "밑창 (한국어)", 
  "insole": "깔창 (한국어)",
  "outsoleHeightCm": "아웃솔 높이 (숫자만)", 
  "insoleHeightCm": "인솔 높이 (숫자만)", 
  "sizeSpec": "사이즈 범위 (예: 230-280mm)",
  "origin": "원산지 (한국어)",
  "careGuide": "사이즈 가이드: 사이즈 선택 팁 (정사이즈, 발볼 넓음 등) (한국어)",
  "estimatedWidth": "발볼 너비 (예: 10cm)",
  "estimatedLength": "총 길이 (예: 27cm)",
  "estimatedHeight": "총 높이 (예: 12cm)"
}
`);

      // 소재 타입 감지 (가죽 vs 합성피혁)
      const materialLower = (result.upper + result.lining + result.sole).toLowerCase();
      const isLeather = materialLower.includes('가죽') || materialLower.includes('leather') || materialLower.includes('천연');
      const isSynthetic = materialLower.includes('합성') || materialLower.includes('인조') || materialLower.includes('pu') || materialLower.includes('synthetic');

      let materialType = isLeather ? '천연가죽' : (isSynthetic ? '합성피혁' : '기타');

      const newInfo = {
        ...info,
        lineName: result.lineName,
        productName: result.productName,
        color: result.color,
        upperMaterial: result.upper,
        liningMaterial: result.lining,
        soleMaterial: result.sole,
        insoleMaterial: result.insole,
        outsoleHeight: result.outsoleHeightCm,
        insoleHeight: result.insoleHeightCm,
        intro: result.intro,
        style: result.style,
        tech: result.tech,
        // 소재 타입에 따른 자동 설정
        techLabel: materialType === '천연가죽' ? 'PREMIUM LEATHER' : 'ADVANCED MATERIAL',
        techTitle: materialType === '천연가죽' ? 'Natural Leather' : 'Synthetic Premium',
        techDesc: materialType === '천연가죽'
          ? '최고급 천연 가죽을 사용하여 통기성과 내구성이 뛰어납니다.'
          : '고급 합성 소재로 가볍고 관리가 용이합니다.',
        estimatedWidth: result.estimatedWidth,
        estimatedLength: result.estimatedLength,
        estimatedHeight: result.estimatedHeight,
        careGuide: result.careGuide
      };

      setInfo(newInfo);

      alert(
        `✅ AI 분석 완료!\n\n` +
        `📦 제품명: ${result.productName} \n` +
        `내용을 확인하고 '프리뷰에 추가' 버튼을 눌러주세요.`
      );
    } catch (err) {
      console.error(err);
      alert("AI 분석 중 오류가 발생했습니다: " + (err as Error).message);
    }
    finally { setAnalyzing(false); }
  };

  const handleManualAddToPreview = () => {
    if (!onAddToPreview) return;

    // 1. 텍스트 정보 개별 추가
    if (info.lineName) onAddToPreview(generateLineNameHTML(info), 'section', '소제목');
    if (info.productName) onAddToPreview(generateProductNameHTML(info), 'section', '대제목');
    if (info.intro) onAddToPreview(generateIntroHTML(info), 'section', '설명 1');
    if (info.style) onAddToPreview(generateStyleHTML(info), 'section', '설명 2');
    if (info.techLabel || info.techTitle) onAddToPreview(generateTechHTML(info), 'section', '기술 뱃지');
    onAddToPreview(generateInfoTableHTML(info), 'section', 'Product Info');
    if (info.careGuide) onAddToPreview(generateSizeGuideHTML(info), 'section', 'Size Guide');

    // 2. 업로드된 이미지들을 개별 블록으로 추가
    if (images.length > 0) {
      images.forEach((img, idx) => {
        const imageUrl = img.base64 ? `data:${img.mimeType};base64,${img.base64}` : img.previewUrl;
        onAddToPreview(imageUrl, 'image', `Image ${idx + 1}`);
      });
    }
  };

  const downloadProductHTML = () => {
    if (images.length === 0) {
      alert("이미지가 없습니다.");
      return;
    }
    const htmlContent = generateFullProductHTML(info);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${info.productName || 'product'}_info.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInfo({ ...info, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Product Info</h3>
          <p className="text-xs text-gray-500 mt-0.5">이미지를 업로드하면 AI가 자동으로 분석합니다</p>
        </div>
        <button onClick={handleAutoFill} disabled={analyzing || images.length === 0}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {analyzing ? '분석 중...' : 'AI 자동 입력'}
        </button>
      </div>

      <FileDropzone currentImages={images} maxFiles={10}
        onImagesSelected={(newImgs) => setImages(prev => [...prev, ...newImgs])}
        onRemoveImage={(idx) => setImages(prev => prev.filter((_, i) => i !== idx))} />

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input name="lineName" value={info.lineName} onChange={handleChange} placeholder="라인명" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
          <input name="productName" value={info.productName} onChange={handleChange} placeholder="제품명 *" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
          <input name="color" value={info.color} onChange={handleChange} placeholder="컬러" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
          <input name="upperMaterial" value={info.upperMaterial} onChange={handleChange} placeholder="갑피 소재" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
          <input name="liningMaterial" value={info.liningMaterial} onChange={handleChange} placeholder="안감" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
          <input name="soleMaterial" value={info.soleMaterial} onChange={handleChange} placeholder="밑창" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
          <input name="insoleMaterial" value={info.insoleMaterial} onChange={handleChange} placeholder="깔창" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
          <input name="outsoleHeight" value={info.outsoleHeight} onChange={handleChange} placeholder="아웃솔 높이(cm)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
          <input name="insoleHeight" value={info.insoleHeight} onChange={handleChange} placeholder="인솔 높이(cm)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
          <input name="sizeSpec" value={info.sizeSpec} onChange={handleChange} placeholder="사이즈 범위" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
          <input name="origin" value={info.origin} onChange={handleChange} placeholder="원산지" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent col-span-2" />
        </div>
        <textarea name="intro" value={info.intro} onChange={handleChange} placeholder="제품 소개 (핵심 가치)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent resize-none" rows={2} />
        <textarea name="style" value={info.style} onChange={handleChange} placeholder="스타일 설명" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent resize-none" rows={2} />
        <textarea name="tech" value={info.tech} onChange={handleChange} placeholder="기술/소재 특징" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent resize-none" rows={2} />
      </div>

      <div className="space-y-2 pt-2 border-t">
        <h4 className="text-sm font-semibold text-gray-900">사이즈 정보 (AI 추정)</h4>
        <div className="grid grid-cols-3 gap-2">
          <input name="estimatedLength" value={info.estimatedLength || ''} onChange={handleChange} placeholder="길이 (예: 27cm)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input name="estimatedWidth" value={info.estimatedWidth || ''} onChange={handleChange} placeholder="발볼 (예: 10cm)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input name="estimatedHeight" value={info.estimatedHeight || ''} onChange={handleChange} placeholder="높이 (예: 12cm)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t">
        <h4 className="text-sm font-semibold text-gray-900">사이즈 가이드</h4>
        <textarea name="careGuide" value={info.careGuide || ''} onChange={handleChange} placeholder="사이즈 선택 팁이 자동 입력됩니다." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none h-24" />
      </div>

      <div className="space-y-2 pt-2 border-t">
        <h4 className="text-sm font-semibold text-gray-900">기술 배지</h4>
        <input name="techLabel" value={info.techLabel || ''} onChange={handleChange} placeholder="라벨 (예: TECHNOLOGY)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
        <input name="techTitle" value={info.techTitle || ''} onChange={handleChange} placeholder="제목 (예: CarbonLite)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
        <textarea name="techDesc" value={info.techDesc || ''} onChange={handleChange} placeholder="설명" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent resize-none" rows={2} />
      </div>

      <div className="pt-2 border-t space-y-2">
        <button
          onClick={handleManualAddToPreview}
          className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          프리뷰에 추가 (텍스트 + 이미지)
        </button>
        <button
          onClick={downloadProductHTML}
          className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          HTML 다운로드
        </button>
      </div>

      {onAddCustomText && (
        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-sm font-semibold text-gray-900">커스텀 텍스트</h4>
          <textarea value={customText} onChange={(e) => setCustomText(e.target.value)} placeholder="커스텀 텍스트 입력..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent resize-none" rows={3} />
          <button onClick={() => { if (customText.trim()) { onAddCustomText(customText); setCustomText(''); } }}
            disabled={!customText.trim()}
            className="w-full bg-black text-white font-medium py-2 px-4 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
            페이지에 추가
          </button>
        </div>
      )}
    </div>
  );
};

export default Step1PersonalShopper;
