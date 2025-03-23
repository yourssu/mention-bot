import { ParamsIncomingMessage } from '@slack/bolt/dist/receivers/ParamsIncomingMessage';
import { IncomingMessage, ServerResponse } from 'http';

import { getUserAccessTokenByOAuth } from '@/apis/auth';
import { userTokens } from '@/cache/token';
import { AuthURIPayload } from '@/types/auth';
import { triggerExactEventListenerOnce } from '@/utils/event';

const throw400 = (message: string, res: ServerResponse<IncomingMessage>) => {
  res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(message);
};

const assertAuthRouteUri = (req: ParamsIncomingMessage, res: ServerResponse<IncomingMessage>) => {
  const params = new URL(`http://${req.headers.host}${req.url}`).searchParams;
  const code = params.get('code');
  const payload = params.get('payload');

  if (!code) {
    throw400('잘못된 파라미터입니다.', res);
    return undefined;
  }

  if (!payload) {
    throw400('잘못된 payload입니다.', res);
    return undefined;
  }

  return { code, payload: JSON.parse(payload) as AuthURIPayload };
};

export const authRoute = async (
  req: ParamsIncomingMessage,
  res: ServerResponse<IncomingMessage>
) => {
  if (!req.url || !req.headers.host) {
    throw400('잘못된 요청입니다.', res);
    return;
  }

  const uri = assertAuthRouteUri(req, res);
  if (!uri) {
    return;
  }
  const { code, payload } = uri;

  const token = await getUserAccessTokenByOAuth({ code, payload });
  if (!token) {
    throw400('토큰 발급에 실패했습니다.', res);
    return;
  }
  userTokens.set(payload.user, token);

  triggerExactEventListenerOnce('authorized', payload.eventId, { token });

  res.writeHead(302, {
    location: `slack://channel?team=${payload.message.team}&id=${payload.message.channel}`,
  });
  res.end();
};
