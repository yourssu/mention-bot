import { getAllCustomGroupNames } from '@/apis/group';
import { editMessageAsMentionString } from '@/apis/message';
import { userTokens } from '@/cache/token';
import { slackApp } from '@/core/slack';
import { allMemberGroupName } from '@/types/group';
import { SlackMessageEvent } from '@/types/slack';
import { getSlackMessageEventObject } from '@/utils/slack';
import { renderAuthEphemeralMessage } from '@/view/auth';

/* 
  동적으로 변경되는 커스텀 그룹을 필터링하기 위해 모든 메시지를 받고,
  미들웨어를 통해 커스텀 그룹 키워드가 포함된 메시지를 직접 처리해요.
*/
export const detectGroupKeywordMessage = async ({
  message: slackMessage,
  context,
  next,
}: SlackMessageEvent) => {
  const message = getSlackMessageEventObject(slackMessage as SlackMessageEvent['message']);
  const text = (message as SlackMessageEvent['message']).text;

  const allGroupNames = [...getAllCustomGroupNames(), ...allMemberGroupName].sort((a, b) => {
    if (a.includes(b)) {
      return -1;
    }
    if (b.includes(a)) {
      return 1;
    }
    return 0;
  });
  const groupRegex = new RegExp(allGroupNames.join('|'), 'g');
  const matches = text.match(groupRegex);

  if (!!matches?.length) {
    context.matches = matches; // 매칭한 그룹 키워드를 컨텍스트에 저장해서 다음 미들웨어에서 사용해요.
    await next();
  }
};

export const handleGroupKeywordMessage = async ({
  message: slackMessage,
  context,
}: SlackMessageEvent) => {
  const message = getSlackMessageEventObject(slackMessage);
  const userToken = userTokens.get(message.user);

  if (!userToken) {
    await renderAuthEphemeralMessage({ message, mentionGroups: context.matches });
    return;
  }

  const res = await slackApp.client.auth.test({ token: userToken });
  if (!res.ok) {
    await renderAuthEphemeralMessage({ message, mentionGroups: context.matches });
    return;
  }

  await editMessageAsMentionString({ message, token: userToken, mentionGroups: context.matches });
};
