import {
  baseDownloadFilePath,
  uploadArchivedMessage,
  uploadArchivedSlackFiles,
  uploadChannelInfo,
  uploadThreadInfo,
} from '@/apis/archive';
import { getChannelBaseInfo } from '@/apis/channel';
import { getAllCustomGroupNames } from '@/apis/group';
import {
  editMessageAsMentionString,
  getAllMessagesInThread,
  getEditBotMessageItSelfBuilder,
} from '@/apis/message';
import { ensureSlackEmojiSetCache } from '@/cache/emoji';
import { ensureSlackMembersCache } from '@/cache/member';
import { slackApp } from '@/core/slack';
import { getUserTokenByMessage } from '@/events/auth';
import { allMemberGroupName } from '@/types/group';
import { SlackMessageEvent } from '@/types/slack';
import {
  extractOnlyUploadableFiles,
  getHeadMessageInThread,
  transformToArchivedMessage,
  transformToPreArchivedMessage,
} from '@/utils/archive';
import { handleError } from '@/utils/error';
import { removeDirectoryWithFilesSync } from '@/utils/file';
import { getSlackMessageEventObject, md } from '@/utils/slack';

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

  const token = await getUserTokenByMessage(message);
  await editMessageAsMentionString({
    message,
    token,
    mentionGroups: context.matches,
  });
};

export const handleArchiveMessage = async ({
  say,
  message,
  silent = false,
}: { silent?: boolean } & SlackMessageEvent) => {
  const getPolymorphicSayFn = () => {
    if (silent) {
      return async ({ text }: { text: string }) => {
        await slackApp.client.chat.postEphemeral({
          channel: message.channel,
          thread_ts: message.thread_ts,
          text,
          user: message.user,
          attachments: [],
        });
        return {
          channel: message.channel,
          ts: message.thread_ts,
        };
      };
    }
    return say;
  };

  const getFailMessage = (fail: Record<string, string>) => {
    const failedNames = Object.values(fail);

    if (failedNames.length === 0) {
      return '';
    }

    const listMessage = Object.values(fail)
      .map((name) => `- ${name}`)
      .join('\n');
    const codeBlockMessage = md.codeBlock(`100MB 이상인 파일들이에요.\n${listMessage}`);

    return `\n${md.inlineEmoji('warning')} 아래 파일 목록은 크기가 너무 커서 업로드에 실패했어요.\n${codeBlockMessage}`;
  };

  const { channel, thread_ts: threadTs } = message;

  if (!threadTs) {
    await say({
      channel,
      text: '아카이브 기능은 쓰레드에서만 사용할 수 있어요.',
    });
    return;
  }

  const token = await getUserTokenByMessage(message);

  const sayFn = getPolymorphicSayFn();
  const botSaid = await sayFn({
    channel,
    thread_ts: threadTs,
    text: `${md.inlineEmoji('loading')} ${md.bold('스레드 아카이빙을 시작해요.')}`,
  });
  const sayAgain = silent
    ? (...to: string[]) => sayFn({ text: to.join(' ') })
    : getEditBotMessageItSelfBuilder({
        channel: botSaid.channel!,
        ts: botSaid.ts!,
      });

  const rawMessages = await getAllMessagesInThread(channel, threadTs);

  await ensureSlackMembersCache();
  await ensureSlackEmojiSetCache();

  try {
    const channelInfo = await getChannelBaseInfo(channel);
    await uploadChannelInfo(channelInfo);

    const preArchivedMessages = await Promise.all(
      rawMessages.map((m) => transformToPreArchivedMessage(message.channel, m))
    );

    const headMessage = getHeadMessageInThread(preArchivedMessages);
    await uploadThreadInfo(headMessage);

    await sayAgain(
      `${md.inlineEmoji('loading')} `,
      md.bold('(2/4) 미디어 파일을 업로드하고 있어요.')
    );

    const { result: keyRecord, fail } = await uploadArchivedSlackFiles({
      token,
      files: extractOnlyUploadableFiles(preArchivedMessages),
    });
    const failMessage = getFailMessage(fail);

    const archivedMessages = preArchivedMessages.map((m) =>
      transformToArchivedMessage(m, keyRecord)
    );

    await sayAgain(
      `${md.inlineEmoji('loading')} `,
      md.bold('(3/4) 스레드 메시지들을 저장하고 있어요.'),
      failMessage
    );

    // Todo: 배치로 만들기
    for await (const message of archivedMessages) {
      await uploadArchivedMessage(message);
    }

    await sayAgain(
      `${md.inlineEmoji('white_check_mark')} `,
      md.bold('아카이빙을 완료했어요.'),
      ' ',
      md.bold(
        md.link(
          `${import.meta.env.VITE_ARCHIVE_CLIENT_PROD_URL}/archives/${channel}/${threadTs}`,
          '[아카이브 링크]'
        )
      ),
      failMessage
    );

    // 사용자가 보낸 !조용히아카이브 메시지 삭제
    silent && slackApp.client.chat.delete({ channel, ts: message.ts, token });
  } catch (e: unknown) {
    const { message: errorMessage, stack: errorStack, type } = await handleError(e);
    await sayAgain(
      `${md.inlineEmoji('warning')} `,
      `${md.bold('스레드 아카이빙 중 오류가 발생했어요.')}\n`,
      md.codeBlock(`${type} / ${errorMessage}: ${errorStack}`)
    );
    removeDirectoryWithFilesSync(baseDownloadFilePath);
    return;
  }
};
