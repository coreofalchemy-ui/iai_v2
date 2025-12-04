import React, { useCallback, useState, useMemo } from 'react';
import { UploadFile } from '../types';
import { PhotoIcon, XCircleIcon } from './Icons';
import { cropImageToTargetSize } from '../utils/fileUtils';

interface ImageUploaderProps {
  title: string;
  description: string;
  onFilesChange: (files: UploadFile[]) => void;
  maxFiles: number;
  maxSizeMB: number;
  isMultiple?: boolean;
  aspectRatio?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  title,
  description,
  onFilesChange,
  maxFiles,
  maxSizeMB,
  isMultiple = false,
  aspectRatio = '1/1',
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(async (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;

    setError(null);
    let newUploadFiles: UploadFile[] = [];
    let currentFiles = isMultiple ? [...files] : [];
    
    for (const file of Array.from(incomingFiles)) {
      if (currentFiles.length + newUploadFiles.length >= maxFiles) {
        setError(`파일은 최대 ${maxFiles}개까지 업로드할 수 있습니다.`);
        break;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`파일 "${file.name}"이(가) ${maxSizeMB}MB 크기 제한을 초과했습니다.`);
        continue;
      }
      if (!file.type.startsWith('image/')) {
        setError(`파일 "${file.name}"은(는) 유효한 이미지 형식이 아닙니다.`);
        continue;
      }
      newUploadFiles.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    
    const updatedFiles = [...currentFiles, ...newUploadFiles].slice(0, maxFiles);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  }, [files, maxFiles, maxSizeMB, isMultiple, onFilesChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFiles(e.target.files);
  };
  
  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
    // Also clear input value to allow re-uploading the same file
    const inputElement = document.getElementById(`file-upload-${title.replace(/\s+/g, '-')}`) as HTMLInputElement;
    if (inputElement) {
      inputElement.value = "";
    }
  };

  const hasFiles = files.length > 0;
  
  const gridColsClass = isMultiple ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-1';
  const aspectClass = aspectRatio === '1/1' ? 'aspect-square' : `aspect-[${aspectRatio}]`;

  const memoizedPreviews = useMemo(() => (
    <div className={`grid gap-4 ${hasFiles ? 'mt-4' : ''} ${gridColsClass}`}>
      {files.map((uploadFile, index) => (
        <div key={index} className={`relative group ${aspectClass}`}>
          <img src={uploadFile.previewUrl} alt={`preview ${index}`} className="w-full h-full object-cover rounded-lg" />
          <button onClick={() => removeFile(index)} className="absolute -top-2 -right-2 bg-gray-800 rounded-full text-white hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 z-10">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
      ))}
    </div>
  ), [files, hasFiles, gridColsClass, aspectClass]);

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-400 mb-4">{description}</p>
      
      <div 
        className={`flex-grow flex flex-col justify-center items-center p-6 border-2 border-dashed rounded-lg transition-colors
          ${dragActive ? 'border-indigo-400 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}
          ${hasFiles ? 'border-solid' : ''}
        `}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <label htmlFor={`file-upload-${title.replace(/\s+/g, '-')}`} className="w-full h-full flex flex-col justify-center items-center cursor-pointer">
          <input 
            id={`file-upload-${title.replace(/\s+/g, '-')}`}
            type="file"
            className="hidden"
            multiple={isMultiple}
            onChange={handleChange}
            accept="image/png, image/jpeg, image/webp"
          />
          {!hasFiles && (
            <>
              <PhotoIcon className="w-12 h-12 text-gray-500 mb-2" />
              <p className="text-gray-400 text-center"><span className="font-semibold text-indigo-400">클릭하여 업로드</span>하거나 파일을 끌어다 놓으세요</p>
              <p className="text-xs text-gray-500 mt-1">이미지당 최대 {maxSizeMB}MB</p>
            </>
          )}
          {memoizedPreviews}
        </label>
      </div>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  );
};
