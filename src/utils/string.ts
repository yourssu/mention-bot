import { Member } from '@slack/web-api/dist/types/response/UsersListResponse';

export const makeMembersMentionString = (members: Member[]) => {
  return members.map((member) => `<@${member.id}>`).join(' ');
};
