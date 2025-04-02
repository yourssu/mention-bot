import { getSlackEmojiSet } from '@/apis/emoji';
import { BaseCache } from '@/types/cache';

export const slackEmojiSetCache: BaseCache<Record<string, string>> = {
  expireAt: undefined,
  data: {},
  duration: 5 * 60 * 1000, // 5분
};

export const ensureSlackEmojiSetCache = async () => {
  await getSlackEmojiSet();
};
