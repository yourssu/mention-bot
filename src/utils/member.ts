import { Member } from '@slack/web-api/dist/types/response/UsersListResponse';

import { getAllNotionMembers, getAllSlackMembers } from '@/apis/member';
import { customGroups } from '@/cache/group';
import { AllMemberGroupNameType } from '@/types/group';
import { NotionMember, NotionMemberPosition, NotionMemberStatusType } from '@/types/member';
import { LiteralStringUnion } from '@/types/misc';
import { isNonCustomGroup, parseMentionGroupToNotionMembersQuery } from '@/utils/group';

export type QueryNotionMembersProps = {
  position?: NotionMemberPosition;
  status?: NotionMemberStatusType[];
};

export const queryNotionMembers = async ({ position, status }: QueryNotionMembersProps) => {
  const filterByPosition = (ms: NotionMember[]) => {
    return ms.filter((member) => {
      return position ? member.position.includes(position) : true;
    });
  };

  const filterByStatus = (ms: NotionMember[]) => {
    return ms.filter((member) => {
      return status ? status.includes(member.status) : true;
    });
  };

  const members = await getAllNotionMembers();
  return filterByStatus(filterByPosition(members));
};

export const querySlackMembersByMentionGroup = async (
  group: LiteralStringUnion<AllMemberGroupNameType>
) => {
  if (isNonCustomGroup(group)) {
    const query = parseMentionGroupToNotionMembersQuery(group);
    const notionMembers = await queryNotionMembers(query);
    const slackMembers = (
      await Promise.all(
        notionMembers.map((member) => {
          return querySlackMemberByName(member.name);
        })
      )
    ).filter(Boolean) as Member[];

    return slackMembers;
  }

  const allSlackMembers = await getAllSlackMembers();
  const customGroup = customGroups.get(group);

  const slackMembers = (customGroup?.memberSlackIds ?? [])
    .map((slackId) => {
      return allSlackMembers.find((member) => member.id === slackId);
    })
    .filter(Boolean) as Member[];

  return slackMembers;
};

export const querySlackMemberByName = async (name: string) => {
  const normalizeName = (name: string) => {
    return name.toLowerCase().replace(/\s/g, '').replace('.urssu', '');
  };

  const searchFromAllSlackMembers = async () => {
    const members = await getAllSlackMembers();
    return members.filter((slackMember) => {
      if (!slackMember.name) {
        return false;
      }
      return normalizeName(slackMember.name).includes(name);
    });
  };

  const matches = await searchFromAllSlackMembers();

  if (matches.length <= 1) {
    return matches[0];
  }

  const similarMatches = [...matches].sort((a, b) => {
    const compareA = normalizeName(a.name!).length - normalizeName(name).length;
    const compareB = normalizeName(b.name!).length - normalizeName(name).length;
    return compareA - compareB;
  });

  return similarMatches[0];
};

export const querySlackMembersBySlackId = async (slackIds: string[]) => {
  const slackMembers = await getAllSlackMembers();
  return slackMembers.filter((member) => member.id && slackIds.includes(member.id));
};
