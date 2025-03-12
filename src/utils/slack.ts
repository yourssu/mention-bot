import { Member } from '@slack/web-api/dist/types/response/UsersListResponse';

import { putPayload, setPayloadTimeout } from '@/cache/payload';
import { config } from '@/config';
import { AuthURIPayload } from '@/types/auth';
import { SlackMessageEvent } from '@/types/slack';

export const toSlackMemberMentionString = (member: Member) => {
  return `<@${member.id}>`;
};

export const getSlackCallbackUrl = (payload: AuthURIPayload) => {
  const payloadKey = putPayload(payload);
  const uriPayload = encodeURIComponent(payloadKey);

  setPayloadTimeout(payloadKey);

  return `${config.url}${config.routes.auth}?payload=${uriPayload}`;
};

/* 
  메시지 생성 / 변경 이벤트에 상관없이 일관된 메시지 이벤트 데이터를 반환해요.
*/
export const getSlackMessageEventObject = (message: SlackMessageEvent['message']) => {
  return message.subtype === 'message_changed'
    ? (message.message as SlackMessageEvent['message'])
    : message;
};
