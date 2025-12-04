/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Space Grotesk', 'Inter', 'sans-serif'],
            },
            colors: {
                primary: {
                    DEFAULT: '#000000',
                    hover: '#333333',
                },
                accent: {
                    DEFAULT: '#0066FF',
                    hover: '#0052CC',
                },
                surface: '#FFFFFF',
                muted: '#666666',
            },
            spacing: {
                '18': '4.5rem',
                '22': '5.5rem',
            },
            borderRadius: {
                '4xl': '2rem',
            },
        },
    },
    plugins: [],
}
