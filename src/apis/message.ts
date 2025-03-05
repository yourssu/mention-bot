import { Member } from '@slack/web-api/dist/types/response/UsersListResponse';
import { objectEntries } from '@toss/utils';

import { getAllSlackMembers } from '@/apis/member';
import { slackApp } from '@/core/slack';
import {
  AllMemberGroupNameType,
  BaseMemberGroupNameType,
  MemberGroupNameMap,
  NotionMemberPosition,
  NotionMemberStatusType,
  allGroupMembersSuffix,
  nonActiveGroupMembersSuffix,
} from '@/types/member';
import { SlackMessageEvent } from '@/types/slack';
import { findSlackMemberByNotionMember, queryNotionMembers } from '@/utils/member';
import { makeMembersMentionString } from '@/utils/string';

interface EditMessageAsMentionStringProps {
  mentionGroups: AllMemberGroupNameType[];
  message: SlackMessageEvent['message'];
  token: string;
}

export const editMessageAsMentionString = async ({
  message,
  token,
  mentionGroups,
}: EditMessageAsMentionStringProps) => {
  const getPositionByGroupName = (groupName: BaseMemberGroupNameType) => {
    return objectEntries(MemberGroupNameMap).find(([, value]) => value === groupName)?.[0];
  };

  const parseMentionGroupToQuery = (
    group: AllMemberGroupNameType
  ): {
    position: NotionMemberPosition;
    status: NotionMemberStatusType[];
  } => {
    const baseGroupName = group
      .replace(nonActiveGroupMembersSuffix, '')
      .replace(allGroupMembersSuffix, '') as BaseMemberGroupNameType;

    if (group.includes(nonActiveGroupMembersSuffix)) {
      return {
        position: getPositionByGroupName(baseGroupName)!,
        status: ['NON-ACTIVE', '졸업'],
      };
    }

    if (group.includes(allGroupMembersSuffix)) {
      return {
        position: getPositionByGroupName(baseGroupName)!,
        status: ['ACTIVE', 'NON-ACTIVE', '졸업'],
      };
    }

    return {
      position: getPositionByGroupName(baseGroupName)!,
      status: ['ACTIVE'],
    };
  };

  const getSlackMembersByMentionGroup = async (group: AllMemberGroupNameType) => {
    const query = parseMentionGroupToQuery(group);
    const notionMembers = await queryNotionMembers(query);
    const slackMembers = (
      await Promise.all(
        notionMembers.map((member) => {
          return findSlackMemberByNotionMember(member);
        })
      )
    ).filter(Boolean) as Member[];

    return slackMembers;
  };

  await getAllSlackMembers(); // for ensure slack members cached

  const { channel, ts, text } = message;

  let newText = text;
  for await (const group of mentionGroups) {
    const feMembers = await getSlackMembersByMentionGroup(group);
    newText = newText.replace(group, `*\`${group}\`* (${makeMembersMentionString(feMembers)})`);
  }

  await slackApp.client.chat.update({
    channel,
    ts,
    text: newText,
    token,
  });
};
