import { addMinutes } from 'date-fns';

import { membersCache, membersCacheDuration } from '@/cache/member';
import { client } from '@/core/client';

export const getAllMembers = async () => {
  const requestMembers = async () => {
    const response = await client.users.list({});
    return response.members ?? [];
  };

  const recacheMembers = async () => {
    const members = await requestMembers();
    membersCache.expireAt = addMinutes(now, membersCacheDuration).getTime();
    membersCache.members = members;
    return members;
  };

  const now = new Date();
  const memberNotSetted = !membersCache.expireAt;
  const memberExpired = membersCache.expireAt && now.getTime() > membersCache.expireAt;

  if (memberNotSetted || memberExpired) {
    return recacheMembers();
  }

  return membersCache.members;
};
