import React from 'react';

interface FieldToggleControlProps {
    label: string;
    emoji?: string;
    isVisible: boolean;
    onToggleVisibility: () => void;
    fontSize?: number;
    onFontSizeChange?: (size: number) => void;
    children: React.ReactNode;
    showFontControl?: boolean;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
    fieldId?: string;
}

export const FieldToggleControl: React.FC<FieldToggleControlProps> = ({
    label,
    emoji,
    isVisible,
    onToggleVisibility,
    fontSize = 14,
    onFontSizeChange,
    children,
    showFontControl = true,
    draggable = false,
    onDragStart,
    onDragOver,
    onDrop,
    fieldId
}) => {
    return (
        <div
            className={`rounded border ${isVisible ? 'border-blue-200 bg-white' : 'border-gray-200 bg-gray-50'} p-1.5 transition-all ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
            draggable={draggable}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            data-field-id={fieldId}
        >
            {/* Header with Toggle */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                    {draggable && <span className="text-gray-300 text-[10px] cursor-grab">⋮⋮</span>}
                    {emoji && <span className="text-xs">{emoji}</span>}
                    <label className={`text-[11px] font-bold ${isVisible ? 'text-gray-700' : 'text-gray-400'}`}>
                        {label}
                    </label>
                </div>
                <div className="flex items-center gap-1.5">
                    {/* Font Size Slider - Thinner and longer */}
                    {showFontControl && isVisible && onFontSizeChange && (
                        <div className="flex items-center gap-0.5">
                            <span className="text-[9px] text-gray-400">T</span>
                            <input
                                type="range"
                                min="10"
                                max="48"
                                value={fontSize}
                                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                                className="w-20 h-0.5 appearance-none bg-gray-200 rounded-full cursor-pointer accent-blue-500"
                                style={{ height: '3px' }}
                                title={`폰트 크기: ${fontSize}px`}
                            />
                            <span className="text-[9px] text-gray-500 w-4">{fontSize}</span>
                        </div>
                    )}
                    {/* Toggle Switch */}
                    <button
                        onClick={onToggleVisibility}
                        className={`relative w-7 h-3.5 rounded-full transition-colors ${isVisible ? 'bg-blue-500' : 'bg-gray-300'}`}
                        title={isVisible ? '끄기' : '켜기'}
                    >
                        <div
                            className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full shadow transition-transform ${isVisible ? 'translate-x-3.5' : 'translate-x-0.5'}`}
                        />
                    </button>
                </div>
            </div>
            {/* Content - Only show if visible */}
            {isVisible && (
                <div>
                    {children}
                </div>
            )}
        </div>
    );
};
