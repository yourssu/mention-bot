export const makeSlackCallbackUri = (payload: unknown) => {
  const uriPayload = encodeURIComponent(JSON.stringify(payload));
  return `http://localhost:3000/auth/slack/callback?payload=${uriPayload}`;
};
