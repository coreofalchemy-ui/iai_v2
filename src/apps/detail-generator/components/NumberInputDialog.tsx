import React, { useState, useEffect, useRef } from 'react';

interface NumberInputDialogProps {
    visible: boolean;
    title: string;
    maxCount: number;
    onConfirm: (count: number) => void;
    onCancel: () => void;
}

export const NumberInputDialog: React.FC<NumberInputDialogProps> = ({
    visible,
    title,
    maxCount,
    onConfirm,
    onCancel
}) => {
    const [value, setValue] = useState(1);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (visible && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [visible]);

    useEffect(() => {
        if (visible) {
            setValue(1);
        }
    }, [visible]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const clampedValue = Math.max(1, Math.min(maxCount, value));
        onConfirm(clampedValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    if (!visible) return null;

    return (
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl p-6 min-w-[320px] transform animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-2xl">🎨</span>
                    {title}
                </h3>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            생성할 이미지 수 (최대 {maxCount}장)
                        </label>
                        <input
                            ref={inputRef}
                            type="number"
                            min={1}
                            max={maxCount}
                            value={value}
                            onChange={(e) => setValue(parseInt(e.target.value) || 1)}
                            onKeyDown={handleKeyDown}
                            className="w-full px-4 py-3 text-lg font-bold text-center border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        />
                        <p className="mt-2 text-xs text-gray-400">
                            💡 생성 시간: 약 {value * 5}~{value * 10}초 예상
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl hover:opacity-90 transition-opacity shadow-lg"
                        >
                            생성 시작 ✨
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NumberInputDialog;
