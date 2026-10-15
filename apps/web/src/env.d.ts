/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Public base URL of the chat API (`apps/api`). */
  readonly PUBLIC_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
