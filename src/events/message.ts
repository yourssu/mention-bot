import { editMessageAsMentionString } from '@/apis/message';
import { userTokens } from '@/cache/token';
import { App } from '@/core/app';
import { SlackMessageEvent } from '@/types/slack';
import { renderAuthEphemeralMessage } from '@/view/auth';

export const handleGroupKeywordMessage = async ({ message }: SlackMessageEvent) => {
  const userToken = userTokens.get(message.user);

  if (!userToken) {
    await renderAuthEphemeralMessage(message);
    return;
  }

  try {
    const res = await App.client.auth.test({ token: userToken });
    if (!res.ok) {
      await renderAuthEphemeralMessage(message);
      return;
    }

    await editMessageAsMentionString(message, userToken);
  } catch (error) {
    console.error(error);
  }
};
