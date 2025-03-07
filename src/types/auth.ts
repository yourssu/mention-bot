import { AllMemberGroupNameType } from '@/types/group';
import { SlackMessageEvent } from '@/types/slack';

export type AuthURIPayload = {
  mentionGroups: AllMemberGroupNameType[];
  message: SlackMessageEvent['message'];
};
