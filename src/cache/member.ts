import { Member as SlackMember } from '@slack/web-api/dist/types/response/UsersListResponse';

import { BaseCache } from '@/types/cache';
import { NotionMember } from '@/types/member';

export const slackMembersCache: BaseCache<SlackMember[]> = {
  expireAt: undefined,
  data: [],
  duration: 5 * 60 * 1000, // 5분
};

export const notionMembersCache: BaseCache<NotionMember[]> = {
  expireAt: undefined,
  data: [],
  duration: 5 * 60 * 1000, // 5분
};
