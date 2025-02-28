import { LogLevel, WebClient } from '@slack/web-api';

export const client = new WebClient(import.meta.env.VITE_BOT_USER_OAUTH_TOKEN, {
  logLevel: LogLevel.WARN,
});
