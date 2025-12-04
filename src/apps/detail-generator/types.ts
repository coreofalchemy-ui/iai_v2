export interface UploadedImage {
    file: File;
    previewUrl: string;
    base64: string;
    mimeType: string;
}

export interface ProductDetailInfo {
    brandName: string;
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
    sizeTip: string;
}

export interface AutoFilledProductInfo {
    category: string;
    color: string;
    upper: string;
    lining: string;
    sole: string;
    insole: string;
    outsoleHeightCm: string;
    insoleHeightCm: string;
    totalHeightCm: string;
    intro: string;
    style: string;
    tech: string;
    sizeTip: string;
}

export interface LookbookImage {
    url: string;
    type: 'model' | 'detail' | 'candidate';
    promptUsed: string;
}

export type LookbookPhase = 'input' | 'generating_candidates' | 'selecting_face' | 'generating_final' | 'complete';
export type ModelGender = 'w' | 'm';
export type ModelAge = '18' | '21' | '25' | '28' | '31' | '35' | '40';
export type ModelEthnicity = 'Korean' | 'Western' | 'East Asian' | 'Black' | 'Mixed';
