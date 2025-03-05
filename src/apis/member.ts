import { notionMembersCache, slackMembersCache } from '@/cache/member';
import { notionClient } from '@/core/notion';
import { slackClient } from '@/core/slack';
import { NotionMember } from '@/types/member';
import { cacheWithRequest } from '@/utils/cache';

export const getAllSlackMembers = async () => {
  const requestMembers = async () => {
    const { members } = await slackClient.users.list({});
    return (
      members?.filter(({ is_bot: isBot }) => {
        return !isBot;
      }) ?? []
    );
  };

  return await cacheWithRequest(requestMembers, slackMembersCache);
};

export const getAllNotionMembers = async () => {
  const normalizeMemberName = (name: string) => {
    return name
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .trim()
      .toLowerCase();
  };

  const getMemberName = (rawMember: any) => {
    const baseName = rawMember.properties.이름.title[0].plain_text;
    const normalizedBaseName = baseName.trim().toLowerCase();

    if (normalizedBaseName === 'name') {
      if (!rawMember.properties.MEMBER.people[0]?.name) {
        return '';
      }
      return normalizeMemberName(rawMember.properties.MEMBER.people[0].name);
    }
    return normalizedBaseName;
  };

  const transformToMember = (rawMember: any): NotionMember => ({
    name: getMemberName(rawMember),
    position: rawMember.properties.POSITION.multi_select.map((position: any) => position.name),
    status: rawMember.properties.STATUS.select.name,
    realName: rawMember.properties.NAME.rich_text[0]?.text.content,
  });

  const getRequestedMembers = async () => {
    const fetchedMembers = [];
    let savedNextCursor: string | undefined = undefined;

    while (true) {
      const {
        results,
        has_more: hasMore,
        next_cursor: nextCursor,
      } = await notionClient.databases.query({
        database_id: import.meta.env.VITE_NOTION_MEMBER_DATABASE_ID,
        start_cursor: savedNextCursor,
      });

      fetchedMembers.push(...results);
      savedNextCursor = nextCursor ?? undefined;

      if (!hasMore) {
        break;
      }
    }

    return fetchedMembers;
  };

  const getAllMembers = async () => {
    return (await getRequestedMembers()).map(transformToMember).filter((member) => !!member.name);
  };

  return await cacheWithRequest(getAllMembers, notionMembersCache);
};
