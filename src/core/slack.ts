import { App as SlackApp } from '@slack/bolt';
import { LogLevel, WebClient } from '@slack/web-api';

import { getAllCustomGroupNames } from '@/apis/group';
import { config } from '@/config';
import { handleAuthButtonAction } from '@/events/action';
import {
  handleAddComand,
  handleCustomListCommand,
  handleDeleteCommand,
  handleListCommand,
} from '@/events/command';
import { handleGroupKeywordMessage } from '@/events/message';
import {
  handleAddCustomGroupModalSubmission,
  handleDeleteCustomGroupModalSubmission,
} from '@/events/view';
import { authRoute } from '@/routes/auth';
import { allMemberGroupName } from '@/types/group';
import { BaseSlackMessageMiddleware, SlackMessageEvent } from '@/types/slack';
import { getSlackMessageEventObject } from '@/utils/slack';

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

/* 
  동적으로 변경되는 커스텀 그룹을 필터링하기 위해 모든 메시지를 받고,
  미들웨어를 통해 커스텀 그룹 키워드가 포함된 메시지를 직접 처리해요.
*/
slackApp.message(async ({ message: slackMessage, next, context }) => {
  const message = getSlackMessageEventObject(slackMessage as SlackMessageEvent['message']);
  const text = (message as SlackMessageEvent['message']).text;

  const allGroupNames = [...getAllCustomGroupNames(), ...allMemberGroupName].sort((a, b) => {
    if (a.includes(b)) {
      return -1;
    }
    if (b.includes(a)) {
      return 1;
    }
    return 0;
  });
  const groupRegex = new RegExp(allGroupNames.join('|'), 'g');
  const matches = text.match(groupRegex);

  if (!!matches?.length) {
    context.matches = matches; // 매칭한 그룹 키워드를 컨텍스트에 저장해서 다음 미들웨어에서 사용해요.
    await next();
  }
}, handleGroupKeywordMessage as BaseSlackMessageMiddleware);

slackApp.action('auth', handleAuthButtonAction);

slackApp.command('/list', handleListCommand);

slackApp.command('/add', handleAddComand);

slackApp.command('/delete', handleDeleteCommand);

slackApp.command('/list-custom', handleCustomListCommand);

slackApp.view('addCustomGroup', handleAddCustomGroupModalSubmission);

slackApp.view('deleteCustomGroup', handleDeleteCustomGroupModalSubmission);
