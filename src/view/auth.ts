import { App } from '@/core/app';
import { SlackMessageEvent } from '@/types/slack';
import { makeSlackCallbackUri } from '@/utils/uri';

export const renderAuthEphemeralMessage = async (message: SlackMessageEvent['message']) => {
  const redirectUri = encodeURIComponent(makeSlackCallbackUri(message));
  const scopes = encodeURIComponent('chat:write,users:read,users.profile:read');

  try {
    await App.client.chat.postEphemeral({
      channel: message.channel,
      user: message.user,
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
  } catch (error) {
    console.error(error);
  }
};
