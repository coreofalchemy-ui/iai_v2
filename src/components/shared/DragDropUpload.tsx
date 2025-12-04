import React, { useCallback, useState } from 'react';

interface DragDropUploadProps {
    onFilesSelected: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    maxFiles?: number;
    label?: string;
    description?: string;
    disabled?: boolean;
}

export const DragDropUpload: React.FC<DragDropUploadProps> = ({
    onFilesSelected,
    accept = 'image/*',
    multiple = false,
    maxFiles = 10,
    label = '이미지 업로드',
    description = 'JPG, PNG, WebP 지원',
    disabled = false,
}) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    }, []);

    const handleDragOut = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            if (disabled) return;

            const files = Array.from(e.dataTransfer.files);
            const validFiles = files.filter((file) => file.type.startsWith('image/'));

            if (validFiles.length > 0) {
                const filesToProcess = multiple ? validFiles.slice(0, maxFiles) : [validFiles[0]];
                onFilesSelected(filesToProcess);
            }
        },
        [disabled, multiple, maxFiles, onFilesSelected]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!e.target.files || disabled) return;

            const files = Array.from(e.target.files);
            const filesToProcess = multiple ? files.slice(0, maxFiles) : [files[0]];
            onFilesSelected(filesToProcess);
        },
        [disabled, multiple, maxFiles, onFilesSelected]
    );

    return (
        <div className="relative">
            <input
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleFileInput}
                disabled={disabled}
                className="hidden"
                id="file-upload"
            />

            <label
                htmlFor="file-upload"
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
          block border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-300
          ${isDragging
                        ? 'border-black bg-gray-50 scale-[1.02]'
                        : 'border-[#E5E5E5] bg-white hover:border-[#999999] hover:bg-gray-50'
                    }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
            >
                <div className="flex flex-col items-center gap-4">
                    {/* Icon */}
                    <svg
                        className="w-12 h-12 text-[#666666]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>

                    {/* Text */}
                    <div>
                        <p className="font-display text-lg font-[600] text-black mb-1">
                            {label}
                        </p>
                        <p className="font-primary text-sm text-[#999999]">
                            {description}
                        </p>
                    </div>

                    {/* Hint */}
                    <p className="font-primary text-xs text-[#CCCCCC] mt-2">
                        드래그 앤 드롭 또는 클릭하여 선택
                    </p>
                </div>
            </label>
        </div>
    );
};
