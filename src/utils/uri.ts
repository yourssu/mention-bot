import { AuthURIPayload } from '@/types/auth';

export const makeSlackCallbackUri = (payload: AuthURIPayload) => {
  const uriPayload = encodeURIComponent(JSON.stringify(payload));
  return `http://localhost:3000/auth/slack/callback?payload=${uriPayload}`;
};
