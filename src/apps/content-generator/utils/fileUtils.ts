import { UploadFile } from "../types";

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error('Failed to read file as base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

// FIX: Add and export the missing 'dataURLtoFile' utility function.
export const dataURLtoFile = (dataUrl: string, filename: string): File => {
  const arr = dataUrl.split(',');
  if (arr.length < 2) {
    throw new Error('Invalid data URL format.');
  }
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error('Could not parse MIME type from data URL.');
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

export const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image to determine dimensions.'));
    };
    img.src = dataUrl;
  });
};

/**
 * Fits and pads an uploaded image to the target size, preventing cropping.
 * The image is scaled down to fit within the target dimensions while maintaining its aspect ratio,
 * and the remaining space is filled with a solid color.
 * @param file The image file to process.
 * @returns A promise that resolves with the processed UploadFile object.
 */
export const cropImageToTargetSize = (file: File): Promise<UploadFile> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context.'));
                }

                const targetWidth = 1165;
                const targetHeight = 1400;
                const targetAspectRatio = targetWidth / targetHeight;

                canvas.width = targetWidth;
                canvas.height = targetHeight;
                // Use a dark background color for padding, matching the app's theme.
                ctx.fillStyle = '#111827'; // bg-gray-900
                ctx.fillRect(0, 0, targetWidth, targetHeight);

                const imgW = img.width;
                const imgH = img.height;
                const imgAspect = imgW / imgH;

                let dx = 0, dy = 0, dWidth = targetWidth, dHeight = targetHeight;

                if (imgAspect > targetAspectRatio) {
                    // Image is wider than target, fit to width
                    dWidth = targetWidth;
                    dHeight = dWidth / imgAspect;
                    dy = (targetHeight - dHeight) / 2;
                } else {
                    // Image is taller than or equal to target, fit to height
                    dHeight = targetHeight;
                    dWidth = dHeight * imgAspect;
                    dx = (targetWidth - dWidth) / 2;
                }

                ctx.drawImage(img, 0, 0, imgW, imgH, dx, dy, dWidth, dHeight);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        return reject(new Error('Canvas to Blob conversion failed.'));
                    }
                    const fittedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
                    const previewUrl = URL.createObjectURL(fittedFile);
                    resolve({ file: fittedFile, previewUrl });
                }, 'image/jpeg', 0.95);
            };
            img.onerror = reject;
            img.src = event.target?.result as string;
        };
        reader.onerror = reject;
    });
};

/**
 * Enforces a target aspect ratio on an image from a data URL by padding it.
 * This function scales the image to fit within the target dimensions, preserving its
 * entire content and adding pillarboxes or letterboxes as needed.
 * @param dataUrl The data URL of the source image.
 * @param targetWidth The desired width of the output image.
 * @param targetHeight The desired height of the output image.
 * @returns A promise that resolves with the data URL of the padded image.
 */
export const enforceAspectRatio = (
    dataUrl: string,
    targetWidth: number,
    targetHeight: number
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            // Use a dark background color for padding.
            ctx.fillStyle = '#111827'; // bg-gray-900
            ctx.fillRect(0, 0, targetWidth, targetHeight);

            const imgW = img.naturalWidth;
            const imgH = img.naturalHeight;
            const targetAspect = targetWidth / targetHeight;
            const imgAspect = imgW / imgH;

            let dx = 0, dy = 0, dWidth = targetWidth, dHeight = targetHeight;

            if (imgAspect > targetAspect) {
                // Image is wider than target, fit to width and center vertically
                dWidth = targetWidth;
                dHeight = dWidth / imgAspect;
                dy = (targetHeight - dHeight) / 2;
            } else {
                // Image is taller than target, fit to height and center horizontally
                dHeight = targetHeight;
                dWidth = dHeight * imgAspect;
                dx = (targetWidth - dWidth) / 2;
            }
            
            ctx.drawImage(img, 0, 0, imgW, imgH, dx, dy, dWidth, dHeight);
            
            resolve(canvas.toDataURL('image/jpeg', 0.95));
        };
        img.onerror = (err) => {
            console.error("Failed to load image for aspect ratio enforcement.", err);
            reject(new Error('Failed to load image for fitting.'));
        };
        img.src = dataUrl;
    });
};