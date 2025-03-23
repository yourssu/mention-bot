import { slackApp } from '@/core/slack';
import { assertNonNullish } from '@/utils/assertion';

export const getChannelBaseInfo = async (channelId: string) => {
  const { channel } = await slackApp.client.conversations.info({
    channel: channelId,
  });

  assertNonNullish(channel);
  assertNonNullish(channel.id);
  assertNonNullish(channel.name);

  return {
    id: channel.id,
    name: channel.name,
    description: channel.topic?.value,
  };
};

export type ChannelBaseInfo = Awaited<ReturnType<typeof getChannelBaseInfo>>;
