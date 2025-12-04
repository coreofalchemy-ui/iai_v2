/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { applyShoeEffect, applyColorChange } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import ComparisonModal from './components/ComparisonModal';

type Effect = 
  'natural_light' | 
  'cinematic' | 
  'side_lighting' | 
  'beautify' | 
  'custom' |
  'studio_minimal_prop' |
  'studio_natural_floor' |
  'studio_texture_emphasis' |
  'studio_cinematic';

type Result = { 
  id: string;
  originalFile: File; 
  status: 'pending' | 'loading' | 'done' | 'error';
  url?: string;
  error?: string;
  processingStep?: string;
  effect: Effect;
  isSelected: boolean;
  poseInfo?: { id: string; name: string; };
};

const beautifyPoses: { id: string; name:string; }[] = [
  { id: 'left_profile_single', name: '측면 (왼쪽, 외발)' },
  { id: 'left_diagonal_single', name: '사선 (왼쪽, 외발)' },
  { id: 'front_apart_pair', name: '정면 (양발)' },
  { id: 'left_diagonal_pair', name: '사선 (양발)' },
  { id: 'rear_pair', name: '후면 (양발)' },
  { id: 'top_down_instep_pair', name: '탑다운 (발등 위주, 인솔 안보임)' },
];

// Icons
const NaturalLightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const CinematicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v14M9 5v14M5 9h4m0 0v6m0-6h6m-6 0v6m6-6h4m0 0v6m-4-6v-2a2 2 0 012-2h0a2 2 0 012 2v2m-4 6v2a2 2 0 002 2h0a2 2 0 002-2v-2" /></svg>;
const SideLightingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 12h6" /><path d="M15 12h6" /></svg>;
const StudioIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const BeautifyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
const CustomIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>;

const effects: { id: Effect; name: string; icon: React.ReactElement }[] = [
  { id: 'beautify', name: '미화 (제품 누끼)', icon: <BeautifyIcon /> },
  { id: 'studio_minimal_prop', name: '스튜디오 - 미니멀 소품', icon: <StudioIcon /> },
  { id: 'studio_natural_floor', name: '스튜디오 - 자연광 바닥', icon: <NaturalLightIcon /> },
  { id: 'studio_texture_emphasis', name: '스튜디오 - 텍스처 부각', icon: <SideLightingIcon /> },
  { id: 'studio_cinematic', name: '스튜디오 - 시네마틱', icon: <CinematicIcon /> },
  { id: 'custom', name: '커스텀 배경', icon: <CustomIcon /> },
];

const colorPalette: { name: string; hex: string }[] = [
    { name: 'Vivid Red', hex: '#d32f2f' },
    { name: 'Forest Green', hex: '#388e3c' },
    { name: 'Royal Blue', hex: '#1976d2' },
    { name: 'Sunny Yellow', hex: '#fbc02d' },
    { name: 'Deep Purple', hex: '#7b1fa2' },
    { name: 'Rich Orange', hex: '#f57c00' },
    { name: 'Jet Black', hex: '#111111' },
    { name: 'Pure White', hex: '#fafafa' },
];

// Helper functions for saving/loading
const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error('Invalid data URL');
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

const getFriendlyErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429')) {
             return 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.';
        }
        try {
            // Attempt to parse the error message if it's a JSON string
            const errorJson = JSON.parse(error.message);
             if (errorJson.error && errorJson.error.message) {
                return `API 오류: ${errorJson.error.message}`;
            }
        } catch (e) {
            // Not a JSON string, return the original message
            return error.message;
        }
    }
    return '알 수 없는 오류가 발생했습니다.';
};

