import { SlackCommandEvent } from '@/types/slack';
import {
  renderCommandAddCustomGroupModal,
  renderCommandDeleteCustomGroupModal,
  renderCommandListEphemeralMessage,
  renderCustomCommandListEphemeralMessage,
} from '@/view/command';

export const handleListCommand = async ({ ack, command }: SlackCommandEvent) => {
  await ack();
  await renderCommandListEphemeralMessage(command);
};

export const handleAddComand = async ({ ack, body }: SlackCommandEvent) => {
  await ack();
  await renderCommandAddCustomGroupModal(body);
};

export const handleDeleteCommand = async ({ ack, body }: SlackCommandEvent) => {
  await ack();
  await renderCommandDeleteCustomGroupModal(body);
};

export const handleCustomListCommand = async ({ ack, command }: SlackCommandEvent) => {
  await ack();
  await renderCustomCommandListEphemeralMessage(command);
};
