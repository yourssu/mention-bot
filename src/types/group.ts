import { objectValues } from '@toss/utils';
import { flatMap } from 'es-toolkit';

const groupKeywordSuffix = '@';

export const MemberGroupNameMap = {
  'BACK-END': `${groupKeywordSuffix}be`,
  'WEB-FRONT': `${groupKeywordSuffix}fe`,
  ANDROID: `${groupKeywordSuffix}android`,
  iOS: `${groupKeywordSuffix}ios`,
  'PRODUCT DESIGN': `${groupKeywordSuffix}design`,
  PM: `${groupKeywordSuffix}pm`,
  MARKETING: `${groupKeywordSuffix}marketing`,
  HR: `${groupKeywordSuffix}hr`,
  FINANCE: `${groupKeywordSuffix}finance`,
  LEAD: `${groupKeywordSuffix}lead`,
  VICELEAD: `${groupKeywordSuffix}vicelead`,
  LEGAL: `${groupKeywordSuffix}legal`,
} as const;

export type BaseMemberGroupNameType = (typeof MemberGroupNameMap)[keyof typeof MemberGroupNameMap];

export const BaseMemberGroupKRNameMap: Record<BaseMemberGroupNameType, string> = {
  [`${groupKeywordSuffix}be`]: '백엔드',
  [`${groupKeywordSuffix}android`]: '안드로이드',
  [`${groupKeywordSuffix}ios`]: 'iOS',
  [`${groupKeywordSuffix}design`]: '디자인',
  [`${groupKeywordSuffix}pm`]: 'PM',
  [`${groupKeywordSuffix}fe`]: '프론트엔드',
  [`${groupKeywordSuffix}finance`]: 'Finance',
  [`${groupKeywordSuffix}hr`]: 'HR',
  [`${groupKeywordSuffix}marketing`]: '마케팅',
  [`${groupKeywordSuffix}lead`]: '리드',
  [`${groupKeywordSuffix}vicelead`]: '부리드',
  [`${groupKeywordSuffix}legal`]: 'Legal',
};

export const nonActiveGroupMembersSuffix = '-non-active';
export const allGroupMembersSuffix = '-all';

export const allMemberGroupName = flatMap(
  objectValues(MemberGroupNameMap),
  (groupName) =>
    [
      `${groupName}${allGroupMembersSuffix}`,
      `${groupName}${nonActiveGroupMembersSuffix}`,
      groupName, // 반드시 groupName을 맨 마지막에 둬 주세요. 그렇지 않으면 메시지 정규식에서 모든 키워드가 groupName으로 인식돼요.
    ] as const
);
export type AllMemberGroupNameType = (typeof allMemberGroupName)[number];

export type CustomGroupType = {
  createdAt: number;
  creatorSlackId: string;
  memberSlackIds: string[];
  name: string;
  updatedAt?: number;
  updaterSlackId?: string;
};
