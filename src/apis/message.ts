import { ensureSlackMembersCache } from '@/cache/member';
import { slackApp } from '@/core/slack';
import { AllMemberGroupNameType } from '@/types/group';
import { LiteralStringUnion } from '@/types/misc';
import { SlackMessageEvent } from '@/types/slack';
import { querySlackMembersByMentionGroup } from '@/utils/member';
import { md } from '@/utils/slack';

interface GetEditBotMessageItSelfBuilderProps {
  channel: string;
  ts: string;
}

interface EditMessageAsMentionStringProps {
  mentionGroups: LiteralStringUnion<AllMemberGroupNameType>[];
  message: SlackMessageEvent['message'];
  token: string;
}

export const getEditBotMessageItSelfBuilder = ({
  channel,
  ts,
}: GetEditBotMessageItSelfBuilderProps) => {
  return async (...to: (string | undefined)[]) => {
    await slackApp.client.chat.update({
      channel,
      ts,
      text: to.filter(Boolean).join(''),
      token: import.meta.env.VITE_BOT_USER_OAUTH_TOKEN,
    });
  };
};

export const editMessageAsMentionString = async ({
  message,
  token,
  mentionGroups,
}: EditMessageAsMentionStringProps) => {
  const parseGroupToMentionString = async (group: LiteralStringUnion<AllMemberGroupNameType>) => {
    const members = await querySlackMembersByMentionGroup(group);
    const fullMentions = members.map((member) => md.userMention(member.id ?? '')).join(' ');
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

export const getAllMessagesInThread = async (channel: string, ts: string) => {
  const { messages } = await slackApp.client.conversations.replies({
    channel,
    ts,
    limit: 1000,
  });

  return messages ?? [];
};
