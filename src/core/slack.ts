import { App as SlackApp } from '@slack/bolt';
import { LogLevel, WebClient } from '@slack/web-api';

import { handleGroupKeywordMessage } from '@/events/message';
import { slackAuthCallback } from '@/routes/auth';
import { allMemberGroupName } from '@/types/member';
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
      path: '/auth/slack/callback',
      method: 'get',
      handler: slackAuthCallback,
    },
  ],
});

slackApp.message(
  new RegExp(allMemberGroupName.map((k) => `${k}`).join('|'), 'g'),
  handleGroupKeywordMessage as BaseSlackMessageMiddleware
);

slackApp.action('auth', async ({ ack, respond }) => {
  await ack();
  await respond({ response_type: 'ephemeral', delete_original: true, replace_original: true });
});
