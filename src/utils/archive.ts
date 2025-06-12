import {
  Attachment,
  BotProfile,
  FileElement,
  MessageElement,
  Reaction,
} from '@slack/web-api/dist/types/response/ConversationsRepliesResponse';
import { readFileSync } from 'fs';
import mime from 'mime';

import { ChannelBaseInfo } from '@/apis/channel';
import { getSlackEmojiSet } from '@/apis/emoji';
import { getAllSlackMembers } from '@/apis/member';
import { assertNonNullish, assertNonNullishSoftly } from '@/utils/assertion';
import { querySlackMembersBySlackId } from '@/utils/member';
import { md } from '@/utils/slack';

const parseReactions = async (reactions: Reaction[]) => {
  const result = [];

  const emojiSet = await getSlackEmojiSet();

  for await (const reaction of reactions) {
    const { users: userIds, name, count } = reaction;

    assertNonNullish(userIds);
    assertNonNullishSoftly(name);
    assertNonNullishSoftly(count);

    const slackMembers = await querySlackMembersBySlackId(userIds);
    result.push({
      name,
      users: slackMembers.map((member) => member.real_name ?? '알 수 없음'),
      count,
      url: emojiSet[name] ?? undefined,
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

const getVariousFileType = (file: FileElement) => {
  if (!file.mimetype) {
    return 'unknown';
  }

  const [ftype] = file.mimetype.toLowerCase().split('/');

  if (ftype === 'image' || ftype === 'video') {
    return ftype;
  }

  return 'unknown';
};

const isUploadableFileType = (file: FileElement) => {
  const ftype = getVariousFileType(file);

  if (ftype === 'unknown') {
    return false;
  }

  return ftype === 'image' || ftype === 'video';
};

const parseFile = (file: FileElement) => {
  const {
    url_private: url,
    url_private_download: downloadUrl,
    original_w: width,
    original_h: height,
    mimetype,
    created,
    id,
    size,
    filetype,
    name,
    thumb_video_h: thumbVideoHeight,
    thumb_video_w: thumbVideoWidth,
  } = file;

  assertNonNullish(url);
  assertNonNullish(downloadUrl);
  assertNonNullish(mimetype);
  assertNonNullish(created);
  assertNonNullish(id);
  assertNonNullish(size);
  assertNonNullish(filetype);
  assertNonNullish(name);

  const fileType = getVariousFileType(file);

  if (fileType === 'image') {
    assertNonNullish(width);
    assertNonNullish(height);

    return {
      name,
      url,
      downloadUrl,
      width,
      height,
      mimetype,
      filetype,
      created,
      id,
      size,
    } as const;
  }

  if (fileType === 'video') {
    assertNonNullish(thumbVideoWidth);
    assertNonNullish(thumbVideoHeight);

    return {
      name,
      url,
      downloadUrl,
      width: thumbVideoWidth,
      height: thumbVideoHeight,
      mimetype,
      filetype,
      created,
      id,
      size,
    } as const;
  }

  return {
    name,
    url,
    downloadUrl,
    mimetype,
    filetype,
    created,
    id,
    size,
  } as const;
};

export const parseMentionInText = async (text: string) => {
  const members = await getAllSlackMembers();

  return text.replace(/<@[^>]+>/g, (match) => {
    const userId = match.trim().slice(2, -1);
    const [member] = members.filter((m) => m.id === userId);

    if (member) {
      return md.userMention(member.real_name ?? '알 수 없음');
    }

    return match;
  });
};

export const parseInlineEmojiInText = async (text: string) => {
  const emojiSet = await getSlackEmojiSet();
  const regex = /(?<!https?:)(?<!\/):([^:\/]+):(?::skin-tone-\d+:)?/g;

  return text.replace(regex, (match) => {
    const emojiName = match.slice(1, -1);
    const emojiUrl = emojiSet[emojiName];

    if (emojiUrl) {
      return md.inlineEmojiWithLink(emojiName, emojiUrl);
    }
    return match;
  });
};

export const parseAttachment = (attachment: Attachment) => {
  const getAttachmentType = ({
    serviceName,
    fromUrl,
  }: {
    fromUrl: string;
    serviceName: string | undefined;
  }) => {
    if (fromUrl.match(/https:\/\/yourssu.slack.com/g)) {
      return 'slack';
    }

    if (serviceName?.toLowerCase() === 'youtube') {
      return 'youtube';
    }

    return 'link';
  };

  const {
    from_url: fromUrl,
    service_icon: serviceIcon,
    original_url: originalUrl,
    text,
    title,
    title_link: titleLink,
    service_name: serviceName,
    is_app_unfurl: isAppUnfurl,
    author_name: authorName,
  } = attachment;

  if (isAppUnfurl) {
    return undefined;
  }

  assertNonNullish(fromUrl);

  const attachmentType = getAttachmentType({
    serviceName,
    fromUrl,
  });

  if (attachmentType === 'slack') {
    const { author_link: authorLink, author_icon: authorIcon, footer, ts } = attachment;

    assertNonNullish(ts);
    assertNonNullish(authorName);
    assertNonNullish(authorLink);
    assertNonNullish(authorIcon);
    assertNonNullish(footer);

    return {
      type: attachmentType,
      url: fromUrl,
      authorName,
      authorLink,
      authorIcon,
      footer,
      text,
      ts,
    } as const;
  }

  assertNonNullish(originalUrl);
  assertNonNullish(title);
  assertNonNullish(titleLink);

  if (attachmentType === 'link') {
    const fallbackedServiceName = serviceName ?? authorName;
    assertNonNullish(fallbackedServiceName);

    return {
      type: attachmentType,
      title,
      url: originalUrl,
      fromUrl,
      serviceIcon,
      text,
      titleLink,
      serviceName: fallbackedServiceName,
      imageUrl: attachment.image_url,
      imageWidth: attachment.image_width,
      imageHeight: attachment.image_height,
    } as const;
  }

  const {
    thumb_url: thumbUrl,
    thumb_width: thumbWidth,
    thumb_height: thumbHeight,
    video_html: videoHTML,
    video_html_width: videoHTMLWidth,
    video_html_height: videoHTMLHeight,
    author_link: authorLink,
    service_url: serviceUrl,
  } = attachment;

  assertNonNullish(serviceName);
  assertNonNullish(thumbUrl);
  assertNonNullish(thumbWidth);
  assertNonNullish(thumbHeight);
  assertNonNullish(videoHTML);
  assertNonNullish(videoHTMLWidth);
  assertNonNullish(videoHTMLHeight);
  assertNonNullish(authorName);
  assertNonNullish(authorLink);
  assertNonNullish(serviceUrl);

  return {
    type: attachmentType,
    title,
    url: originalUrl,
    thumbUrl,
    serviceUrl,
    serviceIcon,
    text,
    titleLink,
    serviceName,
    thumbHeight,
    thumbWidth,
    videoHTML,
    videoHTMLWidth,
    videoHTMLHeight,
    authorName,
    authorLink,
  } as const;
};

export const transformToPreArchivedMessage = async (
  channel: string,
  conversationMessage: MessageElement
) => {
  const {
    user,
    text,
    thread_ts: threadTs,
    ts,
    edited,
    reactions,
    files,
    bot_profile: botProfile,
    attachments,
  } = conversationMessage;

  assertNonNullish(user);
  assertNonNullish(text);
  assertNonNullish(ts);

  return {
    channel,
    ts,
    text: await parseInlineEmojiInText(await parseMentionInText(text)),
    edited: !!edited,
    threadTs: threadTs ?? ts,
    user: botProfile ? parseUserAsBot(botProfile) : await parseUser(user),
    reactions: reactions ? await parseReactions(reactions) : undefined,
    files: files?.filter(isUploadableFileType).map(parseFile),
    attachments: attachments?.map(parseAttachment).filter(Boolean) as
      | Array<NonNullable<ReturnType<typeof parseAttachment>>>
      | undefined,
  };
};

export const extractOnlyUploadableFiles = (archivedMessages: PreArchivedMessageItem[]) => {
  return archivedMessages.flatMap((m) => m.files ?? []);
};

export const transformToUploadedFileId = (
  files: PreArchivedMessageItem['files'],
  keyRecord: Record<string, string>
) => {
  return files
    ?.filter(({ id }) => !!keyRecord[id])
    .map(({ created, filetype, mimetype, name, size, width, height, id }) => {
      const fileId = keyRecord[id];
      return {
        created,
        filetype,
        mimetype,
        name,
        size,
        width,
        height,
        id: fileId,
      };
    });
};

export const transformToArchivedMessage = async (
  preArchivedMessage: PreArchivedMessageItem,
  keyRecord: Record<string, string>
) => {
  return {
    ...preArchivedMessage,
    files: transformToUploadedFileId(preArchivedMessage.files, keyRecord),
  };
};

export const makeMessageUploadFormData = (message: ArchivedMessageItem) => {
  const formData = new FormData();
  formData.append('user', JSON.stringify(message.user));
  formData.append('channel', message.channel);
  formData.append('ts', message.ts);
  formData.append('threadTs', message.threadTs);
  formData.append('edited', message.edited ? 'true' : 'false');
  formData.append('text', message.text);
  message.files && formData.append('files', JSON.stringify(message.files));
  message.reactions && formData.append('reactions', JSON.stringify(message.reactions));
  message.attachments && formData.append('attachments', JSON.stringify(message.attachments));

  return formData;
};

export const makeFileUploadFormData = ({
  id,
  path,
  forceUpload,
}: {
  forceUpload: boolean;
  id: string;
  path: string;
}) => {
  const file = readFileSync(path);
  const mimetype = mime.getType(path);

  assertNonNullish(mimetype);

  const blob = new Blob([file], {
    type: mimetype,
  });

  console.log(`[${new Date().toString()}]`, 'blob: ', blob); // eslint-disable-line no-console

  const formData = new FormData();
  formData.append('file', blob);
  formData.append('id', id);
  formData.append('forceUpload', forceUpload ? 'true' : 'false');

  return formData;
};

export const makeChannelBaseInfoUploadFormData = (channel: ChannelBaseInfo) => {
  const formData = new FormData();
  formData.append('id', channel.id);
  formData.append('name', channel.name);
  channel.description && formData.append('description', channel.description);

  return formData;
};

export const makeThreadInfoUploadFormData = ({
  ts,
  channel,
  metadata,
}: {
  channel: string;
  metadata: ThreadMetadata;
  ts: string;
}) => {
  const formData = new FormData();
  formData.append('ts', ts);
  formData.append('channel', channel);
  formData.append('archivedAt', new Date().toISOString());
  formData.append('metadata', JSON.stringify(metadata));

  return formData;
};

export const getHeadMessageInThread = <
  TMessage extends ArchivedMessageItem | PreArchivedMessageItem,
>(
  messages: TMessage[]
) => {
  const headMessage = messages.find((m) => m.ts === m.threadTs);

  assertNonNullish(headMessage);

  return headMessage;
};

export const getThreadMessagesMetadata = async <
  TMessage extends ArchivedMessageItem | PreArchivedMessageItem,
>(
  messages: TMessage[]
) => {
  const getUniqueUserAvatars = () => {
    const uniqueAvatars = new Map<string, string>();
    messages.forEach((message) => {
      uniqueAvatars.set(message.user.id, message.user.avatar);
    });
    return [...uniqueAvatars.values()];
  };

  return {
    userAvatars: getUniqueUserAvatars(),
    messagesAmount: messages.length,
  };
};

export type PreArchivedMessageItem = Awaited<ReturnType<typeof transformToPreArchivedMessage>>;
export type ArchivedMessageItem = Awaited<ReturnType<typeof transformToArchivedMessage>>;
export type ThreadMetadata = Awaited<ReturnType<typeof getThreadMessagesMetadata>>;
