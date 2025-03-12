import { App as SlackApp } from '@slack/bolt';
import { LogLevel, WebClient } from '@slack/web-api';

import { config } from '@/config';
import { handleAuthButtonAction } from '@/events/action';
import {
  handleAddComand,
  handleCustomListCommand,
  handleDeleteCommand,
  handleListCommand,
} from '@/events/command';
import { detectGroupKeywordMessage, handleGroupKeywordMessage } from '@/events/message';
import {
  handleAddCustomGroupModalSubmission,
  handleDeleteCustomGroupModalSubmission,
} from '@/events/view';
import { authRoute } from '@/routes/auth';
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
  /* 
    customRoutes에서 설정한 OAuth redirect 서버 수신을 위해 여기서도 포트를 설정해요.
    참고: https://github.com/slackapi/bolt-js/issues/1200
  */
  port: config.port,
});

slackApp.message(
  detectGroupKeywordMessage as BaseSlackMessageMiddleware,
  handleGroupKeywordMessage as BaseSlackMessageMiddleware
);

slackApp.action('auth', handleAuthButtonAction);

slackApp.command('/list', handleListCommand);

slackApp.command('/add', handleAddComand);

slackApp.command('/delete', handleDeleteCommand);

slackApp.command('/list-custom', handleCustomListCommand);

slackApp.view('addCustomGroup', handleAddCustomGroupModalSubmission);

slackApp.view('deleteCustomGroup', handleDeleteCustomGroupModalSubmission);
