import { SlackCommandEvent } from '@/types/slack';
import { renderCommandListEphemeralMessage } from '@/view/command';

export const handleListCommand = async ({ ack, command }: SlackCommandEvent) => {
  await ack();
  await renderCommandListEphemeralMessage(command);
};
