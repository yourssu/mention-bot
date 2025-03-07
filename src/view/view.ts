import { Member } from '@slack/web-api/dist/types/response/UsersListResponse';

import { slackApp } from '@/core/slack';

interface AddCustomGroupSubmissionMetadata {
  channel: string;
  user: string;
}

interface RenderAddCustomGroupSubmissionErrorEphemeralMessageProps
  extends AddCustomGroupSubmissionMetadata {
  errorMessage: string;
}

interface RenderAddCustomGroupSubmissionSuccessEphemeralMessageProps
  extends AddCustomGroupSubmissionMetadata {
  groupName: string;
  slackMembers: Member[];
}

interface RenderDeleteCustomGroupSubmissionErrorEphemeralMessageProps
  extends AddCustomGroupSubmissionMetadata {
  errorMessage: string;
}

interface RenderDeleteCustomGroupSubmissionSuccessEphemeralMessageProps
  extends AddCustomGroupSubmissionMetadata {
  groupName: string;
}

export const renderAddCustomGroupSubmissionErrorEphemeralMessage = async ({
  channel,
  user,
  errorMessage,
}: RenderAddCustomGroupSubmissionErrorEphemeralMessageProps) => {
  await slackApp.client.chat.postEphemeral({
    channel,
    user,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*❗️ 그룹 생성에 실패했어요*',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: errorMessage,
        },
      },
    ],
  });
};

export const renderAddCustomGroupSubmissionSuccessEphemeralMessage = async ({
  channel,
  groupName,
  slackMembers,
  user,
}: RenderAddCustomGroupSubmissionSuccessEphemeralMessageProps) => {
  await slackApp.client.chat.postEphemeral({
    channel,
    user,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*✅ 그룹 생성에 성공했어요*\n\n그룹명: *${groupName}*\n멤버: *${slackMembers.map((m) => m.name).join(', ')}*`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*\`@${groupName}\`* 을 메시지에 포함시켜서 멤버들을 멘션해보세요!`,
        },
      },
    ],
  });
};

export const renderDeleteCustomGroupSubmissionErrorEphemeralMessage = async ({
  channel,
  user,
  errorMessage,
}: RenderDeleteCustomGroupSubmissionErrorEphemeralMessageProps) => {
  await slackApp.client.chat.postEphemeral({
    channel,
    user,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*❗️ 그룹 제거에 실패했어요*',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: errorMessage,
        },
      },
    ],
  });
};

export const renderDeleteCustomGroupSubmissionSuccessEphemeralMessage = async ({
  channel,
  groupName,
  user,
}: RenderDeleteCustomGroupSubmissionSuccessEphemeralMessageProps) => {
  await slackApp.client.chat.postEphemeral({
    channel,
    user,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*✅ 그룹 제거에 성공했어요*\n\n그룹명: *\`${groupName}\`*`,
        },
      },
    ],
  });
};
