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

export type NotionMemberStatusType = 'ACTIVE' | 'NON-ACTIVE' | '졸업';

export type NotionMember = {
  name: string;
  position: NotionMemberPosition[];
  status: NotionMemberStatusType;
};
