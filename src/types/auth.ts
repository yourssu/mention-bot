import { AllMemberGroupNameType } from '@/types/member';
import { SlackMessageEvent } from '@/types/slack';

export type AuthURIPayload = {
  mentionGroups: AllMemberGroupNameType[];
  message: SlackMessageEvent['message'];
};
