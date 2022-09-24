/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRPC_URL: string
  readonly VITE_WS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}