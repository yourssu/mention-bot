import ky, { HTTPError } from 'ky';
import { unlinkSync } from 'node:fs';
import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

import { ChannelBaseInfo } from '@/apis/channel';
import { archiveClient } from '@/apis/client';
import {
  ArchivedMessageItem,
  PreArchivedMessageItem,
  makeChannelBaseInfoUploadFormData,
  makeFileUploadFormData,
  makeMessageUploadFormData,
  makeThreadInfoUploadFormData,
} from '@/utils/archive';
import { assertNonNullish } from '@/utils/assertion';
import { handleError } from '@/utils/error';
import { writeFileEnsureDirectory } from '@/utils/file';

interface MakeDownloadFilePathProps {
  id: string;
  name: string;
}

interface DownloadFileIntoLocalProps {
  path: string;
  token: string;
  url: string;
}

interface UploadDownloadedFileProps {
  id: string;
  path: string;
}

interface UploadArchivedSlackFilesProps {
  files: NonNullable<PreArchivedMessageItem['files']>;
  token: string;
}

export const baseDownloadFilePath = 'static';

export const makeDownloadSlackFilePath = ({ id, name }: MakeDownloadFilePathProps) => {
  return `${baseDownloadFilePath}/${id}-${name}`;
};

export const downloadSlackFileIntoLocal = async ({
  path,
  url,
  token,
}: DownloadFileIntoLocalProps) => {
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const { body } = await ky.get(url, { headers });

  assertNonNullish(body);

  // https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/65542
  const stream = Readable.fromWeb(body as ReadableStream<Uint8Array<ArrayBufferLike>>);
  await writeFileEnsureDirectory(path, stream);
};

export const uploadArchivedSlackFiles = async ({ token, files }: UploadArchivedSlackFilesProps) => {
  // const log = (message: string) => {
  //   console.log(`[${new Date().toString()}]`, message); // eslint-disable-line no-console
  // };

  const result: Record<string, string> = {};
  const fail: Record<string, string> = {};
  for await (const file of files) {
    const { id, name, downloadUrl } = file;
    const path = makeDownloadSlackFilePath({ id, name });

    await downloadSlackFileIntoLocal({
      url: downloadUrl,
      path,
      token,
    });
    const { key, code } = await uploadDownloadedSlackFile({
      id,
      path,
    });

    if (code === 'FILE_TOO_LARGE') {
      fail[id] = name;
    } else {
      result[id] = key;
    }

    unlinkSync(path);
  }
  return { result, fail };
};

export const uploadArchivedMessage = async (message: ArchivedMessageItem) => {
  await archiveClient.post('message/add', {
    body: makeMessageUploadFormData(message),
  });
};

export const uploadDownloadedSlackFile = async ({ id, path }: UploadDownloadedFileProps) => {
  try {
    const res = await archiveClient.put<{ key: string }>('file/upload', {
      body: makeFileUploadFormData({ id, path }),
      timeout: 1000 * 60 * 5, // 5 minutes
    });

    return {
      key: (await res.json()).key,
      code: 'SUCCESS',
    } as const;
  } catch (e) {
    if (e instanceof HTTPError) {
      const { type, error } = await handleError(e);
      if (type === 'KyHTTPError' && error.response.status === 413) {
        return {
          key: '',
          code: 'FILE_TOO_LARGE',
        } as const;
      }
    }
    throw e;
  }
};

export const uploadChannelInfo = async (channelInfo: ChannelBaseInfo) => {
  await archiveClient.post('channel/add', {
    body: makeChannelBaseInfoUploadFormData(channelInfo),
  });
};

export const uploadThreadInfo = async (
  threadInfo: ArchivedMessageItem | PreArchivedMessageItem
) => {
  await archiveClient.post('thread/add', {
    body: makeThreadInfoUploadFormData(threadInfo.channel, threadInfo.ts),
  });
};
