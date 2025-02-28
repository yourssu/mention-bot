import { Member } from '@slack/web-api/dist/types/response/UsersListResponse';

export const membersCacheDuration = 5; // 단위는 분이에요.

export const membersCache: { expireAt: number | undefined; members: Member[] } = {
  expireAt: undefined,
  members: [],
};
