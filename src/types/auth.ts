import { AllMemberGroupNameType } from '@/types/group';
import { LiteralStringUnion } from '@/types/misc';
import { SlackMessageEvent } from '@/types/slack';

export type AuthURIPayload = {
  mentionGroups: LiteralStringUnion<AllMemberGroupNameType>[];
  message: SlackMessageEvent['message'];
};
