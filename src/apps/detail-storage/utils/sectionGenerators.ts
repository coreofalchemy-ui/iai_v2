/**
 * Section HTML Generators
 * Modular HTML generation functions for each detail page section
 */

export type SectionType =
  | 'title'
  | 'intro'
  | 'technology'
  | 'height'
  | 'product-info'
  | 'size-check'
  | 'product-cuts'
  | 'model-foot'
  | 'model-cuts'
  | 'detail-cuts'
  | 'custom-text';

export interface Section {
  id: string;
  type: SectionType;
  title: string;
  enabled: boolean;
  icon: string;
  content?: string;
  textAlign?: 'left' | 'center' | 'right';
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
  // Technology section - single item
  techLabel?: string;  // NEW: "TECHNOLOGY" label itself is editable
  techTitle?: string;
  techDesc?: string;
}

export const getTitleHTML = (data: ProductDetailInfo): string => {
  return `
  <div style="text-align:center; margin-bottom:40px;">
    <div style="font-size:11px; letter-spacing:0.1em; color:#999; text-transform:uppercase; font-weight:700; margin-bottom:12px;">
      ${data.lineName}
    </div>
    <h1 style="font-size:32px; font-weight:800; color:#000; margin:0 0 8px 0;">${data.productName}</h1>
    <div style="font-size:14px; color:#555; font-weight:500;">Color: ${data.color}</div>
  </div>`;
};

export const getIntroHTML = (data: ProductDetailInfo): string => {
  return `
  <div style="text-align:center; max-width:680px; margin:0 auto 48px auto; word-break:keep-all;">
    <p style="font-size:18px; font-weight:600; margin:0 0 16px 0; line-height:1.4;">${data.intro}</p>
    <p style="font-size:13px; color:#444; line-height:1.7; margin:0 0 16px 0;">${data.style}</p>
    <p style="font-size:13px; color:#444; line-height:1.7; margin:0;">${data.tech}</p>
  </div>`;
};

export const getTechnologyHTML = (data: ProductDetailInfo): string => {
  const techLabel = data.techLabel || 'TECHNOLOGY';
  const techTitle = data.techTitle || 'CarbonLite';
  const techDesc = data.techDesc || '과한 반발력은 줄이고, 하루종일 편안한 착화를 위한 COA만의 카본 구조입니다.';

  return `
  <div style="background:#f9f9f9; border:1px solid #eee; border-radius:12px; padding:20px 16px; margin-bottom:48px;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tr>
        <td width="140" valign="middle" style="padding-right:24px; border-right:1px solid #e0e0e0;">
          <div style="font-size:10px; font-weight:700; color:#1a2b4c; letter-spacing:0.05em; margin-bottom:6px;">${techLabel}</div>
          <div style="font-size:18px; font-weight:800; color:#111; line-height:1.2; margin-bottom:4px;">${techTitle}</div>
        </td>
        <td valign="middle" style="padding-left:24px;">
          <div style="font-size:13px; color:#444; line-height:1.7;">${techDesc}</div>
        </td>
      </tr>
    </table>
  </div>`;
};

export const getHeightHTML = (data: ProductDetailInfo): string => {
  const outH = parseFloat(data.outsoleHeight || '0');
  const inH = parseFloat(data.insoleHeight || '0');
  const totalHeight = outH + inH > 0 ? (outH + inH).toFixed(1) : '5.5';

  return `
  <div style="background:#f8f8f8; border:1px solid #eee; border-radius:12px; padding:20px 8px; margin-bottom:48px;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse; table-layout:fixed;">
      <tr>
        <td align="center" valign="middle">
          <div style="font-size:11px; color:#888; margin-bottom:6px; text-transform:uppercase; font-weight:600;">Outsole</div>
          <div style="font-size:22px; font-weight:700; color:#333;">${data.outsoleHeight}cm</div>
        </td>
        <td align="center" valign="middle" width="30" style="font-size:18px; color:#ccc; font-weight:300;">+</td>
        <td align="center" valign="middle">
          <div style="font-size:11px; color:#1a2b4c; margin-bottom:6px; text-transform:uppercase; font-weight:700;">Insole</div>
          <div style="font-size:22px; font-weight:700; color:#1a2b4c;">${data.insoleHeight}cm</div>
        </td>
        <td align="center" valign="middle" width="20">
          <div style="width:1px; height:40px; background-color:#ddd; margin:0 auto;"></div>
        </td>
        <td align="center" valign="middle">
          <div style="font-size:13px; color:#555; margin-bottom:6px;">총 키높이 효과</div>
          <div style="font-size:26px; font-weight:800; color:#111;">${totalHeight}cm</div>
        </td>
      </tr>
    </table>
  </div>`;
};

