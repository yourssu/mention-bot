import { SlashCommand } from '@slack/bolt';
import { objectEntries, objectValues } from '@toss/utils';

import { getAllCustomGroupNames } from '@/apis/group';
import { getAllSlackMembers } from '@/apis/member';
import { customGroups } from '@/cache/group';
import { stage } from '@/config';
import { slackApp } from '@/core/slack';
import {
  AllMemberGroupNameType,
  BaseMemberGroupKRNameMap,
  BaseMemberGroupNameType,
  MemberGroupNameMap,
  allGroupMembersSuffix,
  allMemberGroupName,
  nonActiveGroupMembersSuffix,
} from '@/types/group';

export const renderCommandAddCustomGroupModal = async (body: SlashCommand) => {
  await slackApp.client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: 'addCustomGroup',
      title: {
        type: 'plain_text',
        text: '멘션 그룹 추가',
      },
      blocks: [
        {
          type: 'input',
          block_id: 'writeGroupName_block',
          label: {
            type: 'plain_text',
            text: '추가할 멘션 그룹 이름을 입력해주세요',
          },
          hint: {
            type: 'plain_text',
            text: '@를 제외한 그룹 이름을 작성해주세요. 키워드 사이의 공백은 반드시 -로 대체해주세요.',
          },
          element: {
            type: 'plain_text_input',
            action_id: 'writeGroupName_input',
            multiline: false,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          block_id: 'selectMember_block',
          text: {
            type: 'mrkdwn',
            text: '이 그룹에 포함될 멤버들을 선택해주세요',
          },
          accessory: {
            action_id: 'selectMember_accessory',
            type: 'multi_users_select',
            placeholder: {
              type: 'plain_text',
              text: '멤버를 선택해주세요...',
            },
          },
        },
      ],
      submit: {
        type: 'plain_text',
        text: '그룹 만들기',
      },
      private_metadata: JSON.stringify({
        channel: body.channel_id,
        user: body.user_id,
      }),
    },
  });
};

export const renderCommandDeleteCustomGroupModal = async (body: SlashCommand) => {
  const allCustomGroupNames = getAllCustomGroupNames();

  if (allCustomGroupNames.length === 0) {
    await slackApp.client.chat.postEphemeral({
      channel: body.channel_id,
      user: body.user_id,
      text: '삭제할 멘션 그룹이 없어요. /add 명령어로 멘션 그룹을 추가해주세요.',
    });
    return;
  }

  await slackApp.client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: 'deleteCustomGroup',
      title: {
        type: 'plain_text',
        text: '멘션 그룹 제거',
      },
      blocks: [
        {
          type: 'section',
          block_id: 'deleteGroup_block',
          text: {
            type: 'mrkdwn',
            text: '제거할 멘션 그룹을 선택해주세요',
          },
          accessory: {
            type: 'multi_static_select',
            action_id: 'deleteGroup_select',
            max_selected_items: 1,
            placeholder: {
              type: 'plain_text',
              text: '멘션 그룹을 선택해주세요...',
            },
            options: allCustomGroupNames.map((groupName) => ({
              text: {
                type: 'plain_text',
                text: groupName,
              },
              value: groupName,
            })),
          },
        },
      ],
      submit: {
        type: 'plain_text',
        text: '제거',
      },
      private_metadata: JSON.stringify({
        channel: body.channel_id,
        user: body.user_id,
      }),
    },
  });
};

export const renderCommandListEphemeralMessage = async (command: SlashCommand) => {
  const makeDescription = (groupKRName: string, groupName: AllMemberGroupNameType) => {
    if (groupName.includes(allGroupMembersSuffix)) {
      return `모든 ${groupKRName}팀을 멤버들을 멘션해요.`;
    }

    if (groupName.includes(nonActiveGroupMembersSuffix)) {
      return `${groupKRName}팀의 비액티브 멤버들을 멘션해요.`;
    }

    return `${groupKRName}팀의 액티브 멤버들을 멘션해요.`;
  };

  const makeBlock = (data: { description: string; title: string }[]) => ({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: data.map(({ title, description }) => ` - *\`${title}\`* : ${description}`).join('\n'),
    },
  });

  const makeSection = (baseGroupName: BaseMemberGroupNameType) => [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${BaseMemberGroupKRNameMap[baseGroupName]}* 팀`,
      },
    },
    makeBlock(
      allMemberGroupName
        .filter((name) => name.includes(baseGroupName))
        .map((name) => ({
          title: name,
          description: makeDescription(BaseMemberGroupKRNameMap[baseGroupName], name),
        }))
    ),
    {
      type: 'divider',
    },
  ];

  const listBlocks = objectValues(MemberGroupNameMap).flatMap((name) => makeSection(name));

  await slackApp.client.chat.postEphemeral({
    channel: command.channel_id,
    user: command.user_id,
    blocks:
      stage === 'development'
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*[개발]*\n\n',
              },
            },
            ...listBlocks,
          ]
        : listBlocks,
  });
};

export const renderCustomCommandListEphemeralMessage = async (command: SlashCommand) => {
  const makeDescription = (memberSlackIds: string[]) => {
    const slackMemberNames = memberSlackIds.map((slackId) => {
      const slackMember = allSlackMembers.find(({ id }) => id === slackId);
      return slackMember?.name;
    });
    return slackMemberNames.filter(Boolean).join(', ');
  };

  const makeBlock = ({ title, description }: { description: string; title: string }) => ({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: ` - *\`${title}\`* : ${description}`,
    },
  });

  const allSlackMembers = await getAllSlackMembers();

  const listBlocks = objectEntries(Object.fromEntries(customGroups)).map(
    ([groupName, { memberSlackIds }]) =>
      makeBlock({
        title: groupName,
        description: makeDescription(memberSlackIds),
      })
  );

  await slackApp.client.chat.postEphemeral({
    channel: command.channel_id,
    user: command.user_id,
    blocks:
      listBlocks.length === 0
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '생성된 멘션 그룹이 없어요. /add 명령어로 멘션 그룹을 만들 수 있어요.',
              },
            },
          ]
        : listBlocks,
  });
};
