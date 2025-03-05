import { ParamsIncomingMessage } from '@slack/bolt/dist/receivers/ParamsIncomingMessage';
import { IncomingMessage, ServerResponse } from 'http';

import { editMessageAsMentionString } from '@/apis/message';
import { userTokens } from '@/cache/token';
import { slackApp } from '@/core/slack';
import { AuthURIPayload } from '@/types/auth';
import { makeSlackCallbackUri } from '@/utils/uri';

export const slackAuthCallback = async (
  req: ParamsIncomingMessage,
  res: ServerResponse<IncomingMessage>
) => {
  if (!req.url || !req.headers.host) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('잘못된 요청입니다.');
    return;
  }

  const params = new URL(`${req.headers.host}/${req.url}`).searchParams;
  const code = params.get('code');

  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('잘못된 파라미터입니다.');
    return;
  }

  const rawPayload = params.get('payload');
  if (!rawPayload) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('잘못된 payload입니다.');
    return;
  }

  const payload: AuthURIPayload = JSON.parse(decodeURIComponent(rawPayload));
  const redirectUri = makeSlackCallbackUri(payload);

  const r = await slackApp.client.oauth.v2.access({
    client_id: import.meta.env.VITE_SLACK_CLIENT_ID,
    client_secret: import.meta.env.VITE_SLACK_CLIENT_SECRET,
    code,
    redirect_uri: redirectUri,
  });

  const token = r.authed_user?.access_token;
  if (!token) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('토큰 발급에 실패했습니다.');
    return;
  }
  userTokens.set(payload.message.user, token);

  await editMessageAsMentionString({
    message: payload.message,
    token,
    mentionGroups: payload.mentionGroups,
  });

  res.writeHead(302, {
    location: `slack://channel?team=${payload.message.team}&id=${payload.message.channel}`,
  });
  res.end();
};