export const getProductInfoHTML = (data: ProductDetailInfo): string => {
  return `
  <div style="margin-bottom:48px;">
    <div style="font-size:13px; font-weight:700; border-bottom:2px solid #111; padding-bottom:10px; margin-bottom:0;">PRODUCT INFO</div>
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse; font-size:12px;">
      <tr><td style="padding:10px 0; border-bottom:1px solid #eee; color:#555; width:30%;">Color</td><td style="padding:10px 0; border-bottom:1px solid #eee; text-align:right;">${data.color}</td></tr>
      <tr><td style="padding:10px 0; border-bottom:1px solid #eee; color:#555;">Upper</td><td style="padding:10px 0; border-bottom:1px solid #eee; text-align:right;">${data.upperMaterial}</td></tr>
      <tr><td style="padding:10px 0; border-bottom:1px solid #eee; color:#555;">Lining</td><td style="padding:10px 0; border-bottom:1px solid #eee; text-align:right;">${data.liningMaterial}</td></tr>
      <tr><td style="padding:10px 0; border-bottom:1px solid #eee; color:#555;">Sole</td><td style="padding:10px 0; border-bottom:1px solid #eee; text-align:right;">${data.soleMaterial}</td></tr>
      <tr><td style="padding:10px 0; border-bottom:1px solid #eee; color:#555;">Insole</td><td style="padding:10px 0; border-bottom:1px solid #eee; text-align:right;">${data.insoleMaterial}</td></tr>
      <tr><td style="padding:10px 0; border-bottom:1px solid #eee; color:#555;">Size</td><td style="padding:10px 0; border-bottom:1px solid #eee; text-align:right;">${data.sizeSpec}</td></tr>
      <tr><td style="padding:10px 0; border-bottom:1px solid #eee; color:#555;">Origin</td><td style="padding:10px 0; border-bottom:1px solid #eee; text-align:right;">${data.origin}</td></tr>
    </table>
  </div>`;
};

export const getSizeCheckHTML = (): string => {
  return `
  <div style="background:#fffbfb; border:1px solid #eee; padding:16px; border-radius:12px; font-size:13px; line-height:1.6;">
    <div style="margin-bottom:16px;">
      <strong style="color:#d32f2f; display:inline-block; margin-bottom:4px; font-size:14px;">⚠️ SIZE CHECK</strong><br>
      <strong>크게 제작된 제품입니다.</strong> 평소 사이즈보다 <span style="text-decoration:underline; font-weight:700;">한 사이즈 작게(Down)</span> 주문해 주세요.
      <span style="color:#888; font-size:12px;">(예: 평소 265 착용 시 👉 260 권장)</span>
    </div>
  </div>`;
};

