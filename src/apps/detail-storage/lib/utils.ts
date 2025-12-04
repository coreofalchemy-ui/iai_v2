/**
 * Utility functions for detail-storage app
 */

/**
 * Convert a File object to a data URL
 */
export async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to read file as data URL'));
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

/**
 * Get a friendly error message from an error object
 */
export function getFriendlyErrorMessage(error: unknown, defaultMessage: string): string {
    if (error instanceof Error) {
        return `${defaultMessage}: ${error.message}`;
    }
    return defaultMessage;
}
