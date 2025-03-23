export type AuthURIPayload = {
  eventId: string;
  message: {
    channel: string;
    team: string;
  };
  user: string;
};
