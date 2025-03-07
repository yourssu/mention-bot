import { deleteCustomGroup, upsertCustomGroup } from '@/apis/group';
import { SlackViewEvent } from '@/types/slack';
import { assertNonNullishSoftly } from '@/utils/assertion';
import { querySlackMembersBySlackId } from '@/utils/member';
import {
  renderAddCustomGroupSubmissionErrorEphemeralMessage,
  renderAddCustomGroupSubmissionSuccessEphemeralMessage,
  renderDeleteCustomGroupSubmissionErrorEphemeralMessage,
  renderDeleteCustomGroupSubmissionSuccessEphemeralMessage,
} from '@/view/view';

export const handleAddCustomGroupModalSubmission = async ({ ack, view }: SlackViewEvent) => {
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
  await upsertCustomGroup({
    creatorSlackId: metadata.user,
    name: groupName,
    memberSlackIds: members,
  });
  await renderAddCustomGroupSubmissionSuccessEphemeralMessage({
    channel: metadata.channel,
    user: metadata.user,
    groupName,
    slackMembers,
  });
};

export const handleDeleteCustomGroupModalSubmission = async ({ ack, view }: SlackViewEvent) => {
  const validateForm = () => {
    if (!groupName) {
      return {
        success: false,
        message: '그룹 이름을 선택해주세요.',
      };
    }

    return {
      success: true,
      message: undefined,
    };
  };

  await ack();

  const groupName = view.state.values.deleteGroup_block.deleteGroup_select.selected_options?.map(
    (option) => option.value
  )[0];
  const metadata: {
    channel: string;
    user: string;
  } = JSON.parse(view.private_metadata);

  const { success, message } = validateForm();

  if (!success) {
    await renderDeleteCustomGroupSubmissionErrorEphemeralMessage({
      channel: metadata.channel,
      user: metadata.user,
      errorMessage: message ?? '',
    });
    return;
  }

  assertNonNullishSoftly(groupName);

  await deleteCustomGroup(groupName);
  await renderDeleteCustomGroupSubmissionSuccessEphemeralMessage({
    channel: metadata.channel,
    user: metadata.user,
    groupName,
  });
};
