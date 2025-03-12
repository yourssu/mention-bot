import { Member } from '@slack/web-api/dist/types/response/UsersListResponse';

import { popPayload, putPayload } from '@/cache/payload';
import { config } from '@/config';
import { AuthURIPayload } from '@/types/auth';
import { SlackMessageEvent } from '@/types/slack';

// 페이로드 삭제 시간: 4분
const PAYLOAD_TIMEOUT_MS = 1000 * 60 * 4;

export const toSlackMemberMentionString = (member: Member) => {
  return `<@${member.id}>`;
};

export const getSlackCallbackUrl = (payload: AuthURIPayload) => {
  const payloadKey = putPayload(payload);
  const uriPayload = encodeURIComponent(payloadKey);
  // PAYLOAD_TIMEOUT_MS가 지나면 캐시된 페이로드 삭제
  setTimeout(() => popPayload(payloadKey), PAYLOAD_TIMEOUT_MS);
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
