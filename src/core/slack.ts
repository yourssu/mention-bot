import { App as SlackApp } from '@slack/bolt';
import { LogLevel, WebClient } from '@slack/web-api';
import { objectValues } from '@toss/utils';

import { handleGroupKeywordMessage } from '@/events/message';
import { slackAuthCallback } from '@/routes/auth';
import {
  AllMemberGroupNameType,
  BaseMemberGroupKRNameMap,
  BaseMemberGroupNameType,
  MemberGroupNameMap,
  allGroupMembersSuffix,
  allMemberGroupName,
  nonActiveGroupMembersSuffix,
} from '@/types/member';
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

slackApp.command('/list', async ({ ack, client, command }) => {
  const makeDescription = (groupKRName: string, groupName: AllMemberGroupNameType) => {
    if (groupName.includes(allGroupMembersSuffix)) {
      return `모든 ${groupKRName}팀을 멤버들을 멘션해요.`;
    }

    if (groupName.includes(nonActiveGroupMembersSuffix)) {
      return `${groupKRName}팀의 비액티브 멤버들을 멘션해요.`;
    }

    return `${groupKRName}팀의 액티브 멤버들을 멘션해요.`;
  };

  const makeBlock = (data: { description: string; title: string }[]) => ({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: data.map(({ title, description }) => ` - *\`${title}\`* : ${description}`).join('\n'),
    },
  });

  const makeSection = (baseGroupName: BaseMemberGroupNameType) => [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${BaseMemberGroupKRNameMap[baseGroupName]}* 팀`,
      },
    },
    makeBlock(
      allMemberGroupName
        .filter((name) => name.includes(baseGroupName))
        .map((name) => ({
          title: name,
          description: makeDescription(BaseMemberGroupKRNameMap[baseGroupName], name),
        }))
    ),
    {
      type: 'divider',
    },
  ];

  await ack();
  await client.chat.postEphemeral({
    channel: command.channel_id,
    user: command.user_id,
    blocks: objectValues(MemberGroupNameMap).flatMap((name) => makeSection(name)),
  });
});
