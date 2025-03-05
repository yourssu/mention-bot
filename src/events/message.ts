import { editMessageAsMentionString } from '@/apis/message';
import { userTokens } from '@/cache/token';
import { slackApp } from '@/core/slack';
import { SlackMessageEvent } from '@/types/slack';
import { renderAuthEphemeralMessage } from '@/view/auth';

export const handleGroupKeywordMessage = async ({ message, context }: SlackMessageEvent) => {
  const userToken = userTokens.get(message.user);

  if (!userToken) {
    await renderAuthEphemeralMessage({ message, mentionGroups: context.matches });
    return;
  }

  try {
    const res = await slackApp.client.auth.test({ token: userToken });
    if (!res.ok) {
      await renderAuthEphemeralMessage({ message, mentionGroups: context.matches });
      return;
    }

    await editMessageAsMentionString({ message, token: userToken, mentionGroups: context.matches });
  } catch (error) {
    console.error(error);
  }
};