const App: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [customBackground, setCustomBackground] = useState<File | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<Effect>('beautify');
  const [results, setResults] = useState<Result[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApplyingColor, setIsApplyingColor] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isBgDragging, setIsBgDragging] = useState(false);
  const [modalData, setModalData] = useState<{ originalUrl: string; generatedUrl: string; } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const loadProjectInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const imageRefs = useRef<{ [id: string]: HTMLImageElement | null }>({});
  
  // Color Change State
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [customColorImage, setCustomColorImage] = useState<File | null>(null);

  // Resize State
  const [resizeWidth, setResizeWidth] = useState('1024');
  const [resizeHeight, setResizeHeight] = useState('768');

  const updateUploadedFiles = (newFiles: File[]) => {
    const imageFiles = newFiles.filter((file: File) => file.type.startsWith('image/'));
    setUploadedFiles(prev => [...prev, ...imageFiles].slice(0, 10));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      updateUploadedFiles(Array.from(event.target.files));
    }
  };
  
  const handleBgFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setCustomBackground(event.target.files[0]);
    }
  };

  const applyColorToResults = useCallback(async (colorHex: string | null, colorImage: File | null) => {
    const resultsToUpdate = results.filter(r => r.isSelected && r.url);
    if (resultsToUpdate.length === 0) {
        alert("색상을 적용할 이미지를 선택해주세요.");
        return;
    }

    setIsApplyingColor(true);

    setResults(prev => prev.map(r => 
        resultsToUpdate.find(u => u.id === r.id) 
        ? { ...r, status: 'loading', processingStep: '색상 적용 중...' } 
        : r
    ));
    
    const colorPromises = resultsToUpdate.map(async (result) => {
        try {
            const response = await fetch(result.url!);
            const blob = await response.blob();
            const baseImageFile = new File([blob], "baseImage.png", { type: blob.type });

            const newUrl = await applyColorChange(
                baseImageFile,
                (message) => { 
                    setResults(prevResults => prevResults.map(r => 
                        r.id === result.id ? { ...r, processingStep: message } : r
                    ));
                },
                colorHex,
                colorImage
            );
            return { id: result.id, success: true, url: newUrl };
        } catch (err) {
            const friendlyError = getFriendlyErrorMessage(err);
            return { id: result.id, success: false, error: friendlyError };
        }
    });

    const updatedResults = await Promise.all(colorPromises);

    setResults(prev => prev.map(r => {
        const updated = updatedResults.find(u => u.id === r.id);
        if (!updated) return r;
        if (updated.success) {
            return { ...r, status: 'done', url: updated.url, processingStep: '완료' };
        } else {
            return { ...r, status: 'error', error: updated.error, processingStep: '색상 적용 실패' };
        }
    }));

    setIsApplyingColor(false);
  }, [results]);

  const handleColorFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setCustomColorImage(file);
      setSelectedColor(null);
      if (results.some(r => r.status === 'done')) {
        applyColorToResults(null, file);
      }
      if (event.target) event.target.value = '';
    }
  };
  
  const handleColorSwatchClick = (hex: string) => {
      const newSelectedColor = selectedColor === hex ? null : hex;
      setSelectedColor(newSelectedColor);
      setCustomColorImage(null);

      if (newSelectedColor && results.some(r => r.status === 'done')) {
        applyColorToResults(newSelectedColor, null);
      }
  };
  
  const clearColorSelection = () => {
    setSelectedColor(null);
    setCustomColorImage(null);
  }

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      updateUploadedFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleBgDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsBgDragging(true); }, []);
  const handleBgDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsBgDragging(false); }, []);
  const handleBgDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsBgDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setCustomBackground(e.dataTransfer.files[0]);
    }
  }, []);
  
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = useCallback(async () => {
    if (uploadedFiles.length === 0) return;
    if (selectedEffect === 'custom' && !customBackground) return;
    
    clearColorSelection();
    setIsProcessing(true);
    
    const initialResults: Result[] = [];
    if (selectedEffect === 'beautify') {
        const primaryFile = uploadedFiles[0]; 
        if (primaryFile) {
            beautifyPoses.forEach(pose => {
                initialResults.push({
                    id: `${primaryFile.name}-beautify-${pose.id}-${Date.now()}`,
                    originalFile: primaryFile,
                    status: 'loading',
                    processingStep: '대기 중...',
                    effect: 'beautify',
                    isSelected: true,
                    poseInfo: pose,
                });
            });
        }
    } else {
        uploadedFiles.forEach(file => {
            initialResults.push({
                id: `${file.name}-${selectedEffect}-${Date.now()}`,
                originalFile: file,
                status: 'loading',
                processingStep: '대기 중...',
                effect: selectedEffect,
                isSelected: true,
            });
        });
    }
    setResults(initialResults);

    for (const result of initialResults) {
        try {
            const onProgressUpdate = (message: string) => {
                setResults(prevResults => prevResults.map(r => 
                    r.id === result.id ? { ...r, processingStep: message } : r
                ));
            };
            
            const filesToProcess = result.effect === 'beautify' ? uploadedFiles : [result.originalFile];
            const poseId = result.effect === 'beautify' ? result.poseInfo?.id : undefined;
            const resultUrl = await applyShoeEffect(filesToProcess, result.effect, onProgressUpdate, customBackground, poseId);

            setResults(prevResults => prevResults.map((r) => 
                r.id === result.id ? { ...r, status: 'done', url: resultUrl, processingStep: '완료' } : r
            ));
        } catch (err) {
            const friendlyError = getFriendlyErrorMessage(err);
            setResults(prevResults => prevResults.map((r) => 
                r.id === result.id ? { ...r, status: 'error', error: friendlyError, processingStep: '실패' } : r
            ));
        } finally {
            // Add a delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    setIsProcessing(false);
  }, [uploadedFiles, selectedEffect, customBackground]);

  const handleRegenerate = useCallback(async (resultId: string) => {
    const sourceResult = results.find(r => r.id === resultId);
    if (!sourceResult || isProcessing || isApplyingColor) return;

    setIsProcessing(true);
    setResults(prev => prev.map(r => r.id === resultId ? { ...r, status: 'loading', processingStep: '재생성 대기 중...', url: undefined, error: undefined } : r));

    try {
        const onProgressUpdate = (message: string) => {
            setResults(prevResults => prevResults.map(r => 
                r.id === resultId ? { ...r, processingStep: message } : r
            ));
        };
        
        const filesToProcess = sourceResult.effect === 'beautify' ? uploadedFiles : [sourceResult.originalFile];
        const poseId = sourceResult.effect === 'beautify' ? sourceResult.poseInfo?.id : undefined;
        const resultUrl = await applyShoeEffect(filesToProcess, sourceResult.effect, onProgressUpdate, customBackground, poseId);

        setResults(prevResults => prevResults.map((r) => 
            r.id === resultId ? { ...r, status: 'done', url: resultUrl, processingStep: '완료' } : r
        ));
    } catch (err) {
        const friendlyError = getFriendlyErrorMessage(err);
        setResults(prevResults => prevResults.map((r) => 
            r.id === resultId ? { ...r, status: 'error', error: friendlyError, processingStep: '실패' } : r
        ));
    } finally {
        // Add a delay here too for consistency
         await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsProcessing(false);
  }, [results, isProcessing, isApplyingColor, customBackground, uploadedFiles]);

    const handleResize = (width: number, height: number) => {
        const resultsToResize = results.filter(r => r.isSelected && r.status === 'done' && r.url);
    
        if (resultsToResize.length === 0) {
            alert("사이즈를 조정할 이미지를 선택해주세요.");
            return;
        }
    
        const newResults: Result[] = [];
        let allImagesReady = true;
    
        for (const sourceResult of resultsToResize) {
            const imgElement = imageRefs.current[sourceResult.id];
            if (!imgElement || !imgElement.complete || imgElement.naturalWidth === 0) {
                console.warn(`Image for result ${sourceResult.id} is not ready for resize. Skipping.`);
                allImagesReady = false;
                continue;
            }
        
            try {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error("Canvas context를 가져올 수 없습니다.");
                }
        
                const sourceWidth = imgElement.naturalWidth;
                const sourceHeight = imgElement.naturalHeight;
                const sourceAspectRatio = sourceWidth / sourceHeight;
                const targetAspectRatio = width / height;
        
                let sx = 0, sy = 0, sWidth = sourceWidth, sHeight = sourceHeight;
        
                if (sourceAspectRatio > targetAspectRatio) {
                    sHeight = sourceHeight;
                    sWidth = sourceHeight * targetAspectRatio;
                    sx = (sourceWidth - sWidth) / 2;
                } else {
                    sWidth = sourceWidth;
                    sHeight = sourceWidth / targetAspectRatio;
                    sy = (sourceHeight - sHeight) / 2;
                }
        
                ctx.drawImage(imgElement, sx, sy, sWidth, sHeight, 0, 0, width, height);
        
                const newUrl = canvas.toDataURL('image/png');
                
                const newResultId = `${sourceResult.id}-resized-${width}x${height}-${Date.now()}`;
                const newResult: Result = {
                    ...sourceResult,
                    id: newResultId,
                    status: 'done',
                    url: newUrl,
                    processingStep: '완료',
                    isSelected: false, // Start deselected
                    effect: 'custom',
                    poseInfo: { id: `${width}x${height}`, name: `사이즈 조정됨` },
                };
                newResults.push(newResult);
            
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
                console.error(`Image resize failed for ${sourceResult.id}: ${errorMessage}`);
            }
        }
    
        if (!allImagesReady) {
            alert("일부 이미지가 아직 로드되지 않아 사이즈 조정에서 제외되었습니다. 잠시 후 다시 시도해주세요.");
        }
    
        if (newResults.length > 0) {
            setResults(prev => [...prev, ...newResults]);
        }
    };
  
  const handleZipDownload = useCallback(async (resultsToDownload: Result[]) => {
    const zip = new JSZip();
    const successfulResults = resultsToDownload.filter(r => r.status === 'done' && r.url);
    if (successfulResults.length === 0) {
        alert("다운로드할 이미지가 없습니다.");
        return;
    }

    for (const result of successfulResults) {
        const response = await fetch(result.url!);
        const blob = await response.blob();
        const filename = `${result.originalFile.name.split('.')[0]}-${result.effect}${result.poseInfo ? '-' + result.poseInfo.id : ''}.png`;
        zip.file(filename, blob);
    }

    zip.generateAsync({ type: "blob" }).then((content) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "shoe_results.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
  }, []);

  const handleDownloadSelected = useCallback(() => {
    const selectedResults = results.filter(r => r.isSelected);
    handleZipDownload(selectedResults);
  }, [results, handleZipDownload]);

  const handleDownloadAll = useCallback(() => {
    handleZipDownload(results);
  }, [results, handleZipDownload]);

  const handleSelectResult = (id: string) => {
    setResults(prevResults =>
        prevResults.map(r =>
            r.id === id ? { ...r, isSelected: !r.isSelected } : r
        )
    );
  };
  
    const handleSelectAll = () => {
        setResults(prev => prev.map(r => r.status === 'done' ? { ...r, isSelected: true } : r));
    };

    const handleDeselectAll = () => {
        setResults(prev => prev.map(r => ({ ...r, isSelected: false })));
    };

    const handleResultClick = (result: Result) => {
        // Opens the zoom modal
        if (result.status === 'done' && result.url) {
            const originalUrl = URL.createObjectURL(result.originalFile);
            setModalData({ originalUrl, generatedUrl: result.url });
        }
    };
  
  const handleCloseModal = () => {
    if (modalData) {
        URL.revokeObjectURL(modalData.originalUrl);
    }
    setModalData(null);
  };
  
  const handleSaveProject = async () => {
    if (uploadedFiles.length === 0 && results.length === 0) {
      alert("저장할 데이터가 없습니다.");
      return;
    }
    
    try {
      const serializableUploadedFiles = await Promise.all(
        uploadedFiles.map(async file => ({
          name: file.name,
          dataURL: await fileToDataURL(file),
        }))
      );

      const serializableResults = await Promise.all(
        results.map(async result => ({
          ...result,
          originalFile: {
            name: result.originalFile.name,
            dataURL: await fileToDataURL(result.originalFile),
          },
        }))
      );
      
      const projectData = {
        uploadedFiles: serializableUploadedFiles,
        results: serializableResults,
      };

      const jsonString = JSON.stringify(projectData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'shoe_project.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
        console.error("프로젝트 저장 실패:", error);
        alert("프로젝트를 저장하는 데 실패했습니다.");
    }
  };

  const handleProjectFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("파일 내용을 읽을 수 없습니다.");
        }
        const projectData = JSON.parse(text);

        const loadedFiles = projectData.uploadedFiles.map((f: {name: string; dataURL: string}) => dataURLtoFile(f.dataURL, f.name));
        setUploadedFiles(loadedFiles);

        const loadedResults = projectData.results.map((r: any) => ({
            ...r,
            originalFile: dataURLtoFile(r.originalFile.dataURL, r.originalFile.name)
        }));
        setResults(loadedResults);
        
      } catch (error) {
        console.error("프로젝트 불러오기 실패:", error);
        alert("유효하지 않은 프로젝트 파일입니다.");
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };
  
  const isGenerateDisabled = isProcessing || isApplyingColor || uploadedFiles.length === 0 || (selectedEffect === 'custom' && !customBackground);
  const successfulResultsCount = results.filter(r => r.status === 'done').length;
  const selectedResultsCount = results.filter(r => r.isSelected && r.status === 'done').length;
  const isPostProcessingDisabled = results.length === 0 || isProcessing || isApplyingColor;
  const isResizeDisabled = isPostProcessingDisabled || selectedResultsCount === 0;


  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <aside className="sidebar">
        <Header />

        <div className="flex gap-2 my-4">
            <input type="file" ref={loadProjectInputRef} onChange={handleProjectFileChange} className="hidden" accept=".json" />
            <button
                onClick={handleSaveProject}
                className="flex-1 text-sm bg-white border border-zinc-300 text-zinc-700 font-semibold py-2 px-4 rounded-lg hover:bg-zinc-100 transition-colors"
            >
                프로젝트 저장
            </button>
            <button
                onClick={() => loadProjectInputRef.current?.click()}
                className="flex-1 text-sm bg-white border border-zinc-300 text-zinc-700 font-semibold py-2 px-4 rounded-lg hover:bg-zinc-100 transition-colors"
            >
                프로젝트 불러오기
            </button>
        </div>

        <div className="flex-grow flex flex-col gap-8">
          {/* Upload Section */}
          <div>
            <h2 className="text-xl font-bold mb-4">1. 신발 이미지 업로드</h2>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full h-36 bg-white border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center transition-colors cursor-pointer hover:border-blue-500 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-zinc-300'}`}
            >
              <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-zinc-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="font-semibold text-zinc-700">여기에 파일을 드래그하세요</p>
              <p className="text-sm text-zinc-500">또는 클릭하여 선택 ({uploadedFiles.length}/10)</p>
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-2 rounded-md border">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <img src={URL.createObjectURL(file)} alt={file.name} className="w-10 h-10 object-cover rounded-md flex-shrink-0" />
                      <span className="text-sm text-zinc-700 truncate">{file.name}</span>
                    </div>
                    <button onClick={() => handleRemoveFile(index)} className="text-zinc-400 hover:text-zinc-700 p-1 rounded-full flex-shrink-0">
                      <CloseIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Effect Section */}
          <div>
            <h2 className="text-xl font-bold mb-4">2. 이미지 효과 선택</h2>
            <div className="space-y-3">
              {effects.map(effect => (
                <button 
                  key={effect.id}
                  onClick={() => setSelectedEffect(effect.id)}
                  className={`effect-card w-full flex items-center gap-4 p-4 border rounded-lg text-left transition-all ${selectedEffect === effect.id ? 'selected bg-white' : 'bg-white border-zinc-200 hover:border-zinc-300'}`}
                >
                  <div className={`p-2 rounded-lg ${selectedEffect === effect.id ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-600'}`}>
                    {effect.icon}
                  </div>
                  <span className="text-lg font-semibold text-zinc-800">{effect.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Background Section */}
          {selectedEffect === 'custom' && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold mb-4">3. 배경 스타일 참조 (선택)</h2>
              <div
                onDragOver={handleBgDragOver}
                onDragLeave={handleBgDragLeave}
                onDrop={handleBgDrop}
                onClick={() => bgFileInputRef.current?.click()}
                className={`w-full aspect-video bg-white border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center transition-colors cursor-pointer hover:border-blue-500 ${isBgDragging ? 'border-blue-500 bg-blue-50' : 'border-zinc-300'}`}
              >
                <input type="file" accept="image/*" ref={bgFileInputRef} onChange={handleBgFileChange} className="hidden" />
                {customBackground ? (
                    <img src={URL.createObjectURL(customBackground)} alt="배경 스타일 프리뷰" className="w-full h-full object-cover rounded-lg"/>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-zinc-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="font-semibold text-zinc-700">배경 스타일로 참조할 이미지 드래그</p>
                        <p className="text-sm text-zinc-500">또는 클릭하여 선택</p>
                    </>
                )}
              </div>
            </div>
          )}

           {/* Color Change Section */}
          <div className={`${isPostProcessingDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">3. 생성 후 컬러 변경</h2>
                {(selectedColor || customColorImage) && (
                    <button onClick={clearColorSelection} className="text-xs font-semibold text-zinc-500 hover:text-zinc-800">초기화</button>
                )}
            </div>
            <div className="bg-white p-4 rounded-lg border border-zinc-200">
                <div className="grid grid-cols-4 gap-3 mb-4">
                    {colorPalette.map(color => (
                        <button 
                            key={color.hex}
                            onClick={() => handleColorSwatchClick(color.hex)}
                            className={`w-full aspect-square rounded-full transition-transform hover:scale-110 ${selectedColor === color.hex ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                            style={{ backgroundColor: color.hex, border: '1px solid rgba(0,0,0,0.1)' }}
                            title={color.name}
                        />
                    ))}
                </div>
                <input type="file" accept="image/*" ref={colorInputRef} onChange={handleColorFileChange} className="hidden" />
                <button
                    onClick={() => colorInputRef.current?.click()}
                    className="w-full text-center bg-zinc-100 text-zinc-700 text-sm font-semibold py-3 px-4 rounded-lg hover:bg-zinc-200 transition-colors border border-zinc-300"
                >
                    {customColorImage ? `참조: ${customColorImage.name}` : '참조 이미지로 컬러 지정'}
                </button>
            </div>
          </div>
          
          {/* Size Adjustment Section */}
          <div className={`${isPostProcessingDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
             <h2 className="text-xl font-bold mb-4">4. 사이즈 조정</h2>
             <div className={`bg-white p-4 rounded-lg border border-zinc-200 space-y-3 transition-opacity ${isResizeDisabled ? 'opacity-50' : 'opacity-100'}`}>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleResize(1024, 768)} disabled={isResizeDisabled} className="text-sm text-center bg-zinc-100 text-zinc-700 font-semibold py-2 px-3 rounded-lg hover:bg-zinc-200 transition-colors border border-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed">가로형</button>
                    <button onClick={() => handleResize(768, 1024)} disabled={isResizeDisabled} className="text-sm text-center bg-zinc-100 text-zinc-700 font-semibold py-2 px-3 rounded-lg hover:bg-zinc-200 transition-colors border border-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed">세로형</button>
                    <button onClick={() => handleResize(1024, 1024)} disabled={isResizeDisabled} className="text-sm text-center bg-zinc-100 text-zinc-700 font-semibold py-2 px-3 rounded-lg hover:bg-zinc-200 transition-colors border border-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed">정사각형</button>
                </div>
                <div className="flex items-center gap-2">
                    <input type="number" value={resizeWidth} onChange={e => setResizeWidth(e.target.value)} disabled={isResizeDisabled} className="w-full p-2 border border-zinc-300 rounded-md text-sm disabled:opacity-50" placeholder="가로" />
                    <span className="text-zinc-500">x</span>
                    <input type="number" value={resizeHeight} onChange={e => setResizeHeight(e.target.value)} disabled={isResizeDisabled} className="w-full p-2 border border-zinc-300 rounded-md text-sm disabled:opacity-50" placeholder="세로" />
                    <button onClick={() => handleResize(parseInt(resizeWidth), parseInt(resizeHeight))} disabled={isResizeDisabled} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed">조정</button>
                </div>
                 {selectedResultsCount === 0 && <p className="text-xs text-zinc-500 text-center pt-1">사이즈를 조정할 결과물 이미지의 체크박스를 선택하세요.</p>}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-auto pt-8">
          <button 
            onClick={handleGenerate}
            disabled={isGenerateDisabled}
            className="main-button bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? '생성 중...' : isApplyingColor ? '색상 적용 중...' : '이미지 생성'}
          </button>
        </div>
      </aside>

      {/* Right Content Area */}
      <main className="content-area">
        {results.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <h2 className="text-3xl font-bold">결과물이 여기에 표시됩니다</h2>
            <p className="mt-2 text-lg">신발 이미지를 업로드하고 효과를 선택한 후 '이미지 생성'을 누르세요.</p>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
              <h2 className="text-3xl font-bold">생성된 이미지 ({successfulResultsCount}/{results.length})</h2>
              <div className="flex gap-2 items-center flex-wrap">
                 <button 
                    onClick={handleSelectAll}
                    disabled={isPostProcessingDisabled || successfulResultsCount === 0}
                    className="text-sm bg-white border border-zinc-300 text-zinc-700 font-semibold py-2 px-4 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50"
                  >
                    모두 선택
                  </button>
                  <button 
                    onClick={handleDeselectAll}
                    disabled={isPostProcessingDisabled || successfulResultsCount === 0}
                    className="text-sm bg-white border border-zinc-300 text-zinc-700 font-semibold py-2 px-4 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50"
                  >
                    선택 해제
                  </button>
                  <div className="h-8 border-l border-zinc-300"></div>
                 <button 
                    onClick={handleDownloadSelected} 
                    disabled={isProcessing || isApplyingColor || selectedResultsCount === 0}
                    className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors hover:bg-blue-700 disabled:bg-zinc-400"
                  >
                    선택 항목 다운로드 ({selectedResultsCount})
                  </button>
                  <button 
                    onClick={handleDownloadAll} 
                    disabled={isProcessing || isApplyingColor || successfulResultsCount === 0}
                    className="bg-zinc-800 text-white font-bold py-3 px-6 rounded-lg transition-colors hover:bg-black disabled:bg-zinc-400"
                  >
                    모두 다운로드 (ZIP)
                  </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-6 gap-y-8">
              {results.map(result => {
                const downloadName = `${result.originalFile.name.split('.')[0]}-${result.effect}${result.poseInfo ? '-' + result.poseInfo.id : ''}.png`;

                return (
                  <div key={result.id}>
                    {result.poseInfo && (
                        <h3 className="text-center font-semibold text-zinc-800 mb-2 truncate" title={result.poseInfo.name}>
                            {result.poseInfo.name}
                        </h3>
                    )}
                    <div 
                        className={`bg-white rounded-xl shadow-sm transition-all hover:shadow-md flex flex-col border-2 ${result.isSelected ? 'border-blue-500' : 'border-transparent'}`}
                    >
                        <div 
                            className={`w-full aspect-[1165/1400] border-b rounded-t-xl overflow-hidden group bg-zinc-100 flex items-center justify-center text-center relative cursor-pointer`}
                            onClick={() => handleResultClick(result)}
                        >
                            {result.status === 'loading' && (
                                <div className="flex flex-col items-center justify-center text-zinc-500">
                                    <Spinner />
                                    <p className="text-md text-zinc-700 mt-4 font-semibold">{result.processingStep}</p>
                                </div>
                            )}
                            {result.status === 'error' && <div className="p-4"><p className="text-red-600 font-bold text-lg">생성 실패</p><p className="text-sm text-zinc-600 mt-2 break-all">{result.error}</p></div>}
                            {result.status === 'done' && result.url && (
                            <>
                                <img 
                                    ref={el => { if (el) imageRefs.current[result.id] = el; }}
                                    crossOrigin="anonymous"
                                    src={result.url} 
                                    alt="생성된 이미지" 
                                    className="w-full h-full object-cover" 
                                />
                                <div className="absolute top-4 right-4 z-10">
                                    <input
                                        type="checkbox"
                                        checked={result.isSelected}
                                        onChange={() => handleSelectResult(result.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-6 w-6 rounded text-blue-600 focus:ring-blue-500 border-zinc-300 bg-white/50"
                                    />
                                </div>
                            </>
                            )}
                        </div>
                        {result.status === 'done' && (
                            <div className="p-4 flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <a 
                                        href={result.url} 
                                        download={downloadName}
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex-1 text-center bg-blue-50 text-blue-700 text-sm font-semibold py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        다운로드
                                    </a>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRegenerate(result.id); }}
                                        disabled={isProcessing || isApplyingColor}
                                        className="flex-1 text-center bg-zinc-100 text-zinc-700 text-sm font-semibold py-2 px-4 rounded-lg hover:bg-zinc-200 transition-colors disabled:bg-zinc-100 disabled:text-zinc-400"
                                    >
                                        다시 그리기
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
      {modalData && (
        <ComparisonModal 
            originalImageUrl={modalData.originalUrl}
            generatedImageUrl={modalData.generatedUrl}
            onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default App;