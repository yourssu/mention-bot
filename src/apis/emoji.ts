import { readFile } from 'fs/promises';
import { resolve } from 'path';

import { slackEmojiSetCache } from '@/cache/emoji';
import { slackApp } from '@/core/slack';
import { assertNonNullish } from '@/utils/assertion';
import { cacheWithRequest } from '@/utils/cache';

export const getSlackEmojiSet = async () => {
  const requestEmojiSet = async () => {
    const { emoji: customEmojis } = await slackApp.client.emoji.list();
    assertNonNullish(customEmojis);

    const standardEmojis = JSON.parse(
      await readFile(resolve(process.cwd(), 'db', 'emoji_standard.json'), 'utf-8')
    ) as Record<string, string>;

    return {
      ...customEmojis,
      ...standardEmojis,
    };
  };

  return cacheWithRequest(requestEmojiSet, slackEmojiSetCache);
};
