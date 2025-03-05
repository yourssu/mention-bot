import { addMilliseconds } from 'date-fns';

import { BaseCache } from '@/types/cache';

export const cacheWithRequest = async <TData>(
  request: () => Promise<TData>,
  cache: BaseCache<TData>
) => {
  const recache = async () => {
    const data = await request();
    cache.expireAt = addMilliseconds(now, cache.duration).getTime();
    cache.data = data;
    return data;
  };

  const now = new Date();
  const cacheNotSetted = !cache.expireAt;
  const cacheExpired = cache.expireAt && now.getTime() > cache.expireAt;

  if (cacheNotSetted || cacheExpired) {
    return await recache();
  }

  return cache.data;
};
