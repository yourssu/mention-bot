import { editMessageAsMentionString } from '@/apis/message';
import { userTokens } from '@/cache/token';
import { slackApp } from '@/core/slack';
import { SlackMessageEvent } from '@/types/slack';
import { getSlackMessageEventObject } from '@/utils/slack';
import { renderAuthEphemeralMessage } from '@/view/auth';

export const handleGroupKeywordMessage = async ({
  message: slackMessage,
  context,
}: SlackMessageEvent) => {
  const message = getSlackMessageEventObject(slackMessage);
  const userToken = userTokens.get(message.user);

  if (!userToken) {
    await renderAuthEphemeralMessage({ message, mentionGroups: context.matches });
    return;
  }

  const res = await slackApp.client.auth.test({ token: userToken });
  if (!res.ok) {
    await renderAuthEphemeralMessage({ message, mentionGroups: context.matches });
    return;
  }

  await editMessageAsMentionString({ message, token: userToken, mentionGroups: context.matches });
};
