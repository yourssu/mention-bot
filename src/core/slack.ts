import { App as SlackApp } from '@slack/bolt';
import { LogLevel, WebClient } from '@slack/web-api';

import { config, stage } from '@/config';
import { handleAuthButtonAction } from '@/events/action';
import {
  handleAddComand,
  handleCustomListCommand,
  handleDeleteCommand,
  handleListCommand,
} from '@/events/command';
import {
  detectGroupKeywordMessage,
  handleArchiveMessage,
  handleGroupKeywordMessage,
} from '@/events/message';
import {
  handleAddCustomGroupModalSubmission,
  handleDeleteCustomGroupModalSubmission,
} from '@/events/view';
import { authRoute } from '@/routes/auth';
import { BaseSlackMessageMiddleware, SlackMessageEvent } from '@/types/slack';

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

slackApp.message(new RegExp(/^!아카이브$/), handleArchiveMessage as BaseSlackMessageMiddleware);
slackApp.message(new RegExp(/^!조용히아카이브$/), (props) =>
  handleArchiveMessage({ ...(props as SlackMessageEvent), silent: true })
);
slackApp.message(new RegExp(/^!강제아카이브$/), async (props) => {
  if (stage === 'production') {
    return;
  }

  const forceArchiveTarget = {
    ts: '',
    channel: '',
    thread_ts: '',
  };

  const newProps = {
    ...props,
    message: { ...props.message, ...forceArchiveTarget },
  } as SlackMessageEvent;
  handleArchiveMessage({ ...newProps, silent: true });
});

slackApp.action('auth', handleAuthButtonAction);

slackApp.command('/list', handleListCommand);

slackApp.command('/add', handleAddComand);

slackApp.command('/delete', handleDeleteCommand);

slackApp.command('/list-custom', handleCustomListCommand);

slackApp.view('addCustomGroup', handleAddCustomGroupModalSubmission);

slackApp.view('deleteCustomGroup', handleDeleteCustomGroupModalSubmission);
