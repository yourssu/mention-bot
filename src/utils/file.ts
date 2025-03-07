import { WriteFileOptions, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';

export const assertDirectoryExists = (path: string) => {
  mkdirSync(dirname(path), { recursive: true });
};

export const writeFileEnsureDirectorySync = (
  file: string,
  data: NodeJS.ArrayBufferView | string,
  options?: WriteFileOptions
) => {
  assertDirectoryExists(file);
  writeFileSync(file, data, options);
};
