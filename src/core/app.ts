import { App as SlackApp } from '@slack/bolt';

import { handleGroupKeywordMessage } from '@/events/message';
import { slackAuthCallback } from '@/routes/auth';
import { BaseSlackMessageMiddleware } from '@/types/slack';

export const App = new SlackApp({
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

App.message('@fe', handleGroupKeywordMessage as BaseSlackMessageMiddleware);

App.action('auth', async ({ ack, respond }) => {
  await ack();
  await respond({ response_type: 'ephemeral', delete_original: true, replace_original: true });
});
