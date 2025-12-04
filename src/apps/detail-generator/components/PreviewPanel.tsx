import React, { forwardRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { HeroSection } from './HeroSection';
import { TextElement } from './PreviewRenderer';

interface PreviewPanelProps {
    data: any;
    imageZoomLevels: any;
    onAction: any;
    onZoom: any;
    activeSection: string;
    onSectionVisible: any;
    sectionOrder: string[];
    showAIAnalysis: boolean;
    onHtmlUpdate: (html: string) => void;
    textElements: TextElement[];
    onAddTextElement: (text: TextElement) => void;
    onUpdateTextElement: (id: string, prop: keyof TextElement, value: any) => void;
    onDeleteTextElement: (id: string) => void;
    onUpdateAllTextElements: (elements: TextElement[]) => void;
    onContextMenu: (e: React.MouseEvent, type: string, index: number, section: string) => void;
    sectionHeights: { [key: string]: number };
    onUpdateSectionHeight: (id: string, height: number) => void;
    imageTransforms?: { [key: string]: { scale: number, x: number, y: number } };
    onUpdateImageTransform?: (sectionId: string, transform: { scale: number, x: number, y: number }) => void;
    lockedImages?: Set<string>;
    onDeleteSection?: (sectionId: string) => void;
    heldSections?: Set<string>;
    selectedSections?: Set<string>; // For wheel/drag control
    onToggleHold?: (sectionId: string) => void;
    onCompositeImage?: (sectionId: string, source: File | { url: string, type: string }) => void;
    isHoldOn?: boolean;
    forceEditSections?: Set<string>;
    onForceEdit?: (sectionId: string) => void;
    onCancelForceEdit?: (sectionId: string) => void;
    processingSections?: Set<string>; // Sections currently being processed
}

export const PreviewPanel = forwardRef<HTMLDivElement, PreviewPanelProps>(({
    data,
    sectionOrder,
    onAction,
    onContextMenu,
    textElements = [],
    onUpdateTextElement,
    sectionHeights = {},
    onUpdateSectionHeight,
    onSectionVisible,
    imageTransforms = {},
    onUpdateImageTransform,
    onDeleteSection,
    heldSections = new Set(),
    selectedSections = new Set(),
    onToggleHold,
    onCompositeImage,
    isHoldOn = true,
    forceEditSections = new Set(),
    onForceEdit,
    onCancelForceEdit,
    processingSections = new Set()
}, ref) => {
    const [draggingState, setDraggingState] = React.useState<{
        id: string | null;
        startX: number;
        startY: number;
        initialLeft: number;
        initialTop: number;
        currentLeft: number;
        currentTop: number;
    }>({ id: null, startX: 0, startY: 0, initialLeft: 0, initialTop: 0, currentLeft: 0, currentTop: 0 });

    const [resizingState, setResizingState] = React.useState<{
        sectionId: string | null;
        startY: number;
        startHeight: number;
    }>({ sectionId: null, startY: 0, startHeight: 0 });

    const [panningState, setPanningState] = React.useState<{
        sectionId: string | null;
        startX: number;
        startY: number;
        initialX: number;
        initialY: number;
    }>({ sectionId: null, startX: 0, startY: 0, initialX: 0, initialY: 0 });

    const [contextMenuState, setContextMenuState] = React.useState<{
        visible: boolean;
        x: number;
        y: number;
        sectionId: string | null;
    }>({ visible: false, x: 0, y: 0, sectionId: null });

    const sectionRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

    // Close context menu on click outside
    React.useEffect(() => {
        const handleClick = () => setContextMenuState({ visible: false, x: 0, y: 0, sectionId: null });
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // Intersection Observer for active section detection
    React.useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.getAttribute('data-section');
                    if (sectionId && onSectionVisible) {
                        onSectionVisible(sectionId);
                    }
                }
            });
        }, { threshold: 0.3 }); // Lower threshold for better detection of tall sections

        Object.values(sectionRefs.current).forEach(el => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [sectionOrder, onSectionVisible]);

    const handleTextMouseDown = (e: React.MouseEvent, text: TextElement) => {
        e.stopPropagation();
        e.preventDefault();
        setDraggingState({
            id: text.id,
            startX: e.clientX,
            startY: e.clientY,
            initialLeft: text.left,
            initialTop: text.top,
            currentLeft: text.left,
            currentTop: text.top
        });
    };

    const handleResizeMouseDown = (e: React.MouseEvent, sectionId: string, currentHeight: number) => {
        e.stopPropagation();
        e.preventDefault();
        setResizingState({
            sectionId,
            startY: e.clientY,
            startHeight: currentHeight
        });
    };

    const handleImageMouseDown = (e: React.MouseEvent, sectionId: string) => {
        // Allow if MINIMAP toggle is ON (isHoldOn) OR if this section is selected
        const isGlobalEditOn = isHoldOn;
        const isSelected = selectedSections?.has(sectionId) || forceEditSections.has(sectionId);
        if (!isGlobalEditOn && !isSelected) return;

        // If Model Hold is active, LOCK movement (return early)
        if (heldSections.has(sectionId)) return;

        if (e.button !== 0) return;
        e.preventDefault();

        const currentTransform = imageTransforms[sectionId] || { scale: 1, x: 0, y: 0 };

        setPanningState({
            sectionId,
            startX: e.clientX,
            startY: e.clientY,
            initialX: currentTransform.x,
            initialY: currentTransform.y
        });
    };

    const handleImageWheel = (e: React.WheelEvent, sectionId: string) => {
        // Allow if MINIMAP toggle is ON (isHoldOn) OR if this section is selected
        const isGlobalEditOn = isHoldOn;
        const isSelected = selectedSections?.has(sectionId) || forceEditSections.has(sectionId);
        if (!isGlobalEditOn && !isSelected) return;

        // If Model Hold is active, LOCK movement (return early)
        if (heldSections.has(sectionId)) return;

        if (!onUpdateImageTransform) return;

        // Try to prevent default (might be passive)
        e.stopPropagation();

        const currentTransform = imageTransforms[sectionId] || { scale: 1, x: 0, y: 0 };
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(0.1, Math.min(5.0, currentTransform.scale + delta));

        onUpdateImageTransform(sectionId, {
            ...currentTransform,
            scale: newScale
        });
    };



    const handleContextMenu = (e: React.MouseEvent, sectionId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (onContextMenu) {
            onContextMenu(e, 'section', 0, sectionId);
        }
    };

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (draggingState.id) {
                const deltaX = e.clientX - draggingState.startX;
                const deltaY = e.clientY - draggingState.startY;
                setDraggingState(prev => ({
                    ...prev,
                    currentLeft: prev.initialLeft + deltaX,
                    currentTop: prev.initialTop + deltaY
                }));
            } else if (resizingState.sectionId) {
                const deltaY = e.clientY - resizingState.startY;
                const newHeight = Math.max(50, resizingState.startHeight + deltaY); // Min height 50px
                onUpdateSectionHeight(resizingState.sectionId, newHeight);
            } else if (panningState.sectionId && onUpdateImageTransform) {
                const deltaX = e.clientX - panningState.startX;
                const deltaY = e.clientY - panningState.startY;

                const currentTransform = imageTransforms[panningState.sectionId] || { scale: 1, x: 0, y: 0 };

                onUpdateImageTransform(panningState.sectionId, {
                    ...currentTransform,
                    x: panningState.initialX + deltaX,
                    y: panningState.initialY + deltaY
                });
            }
        };

        const handleMouseUp = () => {
            if (draggingState.id) {
                onUpdateTextElement(draggingState.id, 'left', draggingState.currentLeft);
                onUpdateTextElement(draggingState.id, 'top', draggingState.currentTop);
                setDraggingState({ id: null, startX: 0, startY: 0, initialLeft: 0, initialTop: 0, currentLeft: 0, currentTop: 0 });
            }
            if (resizingState.sectionId) {
                setResizingState({ sectionId: null, startY: 0, startHeight: 0 });
            }
            if (panningState.sectionId) {
                setPanningState({ sectionId: null, startX: 0, startY: 0, initialX: 0, initialY: 0 });
            }
        };

        if (draggingState.id || resizingState.sectionId || panningState.sectionId) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingState, resizingState, panningState, onUpdateTextElement, onUpdateSectionHeight, onUpdateImageTransform, imageTransforms]);

    // Helper to load image and set height
    const loadImageAndSetHeight = (file: File, sectionKey: string) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result as string;
            if (result) {
                // Create an image element to get dimensions
                const img = new Image();
                img.onload = () => {
                    // Calculate height based on 1000px width
                    const aspectRatio = img.naturalHeight / img.naturalWidth;
                    const calculatedHeight = 1000 * aspectRatio;

                    onAction('updateImage', sectionKey, 0, result);
                    onUpdateSectionHeight(sectionKey, calculatedHeight);

                    // Reset transform
                    if (onUpdateImageTransform) {
                        onUpdateImageTransform(sectionKey, { scale: 1, x: 0, y: 0 });
                    }
                };
                img.src = result;
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = React.useCallback((e: React.DragEvent, sectionKey: string) => {
        e.preventDefault();
        e.stopPropagation();

        // 1. Check for Internal Product Drag
        const productData = e.dataTransfer.getData('application/coaii-product');
        if (productData) {
            try {
                const product = JSON.parse(productData);
                if (heldSections.has(sectionKey) && onCompositeImage) {
                    onCompositeImage(sectionKey, product);
                } else {
                    // If not held, just replace image for convenience
                    onAction('updateImage', sectionKey, 0, product.url);
                }
            } catch (err) {
                console.error('Failed to parse product data', err);
            }
            return;
        }

        // 2. Check for File Drop
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];

            // If section is held, use composite logic
            if (heldSections.has(sectionKey) && onCompositeImage) {
                onCompositeImage(sectionKey, file);
            } else {
                // Normal replacement
                loadImageAndSetHeight(file, sectionKey);
            }
        }
    }, [onAction, onUpdateSectionHeight, onUpdateImageTransform, heldSections, onCompositeImage]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleClickUpload = (sectionKey: string) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (ev: any) => {
            if (ev.target.files && ev.target.files.length > 0) {
                loadImageAndSetHeight(ev.target.files[0], sectionKey);
            }
        };
        input.click();
    };



    const renderTextElements = (sectionId: string) => {
        return textElements
            .filter(text => text.sectionId === sectionId)
            .map(text => {
                const isDragging = draggingState.id === text.id;
                return (
                    <div
                        key={text.id}
                        style={{
                            position: 'absolute',
                            top: isDragging ? draggingState.currentTop : text.top,
                            left: isDragging ? draggingState.currentLeft : text.left,
                            fontSize: text.fontSize,
                            fontFamily: text.fontFamily,
                            color: text.color || '#000',
                            fontWeight: text.fontWeight || 'normal',
                            textAlign: text.textAlign || 'left',
                            cursor: 'move',
                            zIndex: 1000,
                            whiteSpace: 'pre-wrap',
                            userSelect: 'none',
                            border: isDragging ? '1px dashed blue' : '1px solid transparent',
                            padding: '4px'
                        }}
                        onMouseDown={(e) => handleTextMouseDown(e, text)}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {text.content}
                    </div>
                );
            });
    };

    return (
        <div
            ref={ref}
            className="preview-panel bg-white shadow-lg pb-8 relative"
            style={{ width: '1000px', margin: '0 auto' }}
        >
            {/* Custom Context Menu - Rendered via Portal - REMOVED to use parent's menu */}
            {null}

            {sectionOrder.map((sectionKey) => {
                if (sectionKey === 'hero') {
                    return (
                        <div
                            key={sectionKey}
                            className="relative"
                            onClick={(e) => { e.stopPropagation(); }}
                            ref={el => { sectionRefs.current[sectionKey] = el; }}
                            data-section={sectionKey}
                            onContextMenu={(e) => handleContextMenu(e, sectionKey)}
                        >
                            <HeroSection content={data.heroTextContent} fieldSettings={data.heroFieldSettings} fieldOrder={data.heroFieldOrder} />
                            {renderTextElements(sectionKey)}
                        </div>
                    );
                }

                // Custom Sections (Images)
                const imageUrl = data.imageUrls?.[sectionKey];
                const isPlaceholder = !imageUrl || imageUrl.includes('placeholder') || imageUrl.includes('via.placeholder');

                // Determine height: use explicit height if available, otherwise default logic
                const explicitHeight = sectionHeights[sectionKey];
                const styleHeight = explicitHeight ? `${explicitHeight}px` : (isPlaceholder ? '200px' : 'auto');

                // Image Transform
                const transform = imageTransforms?.[sectionKey] || { scale: 1, x: 0, y: 0 };
                const isHeld = heldSections.has(sectionKey);
                const isEditable = isHoldOn || forceEditSections.has(sectionKey);

                return (
                    <div
                        key={sectionKey}
                        data-section={sectionKey}
                        ref={el => { sectionRefs.current[sectionKey] = el; }}
                        className={`relative group overflow-hidden ${isHeld ? 'border-4 border-red-500' : ''}`}
                        style={{ minHeight: '50px', height: styleHeight, boxSizing: 'border-box' }}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, sectionKey)}
                        onClick={() => isPlaceholder && handleClickUpload(sectionKey)}
                        onContextMenu={(e) => handleContextMenu(e, sectionKey)}
                    >
                        {isPlaceholder ? (
                            <div className="w-full h-full border-4 border-dashed border-gray-200 flex flex-col items-center justify-center bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer box-border min-h-[200px]">
                                {sectionKey.startsWith('spacer-') ? (
                                    // Minimal placeholder for spacer
                                    <div className="text-gray-400 font-bold flex flex-col items-center">
                                        <span>여백 (높이 조절 가능)</span>
                                        <span className="text-xs font-normal mt-1">이미지 드롭 가능</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-6xl mb-6">📷</div>
                                        <div className="text-gray-500 font-bold text-xl">이미지를 드래그하여 업로드하세요</div>
                                        <div className="text-gray-400 text-base mt-3">또는 클릭하여 선택</div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div
                                className="relative w-full"
                            >
                                <img
                                    src={imageUrl}
                                    alt="Section"
                                    className={`w-full h-auto block select-none ${isEditable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} ${processingSections?.has(sectionKey) ? 'blur-sm' : ''}`}
                                    style={{
                                        transform: `scale(${transform.scale}) translate(${transform.x}px, ${transform.y}px)`,
                                        transformOrigin: 'center center',
                                        transition: panningState.sectionId === sectionKey ? 'none' : 'transform 0.1s ease-out'
                                    }}
                                    draggable={false}
                                    onMouseDown={(e) => handleImageMouseDown(e, sectionKey)}
                                    onWheel={(e) => !isPlaceholder && handleImageWheel(e, sectionKey)}
                                />
                                {/* Processing Overlay */}
                                {processingSections?.has(sectionKey) && (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center z-30 pointer-events-none">
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4"></div>
                                        <div className="text-white text-xl font-bold">변경중입니다...</div>
                                        <div className="text-white/70 text-sm mt-2">AI가 의류를 교체하고 있어요</div>
                                    </div>
                                )}
                                {/* Hold Indicator */}
                                {isHeld && !processingSections?.has(sectionKey) && (
                                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md z-20 pointer-events-none">
                                        LOCKED 🔒
                                    </div>
                                )}
                            </div>
                        )}
                        {renderTextElements(sectionKey)}

                        {/* Resize Handle (Available for ALL non-hero sections) - IF EDITABLE */}
                        {isEditable && (
                            <div
                                className="absolute bottom-0 left-0 w-full h-4 bg-transparent hover:bg-blue-400/50 cursor-ns-resize z-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-all group-hover:opacity-100"
                                onMouseDown={(e) => {
                                    const currentH = explicitHeight || e.currentTarget.parentElement?.clientHeight || 100;
                                    handleResizeMouseDown(e, sectionKey, currentH);
                                }}
                            >
                                <div className="w-12 h-1.5 bg-white border border-gray-300 rounded-full shadow-sm"></div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
});

PreviewPanel.displayName = 'PreviewPanel';
