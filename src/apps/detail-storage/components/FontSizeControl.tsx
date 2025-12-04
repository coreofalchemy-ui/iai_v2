/**
 * TypographyControl Component
 * Controls for adjusting font size and font family of selected preview items
 */

import React from 'react';

interface TypographyControlProps {
    selectedCount: number;
    onApplyFontSize: (size: number) => void;
    onApplyFontFamily: (fontFamily: string) => void;
    onApplyTextAlign?: (textAlign: 'left' | 'center' | 'right') => void;
    onDeleteSelected?: () => void;  // NEW: delete function
}

const TypographyControl: React.FC<TypographyControlProps> = ({
    selectedCount,
    onApplyFontSize,
    onApplyFontFamily,
    onApplyTextAlign,
    onDeleteSelected
}) => {
    const [fontSize, setFontSize] = React.useState(100);
    const [fontFamily, setFontFamily] = React.useState('default');

    // Auto-apply font size when it changes
    React.useEffect(() => {
        if (selectedCount > 0) {
            const timer = setTimeout(() => {
                onApplyFontSize(fontSize);
            }, 100); // Debounce slightly
            return () => clearTimeout(timer);
        }
    }, [fontSize, selectedCount, onApplyFontSize]);

    const fontSizePresets = [
        { label: '작게', value: 90 },
        { label: '보통', value: 100 },
        { label: '크게', value: 110 },
    ];

    const fontFamilies = [
        { label: '기본', value: 'default' },
        { label: 'Noto Sans KR', value: "'Noto Sans KR', sans-serif" },
        { label: 'Malgun Gothic', value: "'Malgun Gothic', sans-serif" },
        { label: 'Apple SD Gothic Neo', value: "'Apple SD Gothic Neo', sans-serif" },
        { label: 'Pretendard', value: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" },
        { label: 'Spoqa Han Sans', value: "'Spoqa Han Sans Neo', sans-serif" },
        { label: 'Nanum Gothic', value: "'Nanum Gothic', sans-serif" },
        { label: 'Nanum Myeongjo', value: "'Nanum Myeongjo', serif" },
        { label: 'Noto Serif KR', value: "'Noto Serif KR', serif" },
        { label: 'Gothic A1', value: "'Gothic A1', sans-serif" },
        { label: 'Roboto', value: "'Roboto', sans-serif" },
        { label: 'Montserrat', value: "'Montserrat', sans-serif" },
        { label: 'Playfair Display', value: "'Playfair Display', serif" },
    ];

    const handleApplyFont = () => {
        onApplyFontFamily(fontFamily);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-base">🔤</span>
                    <h3 className="font-semibold text-sm">글자 스타일</h3>
                </div>
                {selectedCount > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">
                        {selectedCount}개
                    </span>
                )}
            </div>

            <div className="space-y-3">
                {/* Font Size Presets */}
                <div className="grid grid-cols-3 gap-1.5">
                    {fontSizePresets.map((preset) => (
                        <button
                            key={preset.value}
                            onClick={() => setFontSize(preset.value)}
                            className={`text-xs py-1.5 px-2 rounded border transition-all ${fontSize === preset.value
                                ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                {/* Custom Slider */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-600">크기 조절</label>
                        <span className="text-xs font-bold text-gray-800">{fontSize}%</span>
                    </div>
                    <input
                        type="range"
                        min="70"
                        max="150"
                        step="5"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                </div>

                {/* Text Alignment */}
                {onApplyTextAlign && (
                    <div className="space-y-1">
                        <label className="text-xs text-gray-600 block">정렬</label>
                        <div className="flex border border-gray-200 rounded overflow-hidden">
                            <button
                                onClick={() => onApplyTextAlign('left')}
                                className="flex-1 py-1.5 hover:bg-gray-50 border-r border-gray-200 transition-colors"
                                title="왼쪽 정렬"
                            >
                                <span className="text-xs">Left</span>
                            </button>
                            <button
                                onClick={() => onApplyTextAlign('center')}
                                className="flex-1 py-1.5 hover:bg-gray-50 border-r border-gray-200 transition-colors"
                                title="가운데 정렬"
                            >
                                <span className="text-xs">Center</span>
                            </button>
                            <button
                                onClick={() => onApplyTextAlign('right')}
                                className="flex-1 py-1.5 hover:bg-gray-50 transition-colors"
                                title="오른쪽 정렬"
                            >
                                <span className="text-xs">Right</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Font Family Section */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-base">✏️</span>
                        <h3 className="font-semibold text-sm">서체</h3>
                    </div>

                    <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                        {fontFamilies.map((font) => (
                            <option key={font.value} value={font.value}>
                                {font.label}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={handleApplyFont}
                        disabled={selectedCount === 0 || fontFamily === 'default'}
                        className="w-full bg-purple-600 text-white font-semibold py-1.5 px-3 rounded text-xs hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        서체 적용
                    </button>
                </div>

                {/* Delete Selected Button */}
                {onDeleteSelected && (
                    <>
                        <div className="border-t border-gray-200"></div>
                        <button
                            onClick={onDeleteSelected}
                            disabled={selectedCount === 0}
                            className="w-full bg-red-600 text-white font-bold py-2.5 px-3 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            <span className="text-lg">🗑️</span>
                            선택 항목 삭제 ({selectedCount}개)
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default TypographyControl;
