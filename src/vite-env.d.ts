/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY: string
    readonly VITE_API_URL: string
    // add more env variables here as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
