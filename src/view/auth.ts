import { slackApp } from '@/core/slack';
import { AllMemberGroupNameType } from '@/types/group';
import { SlackMessageEvent } from '@/types/slack';
import { getSlackCallbackUrl } from '@/utils/slack';

interface RenderAuthEphemeralMessageProps {
  mentionGroups: AllMemberGroupNameType[];
  message: SlackMessageEvent['message'];
}

export const renderAuthEphemeralMessage = async ({
  mentionGroups,
  message,
}: RenderAuthEphemeralMessageProps) => {
  const redirectUri = encodeURIComponent(getSlackCallbackUrl({ message, mentionGroups }));
  const scopes = encodeURIComponent('chat:write,users:read,users.profile:read');

  await slackApp.client.chat.postEphemeral({
    channel: message.channel,
    user: message.user,
    thread_ts: message.thread_ts,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '멘션봇이 메시지를 편집하기 위해서 사용자 인증이 필요해요.',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '인증하기' },
            action_id: 'auth',
            style: 'primary',
            url: `https://slack.com/oauth/v2/authorize?client_id=${import.meta.env.VITE_SLACK_CLIENT_ID}&user_scope=${scopes}&redirect_uri=${redirectUri}`,
          },
        ],
      },
    ],
  });
};
