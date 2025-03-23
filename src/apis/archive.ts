import ky from 'ky';
import { unlinkSync } from 'node:fs';
import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

import { archiveClient } from '@/apis/client';
import {
  ArchivedMessageItem,
  PreArchivedMessageItem,
  makeFileUploadFormData,
  makeMessageUploadFormData,
} from '@/utils/archive';
import { assertNonNullish } from '@/utils/assertion';
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
  const result: Record<string, string> = {};
  for await (const file of files) {
    const { id, name, downloadUrl } = file;
    const path = makeDownloadSlackFilePath({ id, name });

    await downloadSlackFileIntoLocal({
      url: downloadUrl,
      path,
      token,
    });
    const { key } = await uploadDownloadedSlackFile({
      id,
      path,
    });
    result[id] = key;

    unlinkSync(path);
  }
  return result;
};

export const uploadArchivedMessage = async (message: ArchivedMessageItem) => {
  await archiveClient.post('message/add', {
    body: makeMessageUploadFormData(message),
  });
};

export const uploadDownloadedSlackFile = async ({ id, path }: UploadDownloadedFileProps) => {
  const res = await archiveClient.put<{ key: string }>('file/upload', {
    body: makeFileUploadFormData({ id, path }),
  });
  return await res.json();
};
