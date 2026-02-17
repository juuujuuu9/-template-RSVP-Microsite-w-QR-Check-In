/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly DATABASE_URL: string;
  readonly RESEND_API_KEY: string;
  readonly FROM_EMAIL: string;
  readonly ADMIN_PASSWORD: string;
  readonly ADMIN_SESSION_SECRET: string;
  readonly HUB_URL?: string;
  readonly HUB_WEBHOOK_KEY?: string;
  readonly HUB_EVENT_SLUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
