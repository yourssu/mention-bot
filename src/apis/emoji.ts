import { slackEmojiSetCache } from '@/cache/emoji';
import { slackApp } from '@/core/slack';
import { assertNonNullish } from '@/utils/assertion';
import { cacheWithRequest } from '@/utils/cache';

export const getSlackEmojiSet = async () => {
  const requestEmojiSet = async () => {
    const { emoji } = await slackApp.client.emoji.list();
    assertNonNullish(emoji);
    return emoji;
  };

  return cacheWithRequest(requestEmojiSet, slackEmojiSetCache);
};
