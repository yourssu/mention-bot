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

  const slackMembers = await getAllSlackMembers();

  return slackMembers.find((slackMember) => {
    if (!slackMember.name) {
      return false;
    }
    return normalizeName(slackMember.name).includes(notionMember.name);
  });
};