export const getProductCutsHTML = (processedImages: Array<{ processed: string }>): string => {
  const displayImages = processedImages.map(p => p.processed);

  if (displayImages.length === 0) {
    return `
    <div style="margin-bottom:60px; border:1px dashed #ddd; background:#fafafa; padding:40px; text-align:center; border-radius:8px;">
      <div style="font-size:14px; font-weight:700; color:#999; margin-bottom:8px;">제품 이미지</div>
      <div style="font-size:12px; color:#bbb;">AI가 이미지를 미화하여 이곳에 순차적으로 배치합니다...</div>
    </div>`;
  }

  return `
  <div style="margin-bottom:60px;">
    <div style="text-align:center; margin-bottom:24px;">
      <h3 style="font-size:20px; font-weight:700; color:#111;">PRODUCT DETAIL</h3>
    </div>
    ${displayImages.map((url, idx) => `
    <div style="margin-bottom:20px;">
      <img src="${url}" style="width:100%; height:auto; display:block;" alt="Detail ${idx + 1}" />
    </div>
    `).join('')}
  </div>`;
};

export const getModelFootHTML = (): string => {
  return `
  <div style="margin-bottom:60px; border:1px dashed #ddd; background:#fafafa; padding:40px; text-align:center; border-radius:8px;">
    <div style="font-size:14px; font-weight:700; color:#999; margin-bottom:8px;">모델 착용 컷</div>
    <div style="font-size:12px; color:#bbb;">이 영역에는 모델의 발 착용 샷이 배치됩니다.</div>
  </div>`;
};

export const getModelCutsHTML = (): string => {
  return `
  <div style="margin-bottom:60px;">
    <div style="text-align:center; margin-bottom:24px;">
      <h3 style="font-size:20px; font-weight:700; color:#111;">MODEL CUTS</h3>
    </div>
    <div style="display:flex; flex-direction:column; gap:10px;">
      <div style="aspect-ratio:3/4; background:#f0f0f0; display:flex; align-items:center; justify-content:center; color:#ccc; font-size:12px;">Model Cut 1 (Vertical)</div>
      <div style="aspect-ratio:3/4; background:#f0f0f0; display:flex; align-items:center; justify-content:center; color:#ccc; font-size:12px;">Model Cut 2 (Vertical)</div>
      <div style="aspect-ratio:3/4; background:#f0f0f0; display:flex; align-items:center; justify-content:center; color:#ccc; font-size:12px;">Model Cut 3 (Vertical)</div>
    </div>
  </div>`;
};

export const getDetailCutsHTML = (): string => {
  return `
  <div style="margin-bottom:60px;">
    <div style="text-align:center; margin-bottom:24px;">
      <h3 style="font-size:20px; font-weight:700; color:#111;">DETAIL HIGHLIGHTS</h3>
    </div>
    <div style="display:flex; flex-direction:column; gap:10px;">
      <div style="aspect-ratio:1/1; background:#f5f5f5; display:flex; align-items:center; justify-content:center; color:#ccc; font-size:12px;">Detail 1 (Vertical)</div>
      <div style="aspect-ratio:1/1; background:#f5f5f5; display:flex; align-items:center; justify-content:center; color:#ccc; font-size:12px;">Detail 2 (Vertical)</div>
      <div style="aspect-ratio:1/1; background:#f5f5f5; display:flex; align-items:center; justify-content:center; color:#ccc; font-size:12px;">Detail 3 (Vertical)</div>
    </div>
  </div>`;
};

export const generateSectionHTML = (
  section: Section,
  data: ProductDetailInfo,
  processedImages: Array<{ processed: string }>
): string => {
  if (!section.enabled) return '';

  switch (section.type) {
    case 'title':
      return getTitleHTML(data);
    case 'intro':
      return getIntroHTML(data);
    case 'technology':
      return getTechnologyHTML(data);
    case 'height':
      return getHeightHTML(data);
    case 'product-info':
      return getProductInfoHTML(data);
    case 'size-check':
      return getSizeCheckHTML();
    case 'product-cuts':
      return getProductCutsHTML(processedImages);
    case 'model-foot':
      return getModelFootHTML();
    case 'model-cuts':
      return getModelCutsHTML();
    case 'detail-cuts':
      return getDetailCutsHTML();
    case 'custom-text':
      return section.content || '';
    default:
      return '';
  }
};
