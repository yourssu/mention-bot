import { SlackMessageEvent } from '@/types/slack';

type StaticEmojis = 'loading' | 'warning' | 'white_check_mark';

export const md = {
  bold(text: string): string {
    return `*${text}*`;
  },
  italic(text: string): string {
    return `_${text}_`;
  },
  strikeThrough(text: string): string {
    return `~${text}~`;
  },
  code(text: string): string {
    return '`' + text + '`';
  },
  codeBlock(text: string): string {
    return '\n```' + text + '```\n';
  },
  link(url: string, text: string): string {
    return `<${url}|${text}>`;
  },
  userMention(userId: string): string {
    return `<@${userId}>`;
  },
  channelMention(channelId: string): string {
    return `<#${channelId}>`;
  },
  inlineEmoji(emoji: StaticEmojis): string {
    return `:${emoji}:`;
  },
  inlineAnyEmoji(emoji: string): string {
    return `:${emoji}:`;
  },
  // 반드시 아카이빙할때만 사용해요
  inlineEmojiWithLink(emoji: string, url: string): string {
    return `:${url}|:${emoji}::`;
  },
};

/* 
  메시지 생성 / 변경 이벤트에 상관없이 일관된 메시지 이벤트 데이터를 반환해요.
*/
export const getSlackMessageEventObject = (message: SlackMessageEvent['message']) => {
  return message.subtype === 'message_changed'
    ? (message.message as SlackMessageEvent['message'])
    : message;
};

export const getOriginSlackThreadLink = (channel: string, threadTs: string) => {
  return `https://yourssu.slack.com/archives/${channel}/p${threadTs.replace('.', '')}`;
};
