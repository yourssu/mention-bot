import { userTokens } from '@/cache/token';
import { slackApp } from '@/core/slack';
import { AuthURIPayload } from '@/types/auth';
import { SlackMessageEvent } from '@/types/slack';
import { addEventListenerOnce, triggerExactEventListenerOnce } from '@/utils/event';
import { getSlackMessageEventObject } from '@/utils/slack';
import { renderAuthEphemeralMessage } from '@/view/auth';

export const getUserTokenByMessage = async (originMessage: SlackMessageEvent['message']) => {
  let resolveFn: ((token: PromiseLike<string> | string) => void) | undefined = undefined;
  const promise = new Promise<string>((resolve) => {
    resolveFn = resolve;
  });

  const message = getSlackMessageEventObject(originMessage);
  const userToken = userTokens.get(message.user);
  const eventId = addEventListenerOnce('authorized', ({ token }) => {
    resolveFn?.(token);
  });
  const payload: AuthURIPayload = {
    eventId,
    message: {
      channel: message.channel,
      team: message.team,
    },
    user: message.user,
  };

  if (!userToken) {
    await renderAuthEphemeralMessage({ message, payload });
    return promise;
  }

  const res = await slackApp.client.auth.test({ token: userToken });
  if (!res.ok) {
    await renderAuthEphemeralMessage({ message, payload });
    return promise;
  }

  triggerExactEventListenerOnce('authorized', eventId, { token: userToken });

  return promise;
};
