import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import StartScreen from './components/StartScreen';
import AdjustmentPanel from './components/AdjustmentPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { NavigationMinimap } from './components/NavigationMinimap';
import { SimpleContextMenu } from './components/SimpleContextMenu';
import { NumberInputDialog } from './components/NumberInputDialog';
import { ColorPickerDialog } from './components/ColorPickerDialog';
import { ClothingTypeSelectDialog } from './components/ClothingTypeSelectDialog';
import { TextElement } from './components/PreviewRenderer';
import { analyzeModelImage, detectItemType, compositeClothingItem, changeItemColor, ModelAnalysis } from './services/analyzeModel';
import { generatePoseBatch, PoseGenerationResult } from './services/poseService';

// Helper to read file as Data URL
const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const LAYOUT_TEMPLATE_HTML = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Detail</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Noto Sans KR', sans-serif; }
        .container { max-width: 800px; margin: 0 auto; }
        img { max-width: 100%; display: block; }
        .section { margin-bottom: 0; }
    </style>
</head>
<body>
    <div class="container" id="root">
        <!-- Content will be injected here -->
    </div>
</body>
</html>
`;

export default function DetailGeneratorApp() {
    const [screen, setScreen] = useState<'start' | 'result'>('start');
    const [isLoading, setLoading] = useState(false);
    const [generatedData, setGeneratedData] = useState<any>(null);
    const [activeSection, setActiveSection] = useState<string>('hero');
    const [previewHtml, setPreviewHtml] = useState<string>('');
    const [sectionOrder, setSectionOrder] = useState<string[]>([]);
    const [showAIAnalysis, setShowAIAnalysis] = useState(false);
    const [isMinimapVisible, setIsMinimapVisible] = useState(true); // 기본 켜짐

    // Text Editing State
    const [textElements, setTextElements] = useState<TextElement[]>([]);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; targetId: string | null }>({
        visible: false, x: 0, y: 0, targetId: null
    });

    // Zoom State
    const [imageZoomLevels, setImageZoomLevels] = useState<{ [key: string]: number }>({});
    const [imageTransforms, setImageTransforms] = useState<{ [key: string]: { scale: number, x: number, y: number } }>({});

    // Section Heights
    const [sectionHeights, setSectionHeights] = useState<{ [key: string]: number }>({});

    // Preview Device State
    const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop' | 'responsive'>('mobile');
    const [previewWidth, setPreviewWidth] = useState('100%');
    const [autoScale, setAutoScale] = useState(1);

    // Model Hold & Analysis State
    const [heldSections, setHeldSections] = useState<Set<string>>(new Set());
    const [modelAnalysis, setModelAnalysis] = useState<{ [key: string]: ModelAnalysis }>({});
    const [analyzingModels, setAnalyzingModels] = useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false); // For global loading overlay

    // Force Edit State
    const [forceEditSections, setForceEditSections] = useState<Set<string>>(new Set());

    // Product Tab State
    const [uploadedProducts, setUploadedProducts] = useState<Array<{ id: string; type: string; url: string; file: File }>>([]);

    // Pose Generation State
    const [usedPoseIds, setUsedPoseIds] = useState<Set<string>>(new Set());
    const [poseDialogState, setPoseDialogState] = useState<{
        visible: boolean;
        type: 'full' | 'closeup';
        sectionId: string | null;
    }>({ visible: false, type: 'full', sectionId: null });
    const [poseGenerationProgress, setPoseGenerationProgress] = useState<{
        isGenerating: boolean;
        current: number;
        total: number;
        message: string;
    }>({ isGenerating: false, current: 0, total: 0, message: '' });

    // Color Picker State - 2-step flow: select clothing type → select color
    const [colorPickerState, setColorPickerState] = useState<{
        step: 'selectType' | 'selectColor' | null;
        sectionId: string | null;
        clothingType: string | null;
    }>({ step: null, sectionId: null, clothingType: null });

    const previewRef = useRef<HTMLDivElement>(null);
    const middlePanelRef = useRef<HTMLDivElement>(null);

    // Selected Sections - for individual section selection via context menu
    const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());

    // Processing Sections - sections currently being processed by AI
    const [processingSections, setProcessingSections] = useState<Set<string>>(new Set());

    // Global Edit Mode (MINIMAP toggle) - when ON, all sections can be wheel/drag edited
    const [isHoldOn, setIsHoldOn] = useState(false); // 기본 OFF

    // Close context menu on click outside
    useEffect(() => {
        const handleGlobalClick = () => {
            if (contextMenu.visible) {
                setContextMenu({ visible: false, x: 0, y: 0, targetId: null });
            }
        };
        window.addEventListener('click', handleGlobalClick);
        return () => window.removeEventListener('click', handleGlobalClick);
    }, [contextMenu.visible]);

    // Calculate auto-scale for responsive preview
    useEffect(() => {
        if (middlePanelRef.current) {
            const updateScale = () => {
                const containerWidth = middlePanelRef.current?.clientWidth || 1000;
                const targetWidth = 1000; // Base width
                const scale = Math.min(1, (containerWidth - 64) / targetWidth); // 64px padding
                setAutoScale(scale);
            };

            updateScale();
            window.addEventListener('resize', updateScale);
            return () => window.removeEventListener('resize', updateScale);
        }
    }, [screen]);

    const handleDeviceChange = (device: 'mobile' | 'tablet' | 'desktop' | 'responsive') => {
        setPreviewDevice(device);
        switch (device) {
            case 'mobile': setPreviewWidth('640'); break; // Mobile L
            case 'tablet': setPreviewWidth('768'); break; // Tablet
            case 'desktop': setPreviewWidth('1000'); break; // Desktop
            case 'responsive': setPreviewWidth('100%'); break;
        }
    };

    // Text Handlers
    const handleAddTextElement = (text: TextElement) => {
        setTextElements(prev => [...prev, text]);
    };

    const handleUpdateTextElement = (id: string, prop: keyof TextElement, value: any) => {
        setTextElements(prev => prev.map(t => t.id === id ? { ...t, [prop]: value } : t));
    };

    const handleDeleteTextElement = (id: string) => {
        setTextElements(prev => prev.filter(t => t.id !== id));
    };

    const handleUpdateAllTextElements = (elements: TextElement[]) => {
        setTextElements(elements);
    };

    // Section Handlers
    const handleAddSection = (type: string) => {
        const newId = `custom-${Date.now()}`;
        setGeneratedData((prev: any) => ({
            ...prev,
            imageUrls: {
                ...prev.imageUrls,
                [newId]: 'https://via.placeholder.com/800x400?text=New+Section'
            }
        }));
        setSectionOrder(prev => [...prev, newId]);
        setSectionHeights(prev => ({ ...prev, [newId]: 400 }));
    };

    const handleAddSpacerSection = () => {
        const newId = `spacer-${Date.now()}`;
        setGeneratedData((prev: any) => ({
            ...prev,
            imageUrls: {
                ...prev.imageUrls,
                [newId]: 'SPACER'
            }
        }));
        setSectionOrder(prev => [...prev, newId]);
        setSectionHeights(prev => ({ ...prev, [newId]: 100 }));
    };

    // Add section with pre-generated image (for product effects)
    const handleAddSectionWithImage = (imageUrl: string, sectionName?: string) => {
        const newId = `product-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        // Create an image element to get natural dimensions
        const img = new Image();
        img.onload = () => {
            const aspectRatio = img.naturalHeight / img.naturalWidth;
            const calculatedHeight = 1000 * aspectRatio;

            setGeneratedData((prev: any) => ({
                ...prev,
                imageUrls: {
                    ...prev.imageUrls,
                    [newId]: imageUrl
                }
            }));
            setSectionOrder(prev => [...prev, newId]);
            setSectionHeights(prev => ({ ...prev, [newId]: calculatedHeight }));
        };
        img.src = imageUrl;
    };

    const handleDeleteSection = (sectionId: string) => {
        setGeneratedData((prev: any) => {
            const newData = { ...prev };
            delete newData.imageUrls[sectionId];
            return newData;
        });
        setSectionOrder(prev => prev.filter(id => id !== sectionId));
        setSectionHeights(prev => {
            const newHeights = { ...prev };
            delete newHeights[sectionId];
            return newHeights;
        });
    };

    const handleUpdateSectionHeight = (id: string, height: number) => {
        setSectionHeights(prev => ({ ...prev, [id]: height }));
    };

    const handleUpdateImageTransform = (sectionId: string, transform: { scale: number, x: number, y: number }) => {
        setImageTransforms(prev => ({ ...prev, [sectionId]: transform }));
    };

    // Model Analysis Handler
    const analyzeModel = async (sectionId: string) => {
        const imageUrl = generatedData.imageUrls[sectionId];
        if (!imageUrl) return;

        setAnalyzingModels(prev => new Set(prev).add(sectionId));
        try {
            console.log(`🔍 Analyzing model in section ${sectionId}...`);
            const result = await analyzeModelImage(imageUrl);
            console.log('✅ Analysis result:', result);
            setModelAnalysis(prev => ({ ...prev, [sectionId]: result }));
        } catch (e) {
            console.error('Analysis failed:', e);
            alert('모델 분석 실패: ' + e);
        } finally {
            setAnalyzingModels(prev => {
                const next = new Set(prev);
                next.delete(sectionId);
                return next;
            });
        }
    };

    // Toggle Hold Handler
    const handleToggleHold = async (sectionId: string) => {
        setHeldSections(prev => {
            const next = new Set(prev);
            if (next.has(sectionId)) {
                next.delete(sectionId);
            } else {
                next.add(sectionId);
                // Trigger analysis when holding
                if (!modelAnalysis[sectionId]) {
                    analyzeModel(sectionId);
                }
            }
            return next;
        });
    };

    const handleToggleGlobalHold = () => {
        // Toggle global edit mode (MINIMAP toggle)
        setIsHoldOn(prev => !prev);
    };

    const handleToggleSectionSelect = () => {
        const targetId = contextMenu.targetId;
        if (!targetId) return;

        setSelectedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(targetId)) {
                newSet.delete(targetId);
            } else {
                newSet.add(targetId);
            }
            return newSet;
        });
        setContextMenu({ visible: false, x: 0, y: 0, targetId: null });
    };

    const handleForceEdit = (sectionId: string) => {
        setForceEditSections(prev => new Set(prev).add(sectionId));
    };

    const handleCancelForceEdit = (sectionId: string) => {
        setForceEditSections(prev => {
            const next = new Set(prev);
            next.delete(sectionId);
            return next;
        });
    };

    // Product Upload Handler
    const handleProductUpload = async (file: File) => {
        setLoading(true);
        try {
            const imageUrl = await fileToDataUrl(file);
            const type = await detectItemType(imageUrl);

            const newProduct = {
                id: Date.now().toString(),
                type,
                url: imageUrl,
                file
            };

            setUploadedProducts(prev => {
                const next = [...prev, newProduct];
                // Sort order: hat > top > inner > bottom > shoes
                const order = ['hat', 'top', 'inner', 'bottom', 'shoes'];
                return next.sort((a, b) => {
                    const indexA = order.indexOf(a.type);
                    const indexB = order.indexOf(b.type);
                    // If type not in list, put at end
                    return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
                });
            });
        } catch (e) {
            console.error(e);
            alert("제품 분석 실패: " + e);
        } finally {
            setLoading(false);
        }
    };

    // AI Composite Image Handler
    const handleCompositeImage = async (sectionId: string, source: File | { url: string, type: string }) => {
        console.log('🎨 Composite Image Triggered:', sectionId, source);

        // 1. Check if model analysis exists for this section
        const analysis = modelAnalysis[sectionId];
        if (!analysis) {
            console.error('❌ No analysis available for this section. Please enable Model Hold first.');
            alert('모델 분석 정보가 없습니다. 먼저 "모델 홀드"를 활성화하여 분석을 완료해주세요.');
            return;
        }

        // 2. Get Base Image URL
        const baseImageUrl = generatedData.imageUrls[sectionId];
        if (!baseImageUrl) {
            alert('베이스 이미지가 없습니다.');
            return;
        }

        setLoading(true);
        // Add to processing sections for visual feedback
        setProcessingSections(prev => new Set([...prev, sectionId]));
        try {
            let itemImageUrl: string;
            let itemType: string;

            if (source instanceof File) {
                console.log('📂 Source is File');
                itemImageUrl = await fileToDataUrl(source);
                console.log('🔍 Detecting item type...');
                itemType = await detectItemType(itemImageUrl);
                console.log(`✅ Detected: ${itemType}`);
            } else {
                console.log('📦 Source is Product Object', source);
                itemImageUrl = source.url;
                itemType = source.type;
                if (!itemImageUrl || !itemType) {
                    throw new Error('Invalid product data: URL or Type missing');
                }
                console.log(`✅ Using pre-detected type: ${itemType}`);
            }

            // 5. Find matching region in analysis
            const targetRegion = analysis.regions.find(r => r.type === itemType);
            if (!targetRegion) {
                console.error(`❌ No ${itemType} region found in analysis`);
                alert(`이 모델에서 ${itemType === 'face' ? '얼굴' : itemType === 'hat' ? '모자' : itemType === 'top' ? '상의' : itemType === 'bottom' ? '하의' : '신발'} 영역을 찾을 수 없습니다.`);
                return;
            }

            console.log(`🎯 Target region for ${itemType}:`, targetRegion);

            // 6. Composite Image using Imagen API
            console.log('🚀 Starting composition...');
            const newImageUrl = await compositeClothingItem({
                baseImage: baseImageUrl,
                itemImage: itemImageUrl,
                itemType: itemType,
                targetRegion: targetRegion
            });

            console.log('✨ Composition complete, updating image...');
            setGeneratedData((prev: any) => ({
                ...prev,
                imageUrls: {
                    ...prev.imageUrls,
                    [sectionId]: newImageUrl
                }
            }));

        } catch (error) {
            console.error('Compositing failed:', error);
            alert(`합성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            setLoading(false);
            // Remove from processing sections
            setProcessingSections(prev => {
                const newSet = new Set(prev);
                newSet.delete(sectionId);
                return newSet;
            });
        }
    };

    // Product Apply Handler (Button Click)
    const handleApplyProduct = async (product: { id: string; type: string; url: string; file: File }) => {
        if (heldSections.size === 0) {
            alert('적용할 모델이 없습니다. 먼저 모델 이미지를 "홀드(Lock)" 해주세요.');
            return;
        }

        const confirmMsg = `${heldSections.size}개의 홀드된 모델에 '${product.type}' 제품을 적용하시겠습니까?`;
        if (!confirm(confirmMsg)) return;

        setLoading(true);
        try {
            // Apply to all held sections
            for (const sectionId of Array.from(heldSections)) {
                await handleCompositeImage(sectionId, { url: product.url, type: product.type });
            }
            alert('모든 모델에 적용 완료되었습니다!');
        } catch (e) {
            console.error(e);
            alert('일부 모델 적용 실패: ' + e);
        } finally {
            setLoading(false);
        }
    };

    // Wear Shoes Handler (Context Menu)
    const handleWearShoes = async () => {
        const sectionId = contextMenu.targetId;
        if (!sectionId) return;

        // Find uploaded shoes
        const shoes = uploadedProducts.find(p => p.type === 'shoes');
        if (!shoes) {
            alert('업로드된 신발 제품이 없습니다. 먼저 신발 사진을 업로드해주세요.');
            return;
        }

        setContextMenu(prev => ({ ...prev, visible: false }));

        // Confirm
        if (!confirm(`선택한 모델에 신발을 착용하시겠습니까?`)) return;

        await handleCompositeImage(sectionId, { url: shoes.url, type: 'shoes' });
    };

    // Color Change Handlers - Simplified: auto-detect clothing type, directly show color picker
    const handleOpenColorPicker = () => {
        const sectionId = contextMenu.targetId;
        if (!sectionId) return;

        // Check if section has model analysis
        if (!modelAnalysis[sectionId]) {
            alert('먼저 "모델 홀드"를 활성화하여 분석을 완료해주세요.');
            return;
        }

        const analysis = modelAnalysis[sectionId];
        // Auto-detect clothing type based on priority
        const clothingPriority = ['top', 'bottom', 'shoes', 'inner', 'hat'];
        let detectedType: string | null = null;

        for (const type of clothingPriority) {
            if (analysis.regions.find(r => r.type === type)) {
                detectedType = type;
                break;
            }
        }

        if (!detectedType) {
            // Fallback to 'top' if no clothing detected
            detectedType = 'top';
        }

        setContextMenu({ visible: false, x: 0, y: 0, targetId: null });
        // Go directly to color picker with detected clothing type
        setColorPickerState({ step: 'selectColor', sectionId, clothingType: detectedType });
    };

    // Color selected callback
    const handleColorChange = async (color: string, colorName: string) => {
        const sectionId = colorPickerState.sectionId;
        const clothingType = colorPickerState.clothingType;
        if (!sectionId || !clothingType) return;

        setColorPickerState({ step: null, sectionId: null, clothingType: null });

        const analysis = modelAnalysis[sectionId];
        const baseImageUrl = generatedData.imageUrls[sectionId];
        if (!analysis || !baseImageUrl) return;

        // Find region matching selected clothing type
        let targetRegion = analysis.regions.find(r => r.type === clothingType);

        // Start processing
        setProcessingSections(prev => new Set([...prev, sectionId]));
        setLoading(true);

        try {
            console.log(`🎨 Changing ${clothingType} to ${colorName}...`);
            const newImageUrl = await changeItemColor({
                baseImage: baseImageUrl,
                itemType: clothingType,
                targetColor: color,
                colorName: colorName,
                targetRegion: targetRegion
            });

            setGeneratedData((prev: any) => ({
                ...prev,
                imageUrls: {
                    ...prev.imageUrls,
                    [sectionId]: newImageUrl
                }
            }));
        } catch (error) {
            console.error('Color change failed:', error);
            alert(`색상 변경 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            setLoading(false);
            setProcessingSections(prev => {
                const newSet = new Set(prev);
                newSet.delete(sectionId);
                return newSet;
            });
        }
    };


    // Pose Generation Handlers
    const handleOpenPoseDialog = (type: 'full' | 'closeup') => {
        console.log('🎯 handleOpenPoseDialog called with type:', type);
        const sectionId = contextMenu.targetId;
        console.log('📌 Target sectionId:', sectionId);

        if (!sectionId) {
            console.log('❌ No sectionId found');
            return;
        }

        // Check if section has an image
        const imageUrl = generatedData?.imageUrls?.[sectionId];
        console.log('🖼️ Image URL:', imageUrl?.substring(0, 100));

        if (!imageUrl || imageUrl.includes('placeholder') || imageUrl === 'SPACER') {
            console.log('⚠️ No valid image - showing alert');
            alert('이미지가 없는 섹션입니다. 먼저 모델 이미지를 업로드해주세요.');
            return;
        }

        console.log('✅ Valid image found, opening dialog');
        setContextMenu(prev => ({ ...prev, visible: false }));
        setPoseDialogState({ visible: true, type, sectionId });
    };

    // Capture section as image using html2canvas
    const captureSectionAsImage = async (sectionId: string): Promise<string> => {
        const sectionEl = document.querySelector(`[data-section="${sectionId}"]`) as HTMLElement;
        if (!sectionEl) throw new Error('Section not found');

        const canvas = await html2canvas(sectionEl, {
            useCORS: true,
            scale: 2, // High quality capture
            backgroundColor: null,
            logging: false
        });

        return canvas.toDataURL('image/jpeg', 0.95);
    };

    const handlePoseDialogConfirm = async (count: number) => {
        const { sectionId, type } = poseDialogState;
        if (!sectionId) return;

        setPoseDialogState({ visible: false, type: 'full', sectionId: null });

        // Start generation - first capture the preview frame
        setPoseGenerationProgress({
            isGenerating: true,
            current: 0,
            total: count,
            message: '📷 프리뷰 프레임 캡처 중...'
        });

        let imageUrl: string;
        try {
            // Capture the current preview frame instead of using original image
            imageUrl = await captureSectionAsImage(sectionId);
            console.log('📷 Captured preview frame successfully');
        } catch (e) {
            console.error('Failed to capture section:', e);
            // Fallback to original image if capture fails
            imageUrl = generatedData?.imageUrls?.[sectionId];
            if (!imageUrl) {
                setPoseGenerationProgress({ isGenerating: false, current: 0, total: 0, message: '' });
                alert('섹션 캡처에 실패했습니다.');
                return;
            }
            console.log('⚠️ Using original image as fallback');
        }

        // Update progress message
        setPoseGenerationProgress({
            isGenerating: true,
            current: 0,
            total: count,
            message: '🔍 모델 성별 분석 중...'
        });

        try {
            const { results, newUsedPoseIds } = await generatePoseBatch(
                imageUrl,
                count,
                type,
                usedPoseIds,
                (current, total, result) => {
                    setPoseGenerationProgress({
                        isGenerating: true,
                        current,
                        total,
                        message: `🎨 자세 생성 중... (${current}/${total})`
                    });
                }
            );

            // Update used poses
            setUsedPoseIds(newUsedPoseIds);

            // Add generated images as new sections below the original
            const originalIndex = sectionOrder.indexOf(sectionId);
            const newSections: string[] = [];

            results.forEach((result, idx) => {
                const newId = `pose-${Date.now()}-${idx}`;

                // Add image URL
                setGeneratedData((prev: any) => ({
                    ...prev,
                    imageUrls: {
                        ...prev.imageUrls,
                        [newId]: result.imageUrl
                    }
                }));

                // Set height based on type
                setSectionHeights(prev => ({
                    ...prev,
                    [newId]: type === 'closeup' ? 800 : 1200
                }));

                newSections.push(newId);
            });

            // Insert new sections after the original
            setSectionOrder(prev => {
                const newOrder = [...prev];
                newOrder.splice(originalIndex + 1, 0, ...newSections);
                return newOrder;
            });

            setPoseGenerationProgress({
                isGenerating: false,
                current: 0,
                total: 0,
                message: ''
            });

            if (results.length > 0) {
                alert(`✨ ${results.length}개의 자세 변형 이미지가 생성되었습니다!`);
            } else {
                alert('이미지 생성에 실패했습니다. 다시 시도해주세요.');
            }

        } catch (e: any) {
            console.error('Pose generation failed:', e);
            setPoseGenerationProgress({
                isGenerating: false,
                current: 0,
                total: 0,
                message: ''
            });
            alert(`자세 생성 실패: ${e.message || '알 수 없는 오류'}`);
        }
    };

    const handlePoseDialogCancel = () => {
        setPoseDialogState({ visible: false, type: 'full', sectionId: null });
    };

    // Context Menu Handler
    const handleContextMenu = (e: React.MouseEvent, type: string, index: number, sectionId: string) => {
        e.preventDefault();
        if (type === 'section' && sectionId) {
            setContextMenu({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                targetId: sectionId
            });
        }
    };

    const handleGenerate = async (pFiles: File[], mFiles: File[], mode: string) => {
        setLoading(true);
        try {
            let productUrls: string[] = [];
            // Text data structure
            let textData = {
                textContent: {},
                specContent: {},
                heroTextContent: {
                    productName: 'Sample Product',
                    brandLine: 'BRAND NAME',
                    subName: 'Color / Model',
                    stylingMatch: '스타일링 매치 설명이 들어갑니다.',
                    craftsmanship: '제작 공정 및 소재 설명이 들어갑니다.',
                    technology: '핵심 기술 설명이 들어갑니다.'
                },
                noticeContent: {}
            };

            // Process images if any (just to have them available if needed, though we are simplifying)
            if (pFiles.length > 0) {
                productUrls = await Promise.all(pFiles.map(fileToDataUrl));
            }

            // Initial section order - ONLY HERO
            const initialSections = ['hero'];

            setGeneratedData({
                ...textData,
                imageUrls: {
                    // Only keep necessary placeholders or empty arrays
                    products: [],
                    modelShots: [],
                    closeupShots: [],
                    // Custom sections will be added dynamically
                },
                layoutHtml: LAYOUT_TEMPLATE_HTML,
                productFiles: pFiles,
                modelFiles: mFiles,
                sectionOrder: initialSections
            });
            setScreen('result');
            setSectionOrder(initialSections);
        } catch (e) {
            alert("생성 오류: " + e);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (action: string, type: any, index: any, arg?: any) => {
        if (action === 'updateImage') {
            const sectionKey = type;
            const newUrl = arg;

            setGeneratedData((prev: any) => {
                const newData = { ...prev };
                const targetSection = newData.imageUrls[sectionKey];

                if (Array.isArray(targetSection)) {
                    // Handle array-based sections (products, modelShots, closeupShots)
                    const newArray = [...targetSection];
                    if (typeof newArray[index] === 'string') {
                        newArray[index] = newUrl;
                    } else {
                        newArray[index] = { ...newArray[index], url: newUrl };
                    }
                    newData.imageUrls[sectionKey] = newArray;
                } else {
                    // Handle single image sections (hero, custom)
                    newData.imageUrls[sectionKey] = newUrl;
                }
                return newData;
            });
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
            {/* Header */}
            <header className="h-14 bg-white border-b flex items-center justify-between px-4 z-50 shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                    {screen === 'result' && (
                        <button
                            onClick={() => setScreen('start')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="뒤로가기"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            I AM IMPACT
                        </h1>
                        <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full font-bold">
                            아이엠 임펙트
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {screen === 'result' && (
                        <button
                            onClick={() => setScreen('start')}
                            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            새로 만들기
                        </button>
                    )}
                    <button
                        onClick={() => {
                            // Export HTML logic
                            const blob = new Blob([previewHtml], { type: 'text/html' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'detail_page.html';
                            a.click();
                        }}
                        className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-bold rounded-md hover:opacity-90 transition-opacity shadow-sm"
                    >
                        HTML 내보내기
                    </button>
                </div>
            </header>

            <main className="flex-grow overflow-hidden relative">
                {screen === 'start' && (
                    <div className="h-full overflow-y-auto p-4">
                        <StartScreen onGenerate={handleGenerate} isLoading={isLoading} />
                    </div>
                )}

                {screen === 'result' && generatedData && (
                    <div className="flex h-full">
                        {/* Left Panel Wrapper */}
                        <div className="w-[420px] border-r bg-white hidden md:flex flex-col relative z-10 flex-shrink-0 h-full shadow-xl">
                            <div className="flex-grow overflow-y-auto custom-scrollbar">
                                <AdjustmentPanel
                                    data={generatedData}
                                    onUpdate={(newData: any) => setGeneratedData(newData)}
                                    showAIAnalysis={showAIAnalysis}
                                    onToggleAIAnalysis={() => setShowAIAnalysis(prev => !prev)}
                                    activeSection={activeSection}
                                    textElements={textElements}
                                    onAddTextElement={handleAddTextElement}
                                    onUpdateTextElement={handleUpdateTextElement}
                                    onDeleteTextElement={handleDeleteTextElement}
                                    onAddSpacerSection={handleAddSpacerSection}
                                    onAddSectionWithImage={handleAddSectionWithImage}
                                />
                            </div>
                        </div>

                        {/* Middle Panel */}
                        <div ref={middlePanelRef} className="flex-grow h-full bg-gray-100 overflow-hidden relative flex flex-col">
                            {/* Responsive Toolbar */}
                            <div className="h-12 bg-white border-b flex items-center justify-center gap-4 px-4 shadow-sm z-20">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Preview Mode:</span>
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => handleDeviceChange('mobile')}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${previewDevice === 'mobile' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        📱 Mobile L (640px)
                                    </button>
                                    <button
                                        onClick={() => handleDeviceChange('tablet')}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${previewDevice === 'tablet' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        Tablet (768px)
                                    </button>
                                    <button
                                        onClick={() => handleDeviceChange('desktop')}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${previewDevice === 'desktop' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        💻 Desktop (Full)
                                    </button>
                                </div>
                                {previewDevice === 'responsive' && (
                                    <div className="flex items-center gap-2 border-l pl-4 ml-2">
                                        <span className="text-xs text-gray-500">Width:</span>
                                        <input
                                            type="text"
                                            value={previewWidth}
                                            onChange={(e) => setPreviewWidth(e.target.value)}
                                            className="w-20 border rounded px-2 py-1 text-xs text-center"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Preview Area */}
                            <div
                                className={`flex-grow flex justify-center overflow-y-auto bg-gray-100 p-8 pb-32 custom-scrollbar`}
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            >
                                <div
                                    className={`bg-white transition-all duration-300 ease-in-out origin-top ${previewDevice === 'desktop' ? 'shadow-lg my-8' : 'shadow-2xl'}`}
                                    style={{
                                        width: '1000px', // Always fixed base width
                                        minHeight: '100%',
                                        transform: `scale(${previewWidth === '100%' ? autoScale : parseInt(previewWidth) / 1000})`,
                                        transformOrigin: 'top center',
                                    }}
                                >
                                    <PreviewPanel
                                        ref={previewRef}
                                        data={generatedData}
                                        imageZoomLevels={imageZoomLevels}
                                        onAction={handleAction}
                                        onZoom={(k: string, d: string) => setImageZoomLevels((p: any) => ({ ...p, [k]: Math.max(0.5, Math.min(3, (p[k] || 1) + (d === 'in' ? 0.1 : -0.1))) }))}
                                        activeSection={activeSection}
                                        onSectionVisible={setActiveSection}
                                        sectionOrder={sectionOrder}
                                        showAIAnalysis={showAIAnalysis}
                                        onHtmlUpdate={setPreviewHtml}
                                        textElements={textElements}
                                        onAddTextElement={handleAddTextElement}
                                        onUpdateTextElement={handleUpdateTextElement}
                                        onDeleteTextElement={handleDeleteTextElement}
                                        onUpdateAllTextElements={handleUpdateAllTextElements}
                                        onContextMenu={handleContextMenu}
                                        lockedImages={new Set()}
                                        sectionHeights={sectionHeights}
                                        onUpdateSectionHeight={handleUpdateSectionHeight}
                                        imageTransforms={imageTransforms}
                                        onUpdateImageTransform={handleUpdateImageTransform}
                                        onDeleteSection={handleDeleteSection}
                                        heldSections={heldSections}
                                        selectedSections={selectedSections}
                                        onToggleHold={handleToggleHold}
                                        onCompositeImage={handleCompositeImage}
                                        isHoldOn={isHoldOn}
                                        forceEditSections={forceEditSections}
                                        onForceEdit={handleForceEdit}
                                        onCancelForceEdit={handleCancelForceEdit}
                                        processingSections={processingSections}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Minimap Toggle Button */}
                        <button
                            onClick={() => setIsMinimapVisible(!isMinimapVisible)}
                            className="fixed right-4 bottom-4 z-50 bg-indigo-500 text-white p-3 rounded-full shadow-lg hover:bg-indigo-600 transition lg:block hidden"
                            title={isMinimapVisible ? '미니맵 숨기기' : '미니맵 보기'}
                        >
                            {isMinimapVisible ? '➡️' : '🗺️'}
                        </button>

                        {/* Right Panel (Mini Map) - Now with drag to reorder */}
                        {isMinimapVisible && (
                            <div className="w-[140px] border-l bg-white hidden lg:flex flex-col relative z-10 flex-shrink-0 h-full">
                                <NavigationMinimap
                                    activeSection={activeSection}
                                    onSectionClick={(section) => {
                                        const el = document.querySelector(`[data-section="${section}"]`);
                                        el?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    data={generatedData}
                                    sectionOrder={sectionOrder}
                                    onReorder={(newOrder) => {
                                        console.log('New minimap order:', newOrder);
                                        setSectionOrder(newOrder);
                                        // Also update in generatedData if needed
                                        setGeneratedData((prev: any) => ({
                                            ...prev,
                                            sectionOrder: newOrder
                                        }));
                                    }}
                                    onAddSection={handleAddSection}
                                    previewRef={previewRef}
                                    previewHtml={previewHtml}
                                    textElements={textElements}
                                    onAction={handleAction}
                                    isHoldOn={isHoldOn}
                                    onToggleHoldMode={handleToggleGlobalHold}
                                />
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Simple Context Menu */}
            <SimpleContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                visible={contextMenu.visible}
                isSelected={contextMenu.targetId ? selectedSections.has(contextMenu.targetId) : false}
                isHeld={contextMenu.targetId ? heldSections.has(contextMenu.targetId) : false}
                onToggleSelect={handleToggleSectionSelect}
                onToggleHold={() => {
                    if (contextMenu.targetId) {
                        handleToggleHold(contextMenu.targetId);
                        setContextMenu({ visible: false, x: 0, y: 0, targetId: null });
                    }
                }}
                onGeneratePose={() => handleOpenPoseDialog('full')}
                onGenerateCloseUp={() => handleOpenPoseDialog('closeup')}
                onWearShoes={handleWearShoes}
                onChangeColor={handleOpenColorPicker}
                onDelete={() => {
                    if (!contextMenu.targetId) return;
                    // Delete the section directly
                    const sectionId = contextMenu.targetId;

                    setGeneratedData((prev: any) => {
                        const newData = { ...prev };
                        if (newData.imageUrls[sectionId]) {
                            delete newData.imageUrls[sectionId];
                        }
                        return newData;
                    });
                    setSectionOrder(prevOrder => prevOrder.filter(s => s !== sectionId));
                    setContextMenu({ visible: false, x: 0, y: 0, targetId: null });
                }}
            />

            {/* Number Input Dialog for Pose Generation */}
            <NumberInputDialog
                visible={poseDialogState.visible}
                title={poseDialogState.type === 'full' ? '🧍 자세생성 (Full Body)' : '👠 클로즈생성 (Lower Body)'}
                maxCount={10}
                onConfirm={handlePoseDialogConfirm}
                onCancel={handlePoseDialogCancel}
            />

            {/* Color Picker Dialog - Direct flow (no clothing type selection) */}
            <ColorPickerDialog
                visible={colorPickerState.step === 'selectColor'}
                onConfirm={handleColorChange}
                onCancel={() => setColorPickerState({ step: null, sectionId: null, clothingType: null })}
            />

            {/* Loading Overlay */}
            {(isProcessing || poseGenerationProgress.isGenerating) && (
                <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center min-w-[300px]">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-600 border-t-transparent mb-4"></div>
                        <p className="text-lg font-bold text-gray-800">
                            {poseGenerationProgress.isGenerating ? '🎨 자세 변형 생성 중...' : 'AI 신발 합성 중...'}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            {poseGenerationProgress.isGenerating
                                ? poseGenerationProgress.message
                                : '잠시만 기다려주세요.'}
                        </p>
                        {poseGenerationProgress.isGenerating && poseGenerationProgress.total > 0 && (
                            <div className="mt-4 w-full">
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300"
                                        style={{ width: `${(poseGenerationProgress.current / poseGenerationProgress.total) * 100}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 text-center mt-2">
                                    {poseGenerationProgress.current} / {poseGenerationProgress.total}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
