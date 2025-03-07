import { SlackViewEvent } from '@/types/slack';
import { assertNonNullishSoftly } from '@/utils/assertion';
import { querySlackMembersBySlackId } from '@/utils/member';
import {
  renderAddCustomGroupSubmissionErrorEphemeralMessage,
  renderAddCustomGroupSubmissionSuccessEphemeralMessage,
} from '@/view/view';

export const handleAddCustomGroupModalSubmission = async ({ ack, view }: SlackViewEvent) => {
  await ack();

  const validateForm = () => {
    if (!groupName) {
      return {
        success: false,
        message: '그룹 이름을 입력해주세요.',
      };
    }

    if (!members?.length) {
      return {
        success: false,
        message: '그룹에 들어갈 멤버를 선택해주세요.',
      };
    }

    return {
      success: true,
      message: undefined,
    };
  };

  await ack();

  const groupName = view.state.values.writeGroupName_block.writeGroupName_input.value;
  const members = view.state.values.selectMember_block.selectMember_accessory.selected_users;
  const metadata: {
    channel: string;
    user: string;
  } = JSON.parse(view.private_metadata);

  const { success, message } = validateForm();

  if (!success) {
    await renderAddCustomGroupSubmissionErrorEphemeralMessage({
      channel: metadata.channel,
      user: metadata.user,
      errorMessage: message ?? '',
    });
    return;
  }

  assertNonNullishSoftly(members);
  assertNonNullishSoftly(groupName);

  const slackMembers = await querySlackMembersBySlackId(members);
  await renderAddCustomGroupSubmissionSuccessEphemeralMessage({
    channel: metadata.channel,
    user: metadata.user,
    groupName,
    slackMembers,
  });
};
