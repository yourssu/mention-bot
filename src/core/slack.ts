import { App as SlackApp } from '@slack/bolt';
import { LogLevel, WebClient } from '@slack/web-api';

import { config } from '@/config';
import { handleAuthButtonAction } from '@/events/action';
import { handleListCommand } from '@/events/command';
import { handleGroupKeywordMessage } from '@/events/message';
import { authRoute } from '@/routes/auth';
import { allMemberGroupName } from '@/types/group';
import { BaseSlackMessageMiddleware } from '@/types/slack';

export const slackClient = new WebClient(import.meta.env.VITE_BOT_USER_OAUTH_TOKEN, {
  logLevel: LogLevel.WARN,
});

export const slackApp = new SlackApp({
  signingSecret: import.meta.env.VITE_SLACK_SIGNING_SECRET,
  token: import.meta.env.VITE_BOT_USER_OAUTH_TOKEN,
  socketMode: true,
  appToken: import.meta.env.VITE_SLACK_SOCKET_APP_TOKEN,
  customRoutes: [
    {
      path: config.routes.auth,
      method: 'get',
      handler: authRoute,
    },
  ],
});

slackApp.message(
  new RegExp(allMemberGroupName.map((k) => `${k}`).join('|'), 'g'),
  handleGroupKeywordMessage as BaseSlackMessageMiddleware
);

slackApp.action('auth', handleAuthButtonAction);

slackApp.command('/list', handleListCommand);
