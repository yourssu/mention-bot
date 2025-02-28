/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BOT_USER_OAUTH_TOKEN: string;
  readonly VITE_SLACK_APP_ID: string;
  readonly VITE_SLACK_CLIENT_ID: string;
  readonly VITE_SLACK_CLIENT_SECRET: string;
  readonly VITE_SLACK_SIGNING_SECRET: string;
  readonly VITE_SLACK_SOCKET_APP_TOKEN: string;
  readonly VITE_SLACK_VERIFICATION_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
