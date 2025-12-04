/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { generateSimpleHTML } from '../services/htmlGenerator';

interface LiveHTMLPreviewProps {
    previewItems: string[];
}

type PreviewMode = 'canvas' | 'mobile' | 'desktop' | 'tablet';
type ZoomLevel = 25 | 50 | 75 | 100 | 150 | 200;

const LiveHTMLPreview: React.FC<LiveHTMLPreviewProps> = ({ previewItems }) => {
    const [previewMode, setPreviewMode] = useState<PreviewMode>('canvas');
    const [zoom, setZoom] = useState<ZoomLevel>(100);
    const [isPanning, setIsPanning] = useState(false);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Update iframe content when preview items change
    useEffect(() => {
        if (iframeRef.current && previewItems.length > 0) {
            const htmlContent = generateSimpleHTML(previewItems);
            const iframe = iframeRef.current;
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

            if (iframeDoc) {
                iframeDoc.open();
                iframeDoc.write(htmlContent);
                iframeDoc.close();
            }
        }
    }, [previewItems]);

    // Pan handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (previewMode === 'canvas' && e.button === 1) { // Middle mouse button
            setIsPanning(true);
            setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            setPanOffset({
                x: e.clientX - startPan.x,
                y: e.clientY - startPan.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    // Zoom handler
    const handleZoom = (newZoom: ZoomLevel) => {
        setZoom(newZoom);
    };

    // Get frame dimensions based on preview mode
    const getFrameStyle = () => {
        const baseTransform = `scale(${zoom / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`;

        switch (previewMode) {
            case 'mobile':
                return {
                    width: '375px',
                    height: '667px',
                    transform: baseTransform,
                    border: '16px solid #1f2937',
                    borderRadius: '36px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                };
            case 'tablet':
                return {
                    width: '768px',
                    height: '1024px',
                    transform: baseTransform,
                    border: '12px solid #374151',
                    borderRadius: '24px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
                };
            case 'desktop':
                return {
                    width: '1440px',
                    height: '900px',
                    transform: baseTransform,
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                };
            case 'canvas':
            default:
                return {
                    width: '100%',
                    height: '100%',
                    transform: `scale(${zoom / 100})`,
                    border: 'none',
                    borderRadius: '0',
                    boxShadow: 'none'
                };
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
                {/* Preview Mode Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPreviewMode('canvas')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${previewMode === 'canvas'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        title="Canvas Mode (Default)"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setPreviewMode('mobile')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${previewMode === 'mobile'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        title="Mobile Preview"
                    >
                        📱 Mobile
                    </button>
                    <button
                        onClick={() => setPreviewMode('tablet')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${previewMode === 'tablet'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        title="Tablet Preview"
                    >
                        📱 Tablet
                    </button>
                    <button
                        onClick={() => setPreviewMode('desktop')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${previewMode === 'desktop'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        title="Desktop Preview"
                    >
                        💻 Desktop
                    </button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 mr-2">Zoom:</span>
                    {[25, 50, 75, 100, 150, 200].map((level) => (
                        <button
                            key={level}
                            onClick={() => handleZoom(level as ZoomLevel)}
                            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${zoom === level
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {level}%
                        </button>
                    ))}
                </div>

                {/* Item Count */}
                <div className="text-sm text-gray-500">
                    {previewItems.length}개 이미지
                </div>
            </div>

            {/* Canvas Area */}
            <div
                ref={canvasRef}
                className="flex-1 overflow-auto bg-gray-100 relative"
                style={{
                    backgroundImage: previewMode === 'canvas'
                        ? 'radial-gradient(circle, #d1d5db 1px, transparent 1px)'
                        : 'none',
                    backgroundSize: '20px 20px',
                    cursor: isPanning ? 'grabbing' : previewMode === 'canvas' ? 'grab' : 'default'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div className="flex items-center justify-center min-h-full p-8">
                    {previewItems.length === 0 ? (
                        <div className="text-center">
                            <div className="text-gray-400 mb-4">
                                <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                                    <polyline points="21,15 16,10 5,21" strokeWidth="2" />
                                </svg>
                            </div>
                            <p className="text-lg font-medium text-gray-700">생성된 이미지가 여기에 표시됩니다</p>
                            <p className="text-sm text-gray-500 mt-2">각 단계에서 이미지를 생성하면 자동으로 추가됩니다</p>
                        </div>
                    ) : (
                        <div
                            className="transition-all origin-center"
                            style={getFrameStyle()}
                        >
                            <iframe
                                ref={iframeRef}
                                className="w-full h-full bg-white"
                                title="Live Preview"
                                sandbox="allow-same-origin"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveHTMLPreview;
