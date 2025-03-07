import { SlackCommandEvent } from '@/types/slack';
import {
  renderCommandAddCustomGroupModal,
  renderCommandListEphemeralMessage,
} from '@/view/command';

export const handleListCommand = async ({ ack, command }: SlackCommandEvent) => {
  await ack();
  await renderCommandListEphemeralMessage(command);
};

export const handleAddComand = async ({ ack, body }: SlackCommandEvent) => {
  await ack();
  await renderCommandAddCustomGroupModal(body);
};
