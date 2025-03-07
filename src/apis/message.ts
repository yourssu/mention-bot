import { ensureSlackMembersCache } from '@/cache/member';
import { slackApp } from '@/core/slack';
import { AllMemberGroupNameType } from '@/types/group';
import { LiteralStringUnion } from '@/types/misc';
import { SlackMessageEvent } from '@/types/slack';
import { querySlackMembersByMentionGroup } from '@/utils/member';
import { toSlackMemberMentionString } from '@/utils/slack';

interface EditMessageAsMentionStringProps {
  mentionGroups: LiteralStringUnion<AllMemberGroupNameType>[];
  message: SlackMessageEvent['message'];
  token: string;
}

export const editMessageAsMentionString = async ({
  message,
  token,
  mentionGroups,
}: EditMessageAsMentionStringProps) => {
  const parseGroupToMentionString = async (group: LiteralStringUnion<AllMemberGroupNameType>) => {
    const members = await querySlackMembersByMentionGroup(group);
    const fullMentions = members.map((member) => toSlackMemberMentionString(member)).join(' ');
    return `*\`${group}\`* (${fullMentions})`;
  };

  const parseFullText = async (text: string) => {
    let res = text;
    for await (const group of mentionGroups) {
      res = res.replace(group, await parseGroupToMentionString(group));
    }
    return res;
  };

  const { channel, ts, text } = message;

  await ensureSlackMembersCache();

  await slackApp.client.chat.update({
    channel,
    ts,
    text: await parseFullText(text),
    token,
  });
};
