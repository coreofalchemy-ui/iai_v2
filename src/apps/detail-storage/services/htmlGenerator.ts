/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const generateSimpleHTML = (imageUrls: string[]): string => {
    const imagesHtml = imageUrls.map((url, index) => `
        <div class="image-container">
            <img src="${url}" alt="Detail Image ${index + 1}" loading="lazy" />
        </div>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Detail Page</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            font-family: 'Noto Sans KR', sans-serif;
        }
        .container {
            max-width: 860px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .image-container {
            width: 100%;
            font-size: 0; /* Remove space between images */
        }
        img {
            width: 100%;
            height: auto;
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        ${imagesHtml}
    </div>
</body>
</html>
    `.trim();
};
