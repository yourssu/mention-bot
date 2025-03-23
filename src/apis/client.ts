import ky from 'ky';

export const archiveClient = ky.create({
  prefixUrl: import.meta.env.VITE_ARCHIVE_SERVER_URL,
});
