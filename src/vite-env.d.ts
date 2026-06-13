/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PLATFORM: 'mobile' | 'desktop'
  readonly VITE_APP_MODE: 'web' | 'desktop' | 'mobile'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}