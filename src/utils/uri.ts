import { APP_PORT } from '@/core/slack';
import { AuthURIPayload } from '@/types/auth';

export const makeSlackCallbackUri = (payload: AuthURIPayload) => {
  const getHost = () => {
    if (import.meta.env.VITE_STAGE === 'production') {
      return `http://${import.meta.env.VITE_GCP_INSTANCE_IP}:${APP_PORT}`;
    }
    return `http://localhost:${APP_PORT}`;
  };

  const uriPayload = encodeURIComponent(JSON.stringify(payload));
  return `${getHost()}/auth/slack/callback?payload=${uriPayload}`;
};
