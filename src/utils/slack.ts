import { Member } from '@slack/web-api/dist/types/response/UsersListResponse';

import { config } from '@/config';
import { AuthURIPayload } from '@/types/auth';

export const toSlackMemberMentionString = (member: Member) => {
  return `<@${member.id}>`;
};

export const getSlackCallbackUrl = (payload: AuthURIPayload) => {
  const uriPayload = encodeURIComponent(JSON.stringify(payload));
  return `${config.url}${config.routes.auth}?payload=${uriPayload}`;
};
