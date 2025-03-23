import { getSlackCallbackUrl } from '@/apis/auth';
import { slackApp } from '@/core/slack';
import { AuthURIPayload } from '@/types/auth';
import { SlackMessageEvent } from '@/types/slack';

interface RenderAuthEphemeralMessageProps {
  message: SlackMessageEvent['message'];
  payload: AuthURIPayload;
}

export const renderAuthEphemeralMessage = async ({
  message,
  payload,
}: RenderAuthEphemeralMessageProps) => {
  const redirectUri = encodeURIComponent(getSlackCallbackUrl(payload));
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
          text: '인증이 필요해요. 하단의 버튼을 눌러 멘션봇에게 누군지 알려주세요.',
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
