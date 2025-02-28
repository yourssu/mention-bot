import { getAllMembers } from '@/apis/member';
import { App } from '@/core/app';
import { feMemberNames } from '@/types/member';
import { SlackMessageEvent } from '@/types/slack';
import { makeMembersMentionString } from '@/utils/member';

export const editMessageAsMentionString = async (
  message: SlackMessageEvent['message'],
  token: string
) => {
  const { channel, ts, text } = message;
  const members = await getAllMembers();
  const feMembers = members.filter((member) => {
    const { is_bot: isBot, name } = member;
    return (
      !isBot && feMemberNames.some((feMemberName) => !!name?.toLowerCase().includes(feMemberName))
    );
  });

  const newText = text.replace('@fe', `*\`@fe\`* (${makeMembersMentionString(feMembers)})`);

  await App.client.chat.update({
    channel,
    ts,
    text: newText,
    token,
  });
};
