import { SlashCommand } from '@slack/bolt';
import { objectValues } from '@toss/utils';

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
