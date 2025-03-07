import { App as SlackApp } from '@slack/bolt';
import { LogLevel, WebClient } from '@slack/web-api';

import { config } from '@/config';
import { handleAuthButtonAction } from '@/events/action';
import { handleAddComand, handleListCommand } from '@/events/command';
import { handleGroupKeywordMessage } from '@/events/message';
import { authRoute } from '@/routes/auth';
import { allMemberGroupName } from '@/types/group';
import { BaseSlackMessageMiddleware } from '@/types/slack';
import { assertNonNullishSoftly } from '@/utils/assertion';
import { querySlackMembersBySlackId } from '@/utils/member';
import {
  renderAddCustomGroupSubmissionErrorEphemeralMessage,
  renderAddCustomGroupSubmissionSuccessEphemeralMessage,
} from '@/view/view';

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

slackApp.command('/add', handleAddComand);

slackApp.view('addMentionGroup', async ({ ack, view }) => {
  const validateForm = () => {
    if (!groupName) {
      return {
        success: false,
        message: '그룹 이름을 입력해주세요.',
      };
    }

    if (!members?.length) {
      return {
        success: false,
        message: '그룹에 들어갈 멤버를 선택해주세요.',
      };
    }

    return {
      success: true,
      message: undefined,
    };
  };

  await ack();

  const groupName = view.state.values.writeGroupName_block.writeGroupName_input.value;
  const members = view.state.values.selectMember_block.selectMember_accessory.selected_users;
  const metadata: {
    channel: string;
    user: string;
  } = JSON.parse(view.private_metadata);

  const { success, message } = validateForm();

  if (!success) {
    await renderAddCustomGroupSubmissionErrorEphemeralMessage({
      channel: metadata.channel,
      user: metadata.user,
      errorMessage: message ?? '',
    });
    return;
  }

  assertNonNullishSoftly(members);
  assertNonNullishSoftly(groupName);

  const slackMembers = await querySlackMembersBySlackId(members);
  await renderAddCustomGroupSubmissionSuccessEphemeralMessage({
    channel: metadata.channel,
    user: metadata.user,
    groupName,
    slackMembers,
  });
});
