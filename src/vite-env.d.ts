/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY?: string
  readonly VITE_STORAGE_MODE?: 'local' | 'supabase' | 'hybrid'
  readonly VITE_ENABLE_AUTH?: string
  readonly VITE_ENABLE_STORAGE?: string
  readonly VITE_ENABLE_REALTIME?: string
  readonly VITE_ENABLE_ANALYTICS?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_STORAGE_KEY?: string
  readonly VITE_NODE_ENV?: 'development' | 'production'
  readonly VITE_API_URL?: string
  readonly VITE_ANALYTICS_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
