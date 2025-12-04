export const urlToBase64 = async (url: string): Promise<string> => {
    if (url.startsWith('data:')) {
        return url.split(',')[1];
    }
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};
