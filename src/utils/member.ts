import { getAllNotionMembers, getAllSlackMembers } from '@/apis/member';
import { NotionMember, NotionMemberPosition, NotionMemberStatusType } from '@/types/member';

interface QueryNotionMembersProps {
  position?: NotionMemberPosition;
  status?: NotionMemberStatusType[];
}

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

export const findSlackMemberByNotionMember = async (notionMember: NotionMember) => {
  const normalizeName = (name: string) => {
    return name.toLowerCase().replace(/\s/g, '');
  };

  const findAllSlackMembers = () => {
    return slackMembers.filter((slackMember) => {
      if (!slackMember.name) {
        return false;
      }
      return normalizeName(slackMember.name).includes(notionMember.name);
    });
  };

  const slackMembers = await getAllSlackMembers();
  const matches = findAllSlackMembers();

  if (matches.length <= 1) {
    return matches[0];
  }

  const similarMatches = [...matches].sort((a, b) => {
    const compareA = normalizeName(a.name!).length - notionMember.name.length;
    const compareB = normalizeName(b.name!).length - notionMember.name.length;
    return compareA - compareB;
  });

  return similarMatches[0];
};
