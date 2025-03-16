import {
  BotProfile,
  FileElement,
  MessageElement,
  Reaction,
} from '@slack/web-api/dist/types/response/ConversationsRepliesResponse';

import { getAllCustomGroupNames } from '@/apis/group';
import { editMessageAsMentionString } from '@/apis/message';
import { ensureSlackMembersCache } from '@/cache/member';
import { userTokens } from '@/cache/token';
import { slackApp } from '@/core/slack';
import { allMemberGroupName } from '@/types/group';
import { SlackMessageEvent } from '@/types/slack';
import { assertNonNullish, assertNonNullishSoftly } from '@/utils/assertion';
import { querySlackMembersBySlackId } from '@/utils/member';
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

export const handleArchiveMessage = async ({ say, message }: SlackMessageEvent) => {
  const parseReactions = async (reactions: Reaction[]) => {
    const result = [];
    for await (const reaction of reactions) {
      const { users: userIds, name, count } = reaction;

      assertNonNullish(userIds);
      assertNonNullishSoftly(name);
      assertNonNullishSoftly(count);

      const slackMembers = await querySlackMembersBySlackId(userIds);
      result.push({
        name,
        users: slackMembers.map((member) => member.name ?? '알 수 없음'),
        count,
      });
    }

    return result;
  };

  const parseUser = async (userId: string) => {
    const [user] = await querySlackMembersBySlackId([userId]);

    const { id, real_name: realName, profile } = user;

    assertNonNullish(id);
    assertNonNullish(realName);
    assertNonNullish(profile?.image_72);

    return {
      id,
      isBot: false,
      name: realName,
      avatar: profile.image_72,
    };
  };

  const parseUserAsBot = (botProfile: BotProfile) => {
    const { id, name, icons } = botProfile;

    assertNonNullish(id);
    assertNonNullish(name);
    assertNonNullish(icons?.image_72);

    return {
      id,
      isBot: true,
      name,
      avatar: icons.image_72,
    };
  };

  const parseFile = (file: FileElement) => {
    const {
      url_private: url,
      url_private_download: downloadUrl,
      original_w: width,
      original_h: height,
      mimetype,
      filetype,
      created,
      id,
      size,
    } = file;

    assertNonNullish(url);
    assertNonNullish(downloadUrl);
    assertNonNullish(width);
    assertNonNullish(height);
    assertNonNullish(mimetype);
    assertNonNullish(filetype);
    assertNonNullish(created);
    assertNonNullish(id);
    assertNonNullish(size);

    return {
      url,
      downloadUrl,
      width,
      height,
      mimetype,
      filetype,
      created,
      id,
      size,
    };
  };

  const transformToArchivedMessage = async (conversationMessage: MessageElement) => {
    const {
      user: userId,
      text,
      thread_ts: threadTs,
      ts,
      edited,
      reactions,
      files,
      bot_profile: botProfile,
    } = conversationMessage;

    assertNonNullish(userId);
    assertNonNullish(text);
    assertNonNullish(ts);

    const user = botProfile ? parseUserAsBot(botProfile) : await parseUser(userId);

    return {
      user,
      channel: message.channel,
      ts,
      threadTs: threadTs ?? ts,
      edited: !!edited,
      reactions: reactions ? await parseReactions(reactions) : undefined,
      text,
      files: files?.map(parseFile),
    };
  };

  if (!message.thread_ts) {
    await say({
      channel: message.channel,
      text: '아카이브 기능은 쓰레드에서만 사용할 수 있어요.',
    });
    return;
  }

  // await say({
  //   channel: message.channel,
  //   thread_ts: message.thread_ts,
  //   text: ':loading: *스레드 아카이빙을 시작해요.*',
  // });

  const res = await slackApp.client.conversations.replies({
    channel: 'C8WCKQ4UE',
    ts: '1741757625.471679',
    limit: 1000,
  });

  await ensureSlackMembersCache();

  // TODO: 이 데이터를 d1에 올리기
  await Promise.all((res.messages ?? []).map(transformToArchivedMessage));
};
