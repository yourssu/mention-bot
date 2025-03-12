import { createHash } from 'node:crypto';

import { AuthURIPayload } from '@/types/auth';

const payloadStore = new Map<string, AuthURIPayload>();

export const popPayload = (hash: string) => {
  const payload = payloadStore.get(hash);
  payloadStore.delete(hash);
  return payload;
};

export const putPayload = (payload: AuthURIPayload): string => {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(payload));
  const key = hash.digest('hex');
  payloadStore.set(key, payload);
  return key;
};
