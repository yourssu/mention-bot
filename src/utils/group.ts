import { objectEntries } from '@toss/utils';

import {
  AllMemberGroupNameType,
  BaseMemberGroupNameType,
  MemberGroupNameMap,
  allGroupMembersSuffix,
  allMemberGroupName,
  nonActiveGroupMembersSuffix,
} from '@/types/group';
import { LiteralStringUnion } from '@/types/misc';
import { QueryNotionMembersProps } from '@/utils/member';

export const getPositionByGroupName = (groupName: BaseMemberGroupNameType) => {
  return objectEntries(MemberGroupNameMap).find(([, value]) => value === groupName)?.[0];
};

export const isNonCustomGroup = (
  group: LiteralStringUnion<AllMemberGroupNameType>
): group is AllMemberGroupNameType => {
  return allMemberGroupName.some((name) => group === name);
};

export const parseMentionGroupToNotionMembersQuery = (
  group: AllMemberGroupNameType
): Required<QueryNotionMembersProps> => {
  const isNonActive = group.includes(nonActiveGroupMembersSuffix);
  const isAll = group.includes(allGroupMembersSuffix);

  const baseGroupName = group
    .replace(nonActiveGroupMembersSuffix, '')
    .replace(allGroupMembersSuffix, '') as BaseMemberGroupNameType;

  if (isNonActive) {
    return {
      position: getPositionByGroupName(baseGroupName)!,
      status: ['NON-ACTIVE', '졸업'],
    };
  }

  if (isAll) {
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
