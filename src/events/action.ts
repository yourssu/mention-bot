import { SlackActionEvent } from '@/types/slack';

export const handleAuthButtonAction = async ({ ack, respond }: SlackActionEvent) => {
  await ack();
  await respond({ response_type: 'ephemeral', delete_original: true, replace_original: true });
};
