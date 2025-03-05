import { objectValues } from '@toss/utils';
import { flatMap } from 'es-toolkit';

export const feMemberNames = ['feca'];

export const NotionMemberPosition = [
  'ANDROID',
  'BACK-END',
  'FINANCE',
  'HR',
  'LEAD',
  'LEGAL',
  'MARKETING',
  'PM',
  'PRODUCT DESIGN',
  'VICELEAD',
  'WEB-FRONT',
  'YOURSSU',
  'YOURSSU-LEAD',
  'YOURSSU-VICE LEAD',
  'iOS',
] as const;

export type NotionMemberPosition = (typeof NotionMemberPosition)[number];

export const MemberGroupNameMap = {
  'BACK-END': '@be',
  'WEB-FRONT': '@fe',
  ANDROID: '@android',
  iOS: '@ios',
  'PRODUCT DESIGN': '@design',
  PM: '@pm',
  MARKETING: '@marketing',
  HR: '@hr',
  FINANCE: '@finance',
  LEAD: '@lead',
  VICELEAD: '@vicelead',
  LEGAL: '@legal',
} as const;

export type BaseMemberGroupNameType = (typeof MemberGroupNameMap)[keyof typeof MemberGroupNameMap];

export const BaseMemberGroupKRNameMap: Record<BaseMemberGroupNameType, string> = {
  '@be': '백엔드',
  '@android': '안드로이드',
  '@ios': 'iOS',
  '@design': '디자인',
  '@pm': 'PM',
  '@fe': '프론트엔드',
  '@finance': 'Finance',
  '@hr': 'HR',
  '@marketing': '마케팅',
  '@lead': '리드',
  '@vicelead': '부리드',
  '@legal': 'Legal',
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

export type NotionMemberStatusType = 'ACTIVE' | 'NON-ACTIVE' | '졸업';

export type NotionMember = {
  name: string;
  position: NotionMemberPosition[];
  realName: string | undefined;
  status: NotionMemberStatusType;
};
