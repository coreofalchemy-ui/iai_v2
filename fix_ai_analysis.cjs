const fs = require('fs');

const path = 'C:/Users/user/.gemini/antigravity/scratch/COAAI_V2/src/apps/detail-generator/components/AdjustmentPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

// Use regex to find and replace the handleAIAnalysis function's try block
const oldPattern = /const handleAIAnalysis = async \(\) => \{[\s\S]*?setIsGeneratingAI\(true\);[\s\S]*?try \{[\s\S]*?const productImage = data\.imageUrls\?\.\products\?\.\[0\];[\s\S]*?if \(!productImage\) \{[\s\S]*?alert\('제품 이미지가 없습니다\.'\);[\s\S]*?return;[\s\S]*?\}[\s\S]*?const aiCopy = await generateAICopywriting\(productImage\);/;

const newCode = `const handleAIAnalysis = async () => {
        setIsGeneratingAI(true);
        try {
            // productFiles에서 이미지 가져오기
            const productFile = data.productFiles?.[0];
            if (!productFile) {
                alert('제품 이미지가 없습니다. 시작 화면에서 신발 이미지를 업로드해주세요.');
                return;
            }
            // File을 DataURL로 변환
            const productImage = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result);
                reader.onerror = reject;
                reader.readAsDataURL(productFile);
            });
            const aiCopy = await generateAICopywriting(productImage);`;

if (oldPattern.test(content)) {
    content = content.replace(oldPattern, newCode);
    fs.writeFileSync(path, content, 'utf8');
    console.log('SUCCESS: AI analysis function updated!');
} else {
    console.log('Pattern not found, trying simpler approach...');

    // Simpler replacement
    const simpleOld = "const productImage = data.imageUrls?.products?.[0];";
    const simpleNew = `// productFiles에서 이미지 가져오기
            const productFile = data.productFiles?.[0];
            if (!productFile) {
                alert('제품 이미지가 없습니다. 시작 화면에서 신발 이미지를 업로드해주세요.');
                return;
            }
            // File을 DataURL로 변환
            const productImage = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result);
                reader.onerror = reject;
                reader.readAsDataURL(productFile);
            });
            // REMOVED OLD CHECK`;

    // Also remove the old if block
    content = content.replace(simpleOld, simpleNew);
    content = content.replace(/if \(!productImage\) \{\s*alert\('제품 이미지가 없습니다\.'\);\s*return;\s*\}/g, '// (check moved above)');

    fs.writeFileSync(path, content, 'utf8');
    console.log('Applied simpler fix');
}
