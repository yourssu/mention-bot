import { slackApp } from '@/core/slack';
import { AuthURIPayload } from '@/types/auth';
import { getSlackCallbackUrl } from '@/utils/slack';

interface GetUserAccessTokenByOAuthProps {
  code: string;
  payload: AuthURIPayload;
}

export const getUserAccessTokenByOAuth = async ({
  code,
  payload,
}: GetUserAccessTokenByOAuthProps) => {
  const res = await slackApp.client.oauth.v2.access({
    client_id: import.meta.env.VITE_SLACK_CLIENT_ID,
    client_secret: import.meta.env.VITE_SLACK_CLIENT_SECRET,
    code,
    redirect_uri: getSlackCallbackUrl(payload),
  });

  return res.authed_user?.access_token;
};
