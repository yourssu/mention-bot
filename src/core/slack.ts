import { App as SlackApp } from '@slack/bolt';
import { LogLevel, WebClient } from '@slack/web-api';

import { archiveClient } from '@/apis/client';
import { ensureSlackEmojiSetCache } from '@/cache/emoji';
import { ensureSlackMembersCache } from '@/cache/member';
import { config, stage } from '@/config';
import { handleAuthButtonAction } from '@/events/action';
import { getUserTokenByMessage } from '@/events/auth';
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
import { getSlackMessageEventObject, md } from '@/utils/slack';

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
slackApp.message(new RegExp(/^!아카이브갱신$/), async (props) => {
  const getAllArchivedChannelThreadTsRecord = async () => {
    const channelIds = (await archiveClient.get<{ id: string }[]>('channels').json()).map(
      (v) => v.id
    );
    return (
      await Promise.all(
        channelIds.map(async (id) => {
          const tss = (await archiveClient.get<{ ts: string }[]>(`${id}/threads`).json()).map(
            (v) => v.ts
          );
          return tss.map((ts) => ({ channel: id, thread_ts: ts }));
        })
      )
    ).flat();
  };

  if (stage === 'production') {
    return;
  }

  const message = getSlackMessageEventObject(props.message as SlackMessageEvent['message']);

  await getUserTokenByMessage(message);

  // 아카이빙할 대상들이에요. (현재 아카이빙된 모든 녀석들)
  const forceArchiveTargets = await getAllArchivedChannelThreadTsRecord();
  await props.say({
    text: [
      md.inlineEmoji('loading'),
      md.bold(`총 ${forceArchiveTargets.length}개의 아카이빙된 스레드를 갱신해요.`),
    ].join(' '),
    thread_ts: message.thread_ts,
    channel: message.channel,
  });

  // 아카이빙 메시지를 어디로 보낼지 결정해요.
  const sendTarget = {
    channel: message.channel,
    thread_ts: message.thread_ts ?? '',
    user: message.user,
  };

  await ensureSlackEmojiSetCache();
  await ensureSlackMembersCache();

  await Promise.all(
    forceArchiveTargets.map(async (target) => {
      const newProps = {
        ...props,
        message: { ...message, ...target },
      } as SlackMessageEvent;

      await handleArchiveMessage({ ...newProps, forceSendTarget: sendTarget });
    })
  );

  await props.say({
    text: [md.inlineEmoji('white_check_mark'), md.bold('갱신이 완료됐어요!')].join(' '),
    thread_ts: message.thread_ts,
    channel: message.channel,
  });
});

slackApp.action('auth', handleAuthButtonAction);

slackApp.command('/list', handleListCommand);

slackApp.command('/add', handleAddComand);

slackApp.command('/delete', handleDeleteCommand);

slackApp.command('/list-custom', handleCustomListCommand);

slackApp.view('addCustomGroup', handleAddCustomGroupModalSubmission);

slackApp.view('deleteCustomGroup', handleDeleteCustomGroupModalSubmission);
